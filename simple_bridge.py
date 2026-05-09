#!/usr/bin/env python3
"""
Claude Code Bridge with Playwright-based Browser Automation
Connects Anthropic API to Keymaster (NVIDIA) with multi-step browser task support.
"""

import json
import os
import sys
import re
import uuid
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx

KEYMASTER_URL = os.getenv("KEYMASTER_URL", "http://127.0.0.1:8787")

# =============================================================================
# MODEL CONFIG - change DEFAULT_MODEL to switch all mappings at once
# =============================================================================
DEFAULT_MODEL = "moonshotai/Kimi-K2.6"

MODEL_MAP = {
    "claude-sonnet-4-6":        DEFAULT_MODEL,
    "claude-opus-4-6":          DEFAULT_MODEL,
    "claude-haiku-4-5":         DEFAULT_MODEL,
    "claude-haiku-4-5-20251001": DEFAULT_MODEL,
    "sonnet":                   DEFAULT_MODEL,
    "opus":                     DEFAULT_MODEL,
    "haiku":                    DEFAULT_MODEL,
}

http_client: httpx.AsyncClient = None


# =============================================================================
# FASTAPI APP
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(300.0, connect=10.0, read=120.0, write=30.0, pool=60.0),
        limits=httpx.Limits(max_connections=200, max_keepalive_connections=50),
        follow_redirects=True,
        http2=True
    )
    print("[BRIDGE] HTTP client started with HTTP/2", file=sys.stderr, flush=True)

    try:
        await http_client.get(f"{KEYMASTER_URL}/health", timeout=5.0)
        print("[BRIDGE] Keymaster connection warmed up", file=sys.stderr, flush=True)
    except:
        pass

    yield
    await http_client.aclose()
    print("[BRIDGE] HTTP client closed", file=sys.stderr, flush=True)

app = FastAPI(lifespan=lifespan)


# =============================================================================
# MESSAGE CONVERSION
# =============================================================================

