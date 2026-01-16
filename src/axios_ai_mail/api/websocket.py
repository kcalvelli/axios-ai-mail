"""WebSocket support for real-time updates."""

import asyncio
import json
import logging
from datetime import datetime
from typing import List, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self.lock:
            self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        async with self.lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific client."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        async with self.lock:
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {e}")
                    disconnected.append(connection)

            # Remove failed connections
            for conn in disconnected:
                if conn in self.active_connections:
                    self.active_connections.remove(conn)


# Global connection manager
manager = ConnectionManager()


async def send_sync_started(account_id: str):
    """Send sync started event to all clients."""
    await manager.broadcast({
        "type": "sync_started",
        "account_id": account_id,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def send_sync_completed(account_id: str, stats: dict):
    """Send sync completed event to all clients."""
    await manager.broadcast({
        "type": "sync_completed",
        "account_id": account_id,
        "stats": stats,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def send_message_classified(message_id: str, tags: List[str]):
    """Send message classified event to all clients."""
    await manager.broadcast({
        "type": "message_classified",
        "message_id": message_id,
        "tags": tags,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def send_error(message: str, details: str = ""):
    """Send error event to all clients."""
    await manager.broadcast({
        "type": "error",
        "message": message,
        "details": details,
        "timestamp": datetime.utcnow().isoformat(),
    })


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await manager.connect(websocket)

    try:
        # Send welcome message
        await manager.send_personal_message({
            "type": "connected",
            "message": "Connected to axios-ai-mail WebSocket",
            "timestamp": datetime.utcnow().isoformat(),
        }, websocket)

        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle client messages (e.g., subscribe to topics)
                if message.get("type") == "subscribe":
                    topics = message.get("topics", [])
                    logger.info(f"Client subscribed to topics: {topics}")
                    await manager.send_personal_message({
                        "type": "subscribed",
                        "topics": topics,
                        "timestamp": datetime.utcnow().isoformat(),
                    }, websocket)

                elif message.get("type") == "ping":
                    # Respond to ping with pong
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    }, websocket)

            except json.JSONDecodeError:
                logger.error("Invalid JSON received from client")
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format",
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        logger.info("WebSocket disconnected normally")

    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        await manager.disconnect(websocket)
