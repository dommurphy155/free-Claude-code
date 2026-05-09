#!/usr/bin/env python3
"""
simple_bridge.py v4.0.0
Anthropic API → OpenAI-compat bridge via Keymaster → NVIDIA NIM

Claude Code → /v1/messages → convert → Keymaster → NVIDIA NIM → Anthropic SSE
"""

import asyncio
import json
import logging
import os
import re
import sys
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

KEYMASTER_URL = os.getenv("KEYMASTER_URL", "http://127.0.0.1:8787")
DEFAULT_MODEL = "qwen/qwen3.5-397b-a17b"

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [BRIDGE] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stderr,
)
log = logging.getLogger("bridge")

MODEL_MAP: dict[str, str] = {
    "claude-opus-4-6":            DEFAULT_MODEL,
    "claude-opus-4-7":            DEFAULT_MODEL,
    "opus":                       DEFAULT_MODEL,
    "claude-sonnet-4-6":          DEFAULT_MODEL,
    "claude-sonnet-4-5":          DEFAULT_MODEL,
    "claude-3-5-sonnet":          DEFAULT_MODEL,
    "claude-3-5-sonnet-20241022": DEFAULT_MODEL,
    "sonnet":                     DEFAULT_MODEL,
    "claude-haiku-4-5":           DEFAULT_MODEL,
    "claude-haiku-4-5-20251001":  DEFAULT_MODEL,
    "claude-3-5-haiku":           DEFAULT_MODEL,
    "claude-3-5-haiku-20241022":  DEFAULT_MODEL,
    "claude-3-haiku-20240307":    DEFAULT_MODEL,
    "haiku":                      DEFAULT_MODEL,
}

# Anthropic server-side tool types with no OpenAI equivalent — strip them
_STRIP_TOOL_TYPES = frozenset({
    "web_search_20250305",
    "computer_20251022",
    "bash_20250124",
    "text_editor_20250124",
})

# ─────────────────────────────────────────────────────────────────────────────
# HTTP client
# ─────────────────────────────────────────────────────────────────────────────

http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(300.0, connect=10.0, read=120.0, write=30.0, pool=60.0),
        limits=httpx.Limits(max_connections=200, max_keepalive_connections=50),
        follow_redirects=True,
        http2=True,
    )
    log.info("HTTP client ready → %s", KEYMASTER_URL)
    yield
    await http_client.aclose()
    log.info("HTTP client closed")


app = FastAPI(title="simple_bridge", version="4.0.0", lifespan=lifespan)

# ─────────────────────────────────────────────────────────────────────────────
# Schema sanitisation
# ─────────────────────────────────────────────────────────────────────────────

def _sanitize_schema(schema: object) -> dict:
    """Recursively sanitise JSON Schema for NVIDIA NIM compatibility."""
    if not isinstance(schema, dict):
        return {}
    out: dict = {}
    for k, v in schema.items():
        if isinstance(v, dict):
            out[k] = _sanitize_schema(v)
        elif isinstance(v, list):
            if k == "type":
                non_null = [t for t in v if t != "null"]
                out[k] = non_null[0] if non_null else "string"
            else:
                out[k] = [_sanitize_schema(i) if isinstance(i, dict) else i for i in v]
        else:
            out[k] = v
    if "properties" in out and "type" not in out:
        out["type"] = "object"
    return out

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

_ID_CLEAN = re.compile(r"[^a-zA-Z0-9]")

def _clean_tool_id(raw: str | None) -> str:
    cleaned = _ID_CLEAN.sub("x", raw or "")
    return cleaned[:9].ljust(9, "0")


def _flatten_text(blocks: list[dict]) -> str:
    return "\n".join(b.get("text", "") for b in blocks if isinstance(b, dict))

# ─────────────────────────────────────────────────────────────────────────────
# Message conversion: Anthropic → OpenAI
# ─────────────────────────────────────────────────────────────────────────────