def convert_messages(body):
    msgs = []
    if "system" in body:
        system = body["system"]
        if isinstance(system, list):
            system = "\n".join(b.get("text", "") for b in system if isinstance(b, dict))
        msgs.append({"role": "system", "content": system})

    for msg in body.get("messages", []):
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if isinstance(content, list):
            content = [b for b in content if isinstance(b, dict) and b.get("type") != "thinking"]
            tool_results = [b for b in content if isinstance(b, dict) and b.get("type") == "tool_result"]
            tool_uses = [b for b in content if isinstance(b, dict) and b.get("type") == "tool_use"]
            text_parts = [b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text"]

            if tool_uses and role == "assistant":
                msgs.append({
                    "role": "assistant",
                    "content": "\n".join(text_parts) if text_parts else None,
                    "tool_calls": [
                        {
                            "id": tu.get("id", "call_0"),
                            "type": "function",
                            "function": {"name": tu.get("name", ""), "arguments": json.dumps(tu.get("input", {}))}
                        }
                        for tu in tool_uses
                    ]
                })
                continue

            if tool_results:
                for tr in tool_results:
                    tr_content = tr.get("content", "")
                    if isinstance(tr_content, list):
                        tr_content = "\n".join(b.get("text", "") for b in tr_content if isinstance(b, dict))
                    msgs.append({"role": "tool", "tool_call_id": tr.get("tool_use_id", "call_0"), "content": tr_content})
                if text_parts:
                    real_parts = [t for t in text_parts if not t.strip().startswith("<system-reminder")]
                    if real_parts:
                        msgs.append({"role": "user", "content": real_parts[-1].strip()})
                continue

            content = "\n".join(text_parts)

        msgs.append({"role": "assistant" if role == "assistant" else "user", "content": content})

    return msgs


def build_openai_body(body, anthropic_model):
    model = MODEL_MAP.get(anthropic_model, DEFAULT_MODEL)

    openai_body = {
        "model": model,
        "messages": convert_messages(body),
        "max_tokens": body.get("max_tokens", 4096),
        "temperature": body.get("temperature", 0.7),
        "stream": body.get("stream", False)
    }

    tools = list(body.get("tools", []))

    if tools:
        openai_body["tools"] = [
            {"type": "function", "function": {"name": t["name"], "description": t.get("description", ""), "parameters": t.get("input_schema", {})}}
            for t in tools
        ]
        openai_body["tool_choice"] = "auto"

    return openai_body


# =============================================================================
# MAIN MESSAGE HANDLER
# =============================================================================

@app.post("/v1/messages")
async def messages(request: Request):
    request_id = uuid.uuid4().hex[:8]
    try:
        body = await request.json()
        anthropic_model = body.get("model", "sonnet")
        stream = body.get("stream", False)

        print(f"[BRIDGE:{request_id}] Incoming model={anthropic_model} stream={stream}", file=sys.stderr)

        openai_body = build_openai_body(body, anthropic_model)
        api_url = f"{KEYMASTER_URL}/v1/chat/completions"
        headers = {"Content-Type": "application/json"}

        if stream:
            async def generate():
                msg_id = f"msg_{uuid.uuid4().hex[:12]}"
                yield f"event: message_start\ndata: {json.dumps({'type': 'message_start', 'message': {'id': msg_id, 'type': 'message', 'role': 'assistant', 'content': [], 'model': anthropic_model, 'usage': {'input_tokens': 0, 'output_tokens': 0}}})}\n\n"
                yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"

                full_content = ""
                tool_call_chunks = {}

                try:
                    async with http_client.stream("POST", api_url,
                        json=openai_body, headers=headers, timeout=httpx.Timeout(600.0)) as resp:
                        async for line in resp.aiter_lines():
                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    break
                                try:
                                    chunk = json.loads(data)
                                    delta = chunk["choices"][0].get("delta", {}) or {}
                                    text = delta.get("content") or ""
                                    if text:
                                        full_content += text
                                        yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': text}})}\n\n"
                                    for tc in delta.get("tool_calls", []) or []:
                                        idx = tc.get("index", 0)
                                        if idx not in tool_call_chunks:
                                            tool_call_chunks[idx] = {"id": tc.get("id", f"call_{idx}"), "name": "", "arguments": ""}
                                        if tc.get("function", {}).get("name"):
                                            tool_call_chunks[idx]["name"] += tc["function"]["name"]
                                        if tc.get("function", {}).get("arguments"):
                                            tool_call_chunks[idx]["arguments"] += tc["function"]["arguments"]
                                except:
                                    pass
                except Exception as e:
                    print(f"[BRIDGE] Stream error: {e}", file=sys.stderr)

                yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"

                if tool_call_chunks:
                    for i, (idx, tc) in enumerate(tool_call_chunks.items(), start=1):
                        yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': i, 'content_block': {'type': 'tool_use', 'id': tc['id'], 'name': tc['name'], 'input': {}}})}\n\n"
                        yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': i, 'delta': {'type': 'input_json_delta', 'partial_json': tc['arguments']}})}\n\n"
                        yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': i})}\n\n"
                    stop_reason = "tool_use"
                else:
                    stop_reason = "end_turn"

                yield f"event: message_delta\ndata: {json.dumps({'type': 'message_delta', 'delta': {'stop_reason': stop_reason}, 'usage': {'input_tokens': 0, 'output_tokens': len(full_content) // 4 or 1}})}\n\n"
                yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"

            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )

        else:
            msg_id = f"msg_{uuid.uuid4().hex[:12]}"
            resp = await http_client.post(api_url,
                json=openai_body, headers=headers, timeout=httpx.Timeout(600.0))

            if resp.status_code != 200:
                return JSONResponse(content={"id": msg_id, "type": "message", "role": "assistant",
                    "content": [{"type": "text", "text": f"Error: Keymaster returned {resp.status_code}"}],
                    "model": anthropic_model, "stop_reason": "error"})

            openai_resp = resp.json()
            message = openai_resp.get("choices", [{}])[0].get("message", {})
            content_blocks = []

            if message.get("tool_calls"):
                if message.get("content"):
                    content_blocks.insert(0, {"type": "text", "text": message.get("content")})

                for tc in message["tool_calls"]:
                    try:
                        input_data = json.loads(tc["function"]["arguments"])
                    except:
                        input_data = {}
                    content_blocks.append({"type": "tool_use", "id": tc.get("id", "call_0"),
                        "name": tc["function"]["name"], "input": input_data})

                stop_reason = "tool_use"
            else:
                content_blocks.append({"type": "text", "text": message.get("content", "")})
                stop_reason = "end_turn"

            return JSONResponse(content={
                "id": openai_resp.get("id", msg_id),
                "type": "message",
                "role": "assistant",
                "content": content_blocks,
                "model": anthropic_model,
                "stop_reason": stop_reason,
                "usage": {"input_tokens": openai_resp.get("usage", {}).get("prompt_tokens", 0),
                         "output_tokens": openai_resp.get("usage", {}).get("completion_tokens", 0)}
            })

    except Exception as e:
        import traceback
        print(f"[BRIDGE:{request_id}] ERROR: {e}\n{traceback.format_exc()[:500]}", file=sys.stderr)
        return JSONResponse(status_code=500, content={
            "id": f"msg_{request_id}",
            "type": "message",
            "role": "assistant",
            "content": [{"type": "text", "text": f"Bridge Error: {str(e)}"}],
            "model": anthropic_model if 'anthropic_model' in locals() else "unknown",
            "stop_reason": "error"
        })


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "keymaster": KEYMASTER_URL,
        "default_model": DEFAULT_MODEL,
    }


@app.get("/v1/models")
async def list_models():
    return JSONResponse(content={
        "object": "list",
        "data": [
            {"id": DEFAULT_MODEL, "object": "model"},
        ]
    })


if __name__ == "__main__":
    import uvicorn
    try:
        import uvloop
        uvloop.install()
    except ImportError:
        pass
    uvicorn.run(app, host="127.0.0.1", port=8789, log_level="info", loop="uvloop")
