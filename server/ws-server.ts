import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';

const port = process.env.PORT || 1234;
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ status: 'ok', service: 'SyncSpace Yjs WebSocket Server' }));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (conn: WebSocket, req: http.IncomingMessage) => {
  // @ts-ignore
  setupWSConnection(conn, req, { gc: true });
  console.log(`[SyncSpace WS] Client connected: ${req.url}`);
});

server.listen(port, () => {
  console.log(`🚀 [SyncSpace WS] Real-time collaboration server listening on port ${port}`);
  console.log(`📡 WebSocket URL: ws://localhost:${port}`);
});