def convert_messages(body: dict) -> list[dict]:
    msgs: list[dict] = []

    # System prompt
    system = body.get("system", "")
    if isinstance(system, list):
        system = _flatten_text(system)
    if system:
        msgs.append({"role": "system", "content": system})

    for msg in body.get("messages", []):
        role    = msg.get("role", "user")
        content = msg.get("content", "")

        # Plain string — pass through
        if not isinstance(content, list):
            msgs.append({
                "role":    "assistant" if role == "assistant" else "user",
                "content": str(content),
            })
            continue

        # Strip thinking blocks
        content = [b for b in content if isinstance(b, dict) and b.get("type") != "thinking"]

        tool_uses    = [b for b in content if b.get("type") == "tool_use"]
        tool_results = [b for b in content if b.get("type") == "tool_result"]
        text_parts   = [b.get("text", "") for b in content if b.get("type") == "text"]

        # Assistant with tool calls
        if tool_uses and role == "assistant":
            tool_calls = []
            for tu in tool_uses:
                raw_input = tu.get("input", {})
                arguments = raw_input if isinstance(raw_input, str) else json.dumps(raw_input)
                tool_calls.append({
                    "id":       _clean_tool_id(tu.get("id")),
                    "type":     "function",
                    "function": {
                        "name":      tu.get("name", ""),
                        "arguments": arguments,
                    },
                })
            msgs.append({
                "role":       "assistant",
                "content":    "\n".join(text_parts) if text_parts else "",
                "tool_calls": tool_calls,
            })
            continue

        # Tool results
        if tool_results:
            for tr in tool_results:
                tr_content = tr.get("content", "")
                if isinstance(tr_content, list):
                    tr_content = _flatten_text(tr_content)
                msgs.append({
                    "role":         "tool",
                    "tool_call_id": _clean_tool_id(tr.get("tool_use_id")),
                    "content":      str(tr_content),
                })
            # Any real user text alongside tool results
            real = [t for t in text_parts if t.strip() and not t.strip().startswith("<system-reminder")]
            if real:
                msgs.append({"role": "user", "content": real[-1].strip()})
            continue

        # Plain text
        msgs.append({
            "role":    "assistant" if role == "assistant" else "user",
            "content": "\n".join(text_parts),
        })

    return msgs


def build_openai_body(body: dict, anthropic_model: str) -> dict:
    model = MODEL_MAP.get(anthropic_model, DEFAULT_MODEL)
    openai_body: dict = {
        "model":       model,
        "messages":    convert_messages(body),
        "max_tokens":  body.get("max_tokens", 8192),
        "temperature": body.get("temperature", 0.6),
        "stream":      False,  # set per-request below
    }

    raw_tools = [t for t in body.get("tools", []) if t.get("type") not in _STRIP_TOOL_TYPES]
    if raw_tools:
        function_tools = []
        for t in raw_tools:
            schema = _sanitize_schema(t.get("input_schema") or {})
            schema.setdefault("type", "object")
            schema.setdefault("properties", {})
            function_tools.append({
                "type": "function",
                "function": {
                    "name":        t["name"],
                    "description": t.get("description", ""),
                    "parameters":  schema,
                },
            })
        if function_tools:
            openai_body["tools"]       = function_tools
            openai_body["tool_choice"] = "auto"

    return openai_body

# ─────────────────────────────────────────────────────────────────────────────
# Inline tool call parsers (model-specific fallbacks)
# ─────────────────────────────────────────────────────────────────────────────

