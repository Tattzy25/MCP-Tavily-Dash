import os
import time
import json
import logging
import asyncio
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Dict, List, Literal, Optional, Tuple

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ServerState:
    """
    Global server state to store metrics and logs.
    """
    def __init__(self):
        self.start_time = time.time()
        self.total_requests = 0
        self.active_connections = 0
        self.tool_usage = defaultdict(int)
        self.logs = []
        self.connections = {}

    def add_log(self, message: str):
        self.logs.append({"timestamp": time.time(), "message": message})

    def track_connection(self, client_id: str, websocket: WebSocket):
        self.active_connections += 1
        self.connections[client_id] = websocket
        self.add_log(f"Connection opened: {client_id}")

    def untrack_connection(self, client_id: str):
        self.active_connections -= 1
        if client_id in self.connections:
            del self.connections[client_id]
        self.add_log(f"Connection closed: {client_id}")

    def increment_tool_usage(self, tool_name: str):
        self.tool_usage[tool_name] += 1

server_state = ServerState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Server starting up")
    server_state.add_log("Server starting up")
    yield
    logger.info("Server shutting down")
    server_state.add_log("Server shutting down")

class FastApiMCP(FastAPI):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, lifespan=lifespan)
        self.mount("/static", StaticFiles(directory="."), name="static")

app = FastApiMCP()

class ToolCall(BaseModel):
    tool_name: str
    parameters: Dict

class AgentMessage(BaseModel):
    message_id: str
    content: str
    tool_calls: Optional[List[ToolCall]] = None
    is_error: bool = False

class UserMessage(BaseModel):
    message_id: str
    content: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        server_state.track_connection(client_id, websocket)

    def disconnect(self, client_id: str):
        server_state.untrack_connection(client_id)
        del self.active_connections[client_id]

    async def send_personal_message(self, message: str, client_id: str):
        await self.active_connections[client_id].send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/", response_class=HTMLResponse)
async def read_root():
    return FileResponse("index.html")

@app.get("/health")
async def health_check():
    return {"status": "ok", "uptime": time.time() - server_state.start_time}

@app.get("/api/metrics")
async def get_metrics():
    return {
        "total_requests": server_state.total_requests,
        "active_connections": server_state.active_connections,
        "tool_usage": server_state.tool_usage,
        "uptime": time.time() - server_state.start_time,
    }

@app.get("/api/tools")
async def get_tools():
    # This would ideally return a list of available tools dynamically
    return {"tools": ["search", "tavily_search", "code_interpreter"]}

@app.get("/api/connections")
async def get_connections():
    return {"connections": list(server_state.connections.keys())}

@app.get("/api/logs")
async def get_logs():
    return {"logs": server_state.logs}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            server_state.total_requests += 1
            server_state.add_log(f"Received from {client_id}: {data}")

            message = json.loads(data)
            if message["type"] == "user_message":
                user_message = UserMessage(**message["payload"])
                # Process user message, interact with agent, etc.
                # For now, just echo back as an agent message
                agent_response = AgentMessage(
                    message_id=f"agent-{time.time()}",
                    content=f"Echo: {user_message.content}",
                    tool_calls=[
                        ToolCall(tool_name="echo", parameters={"text": user_message.content})
                    ]
                )
                server_state.increment_tool_usage("echo")
                await manager.send_personal_message(json.dumps({
                    "type": "agent_message",
                    "payload": agent_response.dict()
                }), client_id)
            elif message["type"] == "tool_output":
                # Handle tool output
                server_state.add_log(f"Tool output from {client_id}: {message['payload']}")
                pass

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        server_state.add_log(f"WebSocket error for {client_id}: {e}")
        logger.error(f"WebSocket error for {client_id}: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)