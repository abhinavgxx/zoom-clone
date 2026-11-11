
from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:

    def __init__(self):
        # Stores active WebSocket connections for each meeting.
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, meeting_code: str):
        await websocket.accept()

        if meeting_code not in self.active_connections:
            self.active_connections[meeting_code] = []

        self.active_connections[meeting_code].append(websocket)

    def disconnect(self, websocket: WebSocket, meeting_code: str):
        if meeting_code in self.active_connections:
            if websocket in self.active_connections[meeting_code]:
                self.active_connections[meeting_code].remove(websocket)

            if not self.active_connections[meeting_code]:
                del self.active_connections[meeting_code]

    async def broadcast(self, meeting_code: str, message: dict):
        connections = self.active_connections.get(meeting_code, [])

        for connection in connections.copy():
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection, meeting_code)


manager = ConnectionManager()
