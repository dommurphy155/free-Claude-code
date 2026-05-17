#!/usr/bin/env python3
"""
Claude Code Bridge — with circuit breaker for Keymaster resilience.
"""

try:
    import uvloop
    uvloop.install()
    print("[BRIDGE] uvloop installed", file=__import__("sys").stderr, flush=True)
except ImportError:
    print("[BRIDGE] uvloop not available, using default asyncio", file=__import__("sys").stderr, flush=True)

import json
import os
import sys
import uuid
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx

# =============================================================================
# CONFIG
# =============================================================================

KEYMASTER_URL    = os.getenv("KEYMASTER_URL", "http://127.0.0.1:8787")
DEFAULT_MODEL    = "moonshotai/Kimi-K2.5"
MAX_BODY_BYTES   = int(os.getenv("MAX_BODY_BYTES", 10 * 1024 * 1024))
RETRY_ATTEMPTS   = int(os.getenv("RETRY_ATTEMPTS", "3"))
RETRY_CODES      = {502, 503, 504}

MODEL_MAP: Dict[str, str] = {
    "claude-sonnet-4-6":         DEFAULT_MODEL,
    "claude-opus-4-6":           DEFAULT_MODEL,
    "claude-haiku-4-5":          DEFAULT_MODEL,
    "claude-haiku-4-5-20251001": DEFAULT_MODEL,
    "sonnet":                    DEFAULT_MODEL,
    "opus":                      DEFAULT_MODEL,
    "haiku":                     DEFAULT_MODEL,
}

# =============================================================================
# CIRCUIT BREAKER
# =============================================================================

class CircuitBreaker:
    """
    CLOSED  → keymaster healthy, requests flow
    OPEN    → keymaster down, requests rejected immediately
    HALF    → probing, one test request allowed through
    """
    CLOSED = "closed"
    OPEN   = "open"
    HALF   = "half"

    def __init__(self, probe_interval: float = 5.0):
        self.state          = self.CLOSED
        self.probe_interval = probe_interval
        self._lock          = asyncio.Lock()

    @property
    def is_open(self) -> bool:
        return self.state == self.OPEN

    async def trip(self):
        async with self._lock:
            if self.state != self.OPEN:
                print("[CIRCUIT] OPEN — keymaster unreachable, dropping requests", file=sys.stderr, flush=True)
                self.state = self.OPEN

    async def close(self):
        async with self._lock:
            if self.state != self.CLOSED:
                print("[CIRCUIT] CLOSED — keymaster back, resuming", file=sys.stderr, flush=True)
                self.state = self.CLOSED

    async def run_poller(self, client: httpx.AsyncClient):
        """Background task — polls keymaster until it's back, then closes circuit."""
        while True:
            await asyncio.sleep(self.probe_interval)
            if self.state == self.CLOSED:
                continue
            try:
                r = await client.get(f"{KEYMASTER_URL}/health", timeout=3.0)
                if r.status_code == 200:
                    await self.close()
            except Exception:
                pass  # still down, keep polling


circuit = CircuitBreaker(probe_interval=5.0)

# =============================================================================
# HTTP CLIENT + LIFESPAN
# =============================================================================

http_client:      Optional[httpx.AsyncClient] = None
_active_requests: int                         = 0
_shutdown_event:  asyncio.Event               = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, _shutdown_event

    _shutdown_event = asyncio.Event()

    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(600.0, connect=5.0, read=300.0, write=30.0, pool=30.0),
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        follow_redirects=True,
        http2=True,
    )

    # Initial health check
    try:
        await http_client.get(f"{KEYMASTER_URL}/health", timeout=5.0)
        print("[BRIDGE] Keymaster reachable", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"[BRIDGE] Keymaster unreachable at startup: {e} — circuit opening", file=sys.stderr, flush=True)
        await circuit.trip()

    # Start background poller
    poller_task = asyncio.create_task(circuit.run_poller(http_client))
    print("[BRIDGE] Started", file=sys.stderr, flush=True)

    yield

    poller_task.cancel()
    try:
        await poller_task
    except asyncio.CancelledError:
        pass

    print("[BRIDGE] Shutting down...", file=sys.stderr, flush=True)
    _shutdown_event.set()

    deadline, interval, elapsed = 30.0, 0.1, 0.0
    while _active_requests > 0 and elapsed < deadline:
        await asyncio.sleep(interval)
        elapsed += interval

    if _active_requests > 0:
        print(f"[BRIDGE] Shutdown timeout — {_active_requests} still active", file=sys.stderr, flush=True)
    else:
        print(f"[BRIDGE] Drained in {elapsed:.1f}s", file=sys.stderr, flush=True)

    await http_client.aclose()
    print("[BRIDGE] Stopped", file=sys.stderr, flush=True)