# Qwen3 <tool_call>...</tool_call>
_QWEN_TOOL_RE = re.compile(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", re.DOTALL)

# Kimi K2 <|tool_calls_section_begin|>...<|tool_call_end|>
_KIMI_TOOL_RE = re.compile(
    r"<\|tool_calls_section_begin\|>.*?<\|tool_call_begin\|>\s*functions\.(\w+)\s*<\|tool_sep\|>(.*?)<\|tool_call_end\|>",
    re.DOTALL,
)


def _parse_inline_tool_calls(text: str) -> dict[int, dict]:
    """Try Qwen3 then Kimi markup. Returns {idx: {id, name, arguments}}."""
    chunks: dict[int, dict] = {}

    # Qwen3
    if "<tool_call>" in text:
        for i, m in enumerate(_QWEN_TOOL_RE.finditer(text)):
            try:
                payload = json.loads(m.group(1))
                chunks[i] = {
                    "id":        f"call_{uuid.uuid4().hex[:8]}",
                    "name":      payload.get("name", ""),
                    "arguments": json.dumps(payload.get("arguments", payload.get("parameters", {}))),
                }
            except json.JSONDecodeError:
                log.warning("Failed to parse Qwen tool call: %s", m.group(1)[:80])
        if chunks:
            log.info("Parsed %d Qwen3 inline tool calls", len(chunks))
            return chunks

    # Kimi K2 fallback
    if "<|tool_calls_section_begin|>" in text:
        for i, m in enumerate(_KIMI_TOOL_RE.finditer(text)):
            chunks[i] = {
                "id":        f"call_{uuid.uuid4().hex[:8]}",
                "name":      m.group(1),
                "arguments": m.group(2).strip(),
            }
        if chunks:
            log.info("Parsed %d Kimi inline tool calls", len(chunks))

    return chunks

# ─────────────────────────────────────────────────────────────────────────────
# SSE helpers
# ─────────────────────────────────────────────────────────────────────────────

def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

# ─────────────────────────────────────────────────────────────────────────────
# Core stream
# ─────────────────────────────────────────────────────────────────────────────

async def _stream(
    request_id: str,
    anthropic_model: str,
    openai_body: dict,
) -> AsyncIterator[str]:
    msg_id = f"msg_{uuid.uuid4().hex[:12]}"

    yield _sse("message_start", {
        "type": "message_start",
        "message": {
            "id": msg_id, "type": "message", "role": "assistant",
            "content": [], "model": anthropic_model,
            "usage": {"input_tokens": 0, "output_tokens": 0},
        },
    })
    yield _sse("content_block_start", {
        "type": "content_block_start", "index": 0,
        "content_block": {"type": "text", "text": ""},
    })

    full_content = ""
    tool_call_chunks: dict[int, dict] = {}

    try:
        openai_body["stream"] = True
        async with http_client.stream(
            "POST",
            f"{KEYMASTER_URL}/v1/chat/completions",
            json=openai_body,
            headers={"Content-Type": "application/json"},
            timeout=httpx.Timeout(600.0),
        ) as resp:

            if resp.status_code != 200:
                err = await resp.aread()
                log.error("[%s] upstream HTTP %d: %s", request_id, resp.status_code, err[:300])
                err_text = f"[Bridge] Upstream error {resp.status_code}: {err[:200].decode(errors='replace')}"
                yield _sse("content_block_delta", {
                    "type": "content_block_delta", "index": 0,
                    "delta": {"type": "text_delta", "text": err_text},
                })
            else:
                async for raw_line in resp.aiter_lines():
                    if not raw_line.startswith("data: "):
                        continue
                    payload = raw_line[6:].strip()
                    if payload == "[DONE]":
                        break
                    try:
                        chunk  = json.loads(payload)
                        choice = (chunk.get("choices") or [{}])[0]
                        delta  = choice.get("delta") or {}

                        text = delta.get("content") or ""
                        if text:
                            full_content += text
                            yield _sse("content_block_delta", {
                                "type": "content_block_delta", "index": 0,
                                "delta": {"type": "text_delta", "text": text},
                            })

                        for tc in delta.get("tool_calls") or []:
                            idx = tc.get("index", 0)
                            if idx not in tool_call_chunks:
                                tool_call_chunks[idx] = {
                                    "id":        tc.get("id") or f"call_{uuid.uuid4().hex[:8]}",
                                    "name":      "",
                                    "arguments": "",
                                }
                            fn = tc.get("function") or {}
                            tool_call_chunks[idx]["name"]      += fn.get("name", "")
                            tool_call_chunks[idx]["arguments"] += fn.get("arguments", "")

                    except Exception as e:
                        log.debug("[%s] chunk parse error: %s", request_id, e)

    except Exception as e:
        log.error("[%s] stream error: %s", request_id, e)

    # Inline tool call fallback
    if not tool_call_chunks:
        tool_call_chunks = _parse_inline_tool_calls(full_content)
        if tool_call_chunks:
            full_content = ""

    yield _sse("content_block_stop", {"type": "content_block_stop", "index": 0})

    if tool_call_chunks:
        log.info("[%s] tool_chunks=%s", request_id, list(tool_call_chunks.keys()))
        for i, (_, tc) in enumerate(sorted(tool_call_chunks.items()), start=1):
            yield _sse("content_block_start", {
                "type": "content_block_start", "index": i,
                "content_block": {"type": "tool_use", "id": tc["id"], "name": tc["name"], "input": {}},
            })
            yield _sse("content_block_delta", {
                "type": "content_block_delta", "index": i,
                "delta": {"type": "input_json_delta", "partial_json": tc["arguments"]},
            })
            yield _sse("content_block_stop", {"type": "content_block_stop", "index": i})
        stop_reason = "tool_use"
    else:
        stop_reason = "end_turn"

    yield _sse("message_delta", {
        "type": "message_delta",
        "delta": {"stop_reason": stop_reason},
        "usage": {"input_tokens": 0, "output_tokens": max(1, len(full_content) // 4)},
    })
    yield _sse("message_stop", {"type": "message_stop"})

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "keymaster": KEYMASTER_URL, "model": DEFAULT_MODEL, "version": "4.0.0"}


@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [
            {"id": m, "object": "model", "created": 1700000000, "owned_by": "anthropic"}
            for m in MODEL_MAP
        ],
    }


@app.get("/v1/models/{model_id:path}")
async def get_model(model_id: str):
    return {"id": model_id, "object": "model", "created": 1700000000, "owned_by": "anthropic"}


@app.api_route("/{path:path}", methods=["HEAD", "GET"])
async def catch_all(path: str):
    return JSONResponse(status_code=200, content={"status": "ok"})


@app.post("/v1/messages")
async def messages(request: Request):
    request_id      = uuid.uuid4().hex[:8]
    anthropic_model = "unknown"

    try:
        body            = await request.json()
        anthropic_model = body.get("model", "sonnet")
        stream          = body.get("stream", False)

        log.info("[%s] model=%s stream=%s", request_id, anthropic_model, stream)

        openai_body = build_openai_body(body, anthropic_model)

        # ── Streaming response ────────────────────────────────────────────
        if stream:
            return StreamingResponse(
                _stream(request_id, anthropic_model, openai_body),
                media_type="text/event-stream",
                headers={
                    "Cache-Control":    "no-cache",
                    "Connection":       "keep-alive",
                    "X-Accel-Buffering":"no",
                },
            )

        # ── Non-streaming: collect SSE then return JSON ───────────────────
        full_text             = ""
        tool_call_chunks: dict = {}
        stop_reason           = "end_turn"
        msg_id                = f"msg_{uuid.uuid4().hex[:12]}"

        async for frame in _stream(request_id, anthropic_model, openai_body):
            for part in frame.split("\n"):
                if not part.startswith("data: "):
                    continue
                try:
                    data = json.loads(part[6:])
                    t    = data.get("type", "")
                    if t == "content_block_start":
                        cb = data.get("content_block", {})
                        if cb.get("type") == "tool_use":
                            idx = data.get("index", 1) - 1
                            tool_call_chunks[idx] = {"id": cb["id"], "name": cb["name"], "arguments": ""}
                    elif t == "content_block_delta":
                        delta = data.get("delta", {})
                        if delta.get("type") == "text_delta":
                            full_text += delta.get("text", "")
                        elif delta.get("type") == "input_json_delta":
                            idx = data.get("index", 1) - 1
                            if idx in tool_call_chunks:
                                tool_call_chunks[idx]["arguments"] += delta.get("partial_json", "")
                    elif t == "message_delta":
                        stop_reason = data.get("delta", {}).get("stop_reason", "end_turn")
                except Exception:
                    pass

        content_blocks = []
        if tool_call_chunks:
            if full_text:
                content_blocks.append({"type": "text", "text": full_text})
            for idx, tc in sorted(tool_call_chunks.items()):
                try:
                    input_data = json.loads(tc["arguments"])
                except Exception:
                    input_data = {}
                content_blocks.append({
                    "type": "tool_use", "id": tc["id"],
                    "name": tc["name"], "input": input_data,
                })
        else:
            content_blocks.append({"type": "text", "text": full_text})

        return JSONResponse(content={
            "id":          msg_id,
            "type":        "message",
            "role":        "assistant",
            "content":     content_blocks,
            "model":       anthropic_model,
            "stop_reason": stop_reason,
            "usage":       {"input_tokens": 0, "output_tokens": max(1, len(full_text) // 4)},
        })

    except Exception as e:
        import traceback
        log.error("[%s] ERROR: %s\n%s", request_id, e, traceback.format_exc()[:600])
        return JSONResponse(status_code=500, content={
            "id":          f"msg_{request_id}",
            "type":        "message",
            "role":        "assistant",
            "content":     [{"type": "text", "text": f"Bridge Error: {e}"}],
            "model":       anthropic_model,
            "stop_reason": "error",
        })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8789, log_level="warning")