app = FastAPI(lifespan=lifespan)

# =============================================================================
# MESSAGE CONVERSION (unchanged)
# =============================================================================

def convert_tool_use(msg: Dict[str, Any], text_parts: List[str]) -> Dict[str, Any]:
    tool_uses = [b for b in msg["content"] if b.get("type") == "tool_use"]
    return {
        "role":    "assistant",
        "content": "\n".join(text_parts) if text_parts else "",
        "tool_calls": [
            {
                "id":   tu.get("id", f"call_{i}"),
                "type": "function",
                "function": {
                    "name":      tu.get("name", ""),
                    "arguments": json.dumps(tu.get("input", {})),
                },
            }
            for i, tu in enumerate(tool_uses)
        ],
    }


def convert_tool_results(msg: Dict[str, Any], text_parts: List[str]) -> List[Dict[str, Any]]:
    tool_results = [b for b in msg["content"] if b.get("type") == "tool_result"]
    out = []
    for tr in tool_results:
        tr_content = tr.get("content", "")
        if isinstance(tr_content, list):
            tr_content = "\n".join(b.get("text", "") for b in tr_content if isinstance(b, dict))
        out.append({
            "role":         "tool",
            "tool_call_id": tr.get("tool_use_id", "call_0"),
            "content":      tr_content,
        })
    real_text = [t for t in text_parts if not t.strip().startswith("<system-reminder")]
    if real_text:
        out.append({"role": "user", "content": real_text[-1].strip()})
    return out


def convert_text_message(role: str, text_parts: List[str]) -> Dict[str, Any]:
    return {
        "role":    "assistant" if role == "assistant" else "user",
        "content": "\n".join(text_parts),
    }


def convert_messages(body: Dict[str, Any]) -> List[Dict[str, Any]]:
    msgs = []

    if "system" in body:
        system = body["system"]
        if isinstance(system, list):
            system = "\n".join(b.get("text", "") for b in system if isinstance(b, dict))
        msgs.append({"role": "system", "content": system})

    for msg in body.get("messages", []):
        role    = msg.get("role", "user")
        content = msg.get("content", "")

        if not isinstance(content, list):
            msgs.append(convert_text_message(role, [content]))
            continue

        content      = [b for b in content if isinstance(b, dict) and b.get("type") != "thinking"]
        text_parts   = [b.get("text", "") for b in content if b.get("type") == "text"]
        has_tool_use = any(b.get("type") == "tool_use"    for b in content)
        has_tool_res = any(b.get("type") == "tool_result" for b in content)

        if has_tool_use and role == "assistant":
            msgs.append(convert_tool_use(msg, text_parts))
        elif has_tool_res:
            msgs.extend(convert_tool_results(msg, text_parts))
        else:
            msgs.append(convert_text_message(role, text_parts))

    return msgs


def build_openai_body(body: Dict[str, Any], anthropic_model: str) -> Dict[str, Any]:
    model = MODEL_MAP.get(anthropic_model, DEFAULT_MODEL)

    openai_body: Dict[str, Any] = {
        "model":       model,
        "messages":    convert_messages(body),
        "max_tokens":  body.get("max_tokens", 4096),
        "temperature": body.get("temperature", 0.7),
        "stream":      body.get("stream", False),
    }

    tools = list(body.get("tools", []))
    if tools:
        openai_body["tools"] = [
            {
                "type": "function",
                "function": {
                    "name":        t["name"],
                    "description": t.get("description", ""),
                    "parameters":  t.get("input_schema", {}),
                },
            }
            for t in tools
        ]
        openai_body["tool_choice"] = "auto"

    return openai_body


# =============================================================================
# UPSTREAM REQUEST WITH RETRIES
# =============================================================================

async def post_with_retry(
    request_id: str,
    api_url:    str,
    headers:    Dict[str, str],
    body:       Dict[str, Any],
) -> httpx.Response:
    last_exc: Optional[Exception] = None

    for attempt in range(RETRY_ATTEMPTS):
        try:
            resp = await http_client.post(
                api_url, json=body, headers=headers,
                timeout=httpx.Timeout(600.0, connect=5.0),
            )
            if resp.status_code not in RETRY_CODES:
                return resp
            wait = 2 ** attempt
            print(f"[BRIDGE:{request_id}] upstream {resp.status_code}, retry {attempt + 1}/{RETRY_ATTEMPTS} in {wait}s", file=sys.stderr)
            await asyncio.sleep(wait)

        except (httpx.TimeoutException, httpx.ConnectError) as e:
            last_exc = e
            # Trip the circuit immediately on connect failure
            if isinstance(e, httpx.ConnectError):
                await circuit.trip()
            wait = 2 ** attempt
            print(f"[BRIDGE:{request_id}] {type(e).__name__} attempt {attempt + 1}/{RETRY_ATTEMPTS}: {e}", file=sys.stderr)
            if attempt < RETRY_ATTEMPTS - 1:
                await asyncio.sleep(wait)

    if last_exc:
        raise last_exc
    return await http_client.post(
        api_url, json=body, headers=headers,
        timeout=httpx.Timeout(600.0, connect=5.0),
    )


# =============================================================================
# CIRCUIT BREAKER FAST-FAIL SSE
# =============================================================================

async def stream_circuit_open(anthropic_model: str):
    """Immediately terminates stream with a clean error when circuit is open."""
    msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    yield f"event: message_start\ndata: {json.dumps({'type': 'message_start', 'message': {'id': msg_id, 'type': 'message', 'role': 'assistant', 'content': [], 'model': anthropic_model, 'usage': {'input_tokens': 0, 'output_tokens': 0}}})}\n\n"
    yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"
    yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': '[Bridge: Keymaster is down — retrying in background, please resend when ready]'}})}\n\n"
    yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"
    yield f"event: message_delta\ndata: {json.dumps({'type': 'message_delta', 'delta': {'stop_reason': 'error'}, 'usage': {'input_tokens': 0, 'output_tokens': 0}})}\n\n"
    yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"


# =============================================================================
# STREAMING
# =============================================================================

async def stream_upstream(
    request_id:      str,
    anthropic_model: str,
    openai_body:     Dict[str, Any],
):
    tool_call_chunks: Dict[int, Dict[str, str]] = {}
    stop_reason = "end_turn"
    api_url     = f"{KEYMASTER_URL}/v1/chat/completions"
    headers     = {"Content-Type": "application/json"}

    yield f"event: message_start\ndata: {json.dumps({'type': 'message_start', 'message': {'id': f'msg_{uuid.uuid4().hex[:12]}', 'type': 'message', 'role': 'assistant', 'content': [], 'model': anthropic_model, 'usage': {'input_tokens': 0, 'output_tokens': 0}}})}\n\n"
    yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"

    try:
        if os.getenv("DEBUG"):
            print(f"[DEBUG:{request_id}] last 3 msgs: {str(openai_body['messages'][-3:])[:300]}", file=sys.stderr, flush=True)

        async with http_client.stream(
            "POST", api_url,
            json=openai_body,
            headers=headers,
            timeout=httpx.Timeout(600.0, connect=5.0),
        ) as resp:

            if resp.status_code != 200:
                body_text = await resp.aread()
                print(f"[BRIDGE:{request_id}] upstream {resp.status_code}: {body_text[:200]}", file=sys.stderr)
                yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': f'[Bridge error: upstream {resp.status_code}]'}})}\n\n"
                stop_reason = "error"
            else:
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break

                    try:
                        chunk  = json.loads(data)
                        choice = chunk.get("choices", [{}])[0]
                        delta  = choice.get("delta") or {}

                        text = delta.get("content")
                        if isinstance(text, str) and text:
                            yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': text}})}\n\n"

                        for tc in delta.get("tool_calls") or []:
                            idx = tc.get("index", 0)
                            if idx not in tool_call_chunks:
                                tool_call_chunks[idx] = {
                                    "id":        tc.get("id", f"call_{idx}"),
                                    "name":      "",
                                    "arguments": "",
                                }
                            fn = tc.get("function") or {}
                            if fn.get("name"):
                                tool_call_chunks[idx]["name"]      += fn["name"]
                            if fn.get("arguments"):
                                tool_call_chunks[idx]["arguments"] += fn["arguments"]

                        if choice.get("finish_reason") == "tool_calls":
                            stop_reason = "tool_use"

                    except Exception as e:
                        print(f"[BRIDGE:{request_id}] chunk parse error: {e} | raw: {data[:120]}", file=sys.stderr)

    except httpx.ConnectError as e:
        print(f"[BRIDGE:{request_id}] connect error — tripping circuit: {e}", file=sys.stderr)
        await circuit.trip()
        yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': '[Bridge: Keymaster went away mid-stream — circuit open]'}})}\n\n"
        stop_reason = "error"
    except httpx.TimeoutException as e:
        print(f"[BRIDGE:{request_id}] upstream timeout: {e}", file=sys.stderr)
        yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': '[Bridge error: upstream timeout]'}})}\n\n"
        stop_reason = "error"
    except Exception as e:
        print(f"[BRIDGE:{request_id}] stream error: {e}", file=sys.stderr)
        stop_reason = "error"

    yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"

    if tool_call_chunks:
        stop_reason = "tool_use"
        for i, (_, tc) in enumerate(tool_call_chunks.items(), start=1):
            yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': i, 'content_block': {'type': 'tool_use', 'id': tc['id'], 'name': tc['name'], 'input': {}}})}\n\n"
            yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': i, 'delta': {'type': 'input_json_delta', 'partial_json': tc['arguments']}})}\n\n"
            yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': i})}\n\n"

    yield f"event: message_delta\ndata: {json.dumps({'type': 'message_delta', 'delta': {'stop_reason': stop_reason}, 'usage': {'input_tokens': 0, 'output_tokens': 0}})}\n\n"
    yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"


# =============================================================================
# MAIN MESSAGE HANDLER
# =============================================================================

@app.post("/v1/messages")
async def messages(request: Request):
    global _active_requests
    request_id      = uuid.uuid4().hex[:8]
    anthropic_model = "unknown"

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_BYTES:
        return JSONResponse(status_code=413, content={"error": f"Request body too large (max {MAX_BODY_BYTES} bytes)"})

    try:
        raw  = await request.body()
        if len(raw) > MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"error": "Request body too large"})
        body = json.loads(raw)
    except json.JSONDecodeError as e:
        return JSONResponse(status_code=400, content={"error": f"Invalid JSON: {e}"})

    anthropic_model = body.get("model", "sonnet")
    stream          = body.get("stream", False)

    # ── Circuit breaker fast-fail ──────────────────────────────────────────
    if circuit.is_open:
        print(f"[BRIDGE:{request_id}] Circuit OPEN — rejecting immediately", file=sys.stderr, flush=True)
        if stream:
            return StreamingResponse(
                stream_circuit_open(anthropic_model),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
            )
        return JSONResponse(status_code=503, content={
            "id": f"msg_{request_id}", "type": "message", "role": "assistant",
            "content": [{"type": "text", "text": "[Bridge: Keymaster is down — retrying in background]"}],
            "model": anthropic_model, "stop_reason": "error",
        })

    _active_requests += 1
    try:
        print(f"[BRIDGE:{request_id}] model={anthropic_model} stream={stream}", file=sys.stderr)

        openai_body = build_openai_body(body, anthropic_model)
        api_url     = f"{KEYMASTER_URL}/v1/chat/completions"
        headers     = {"Content-Type": "application/json"}

        if stream:
            return StreamingResponse(
                stream_upstream(request_id, anthropic_model, openai_body),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
            )

        msg_id = f"msg_{uuid.uuid4().hex[:12]}"

        try:
            resp = await post_with_retry(request_id, api_url, headers, openai_body)
        except httpx.TimeoutException:
            return JSONResponse(status_code=504, content={
                "id": msg_id, "type": "message", "role": "assistant",
                "content": [{"type": "text", "text": "Bridge error: upstream timeout"}],
                "model": anthropic_model, "stop_reason": "error",
            })
        except httpx.ConnectError:
            await circuit.trip()
            return JSONResponse(status_code=503, content={
                "id": msg_id, "type": "message", "role": "assistant",
                "content": [{"type": "text", "text": "[Bridge: Keymaster went away — circuit open, retrying in background]"}],
                "model": anthropic_model, "stop_reason": "error",
            })

        if resp.status_code != 200:
            print(f"[BRIDGE:{request_id}] upstream {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
            return JSONResponse(content={
                "id": msg_id, "type": "message", "role": "assistant",
                "content": [{"type": "text", "text": f"Bridge error: upstream returned {resp.status_code}"}],
                "model": anthropic_model, "stop_reason": "error",
            })

        openai_resp    = resp.json()
        message        = openai_resp.get("choices", [{}])[0].get("message", {})
        content_blocks = []

        if message.get("tool_calls"):
            if message.get("content"):
                content_blocks.append({"type": "text", "text": message["content"]})
            for tc in message["tool_calls"]:
                try:
                    input_data = json.loads(tc["function"]["arguments"])
                except Exception as e:
                    print(f"[BRIDGE:{request_id}] tool arg parse error: {e}", file=sys.stderr)
                    input_data = {}
                content_blocks.append({
                    "type":  "tool_use",
                    "id":    tc.get("id", "call_0"),
                    "name":  tc["function"]["name"],
                    "input": input_data,
                })
            stop_reason = "tool_use"
        else:
            content_blocks.append({"type": "text", "text": message.get("content", "")})
            stop_reason = "end_turn"

        return JSONResponse(content={
            "id":          openai_resp.get("id", msg_id),
            "type":        "message",
            "role":        "assistant",
            "content":     content_blocks,
            "model":       anthropic_model,
            "stop_reason": stop_reason,
            "usage": {
                "input_tokens":  openai_resp.get("usage", {}).get("prompt_tokens", 0),
                "output_tokens": openai_resp.get("usage", {}).get("completion_tokens", 0),
            },
        })

    except Exception as e:
        import traceback
        print(f"[BRIDGE:{request_id}] ERROR: {e}\n{traceback.format_exc()[:500]}", file=sys.stderr)
        return JSONResponse(status_code=500, content={
            "id": f"msg_{request_id}", "type": "message", "role": "assistant",
            "content": [{"type": "text", "text": f"Bridge Error: {str(e)}"}],
            "model": anthropic_model, "stop_reason": "error", "request_id": request_id,
        })
    finally:
        _active_requests = max(0, _active_requests - 1)


# =============================================================================
# HEALTH
# =============================================================================

@app.get("/health")
async def health():
    return {
        "status":          "ok",
        "circuit":         circuit.state,
        "keymaster":       KEYMASTER_URL,
        "default_model":   DEFAULT_MODEL,
        "active_requests": _active_requests,
    }


@app.get("/v1/models")
async def list_models():
    return JSONResponse(content={
        "object": "list",
        "data":   [{"id": DEFAULT_MODEL, "object": "model"}],
    })


# =============================================================================
# ENTRYPOINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8789, log_level="info", loop="uvloop")
