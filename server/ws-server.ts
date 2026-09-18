import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';

const port = Number(process.env.PORT) || 1234;
const host = process.env.HOST || '0.0.0.0';

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

server.listen(port, host, () => {
  console.log(`🚀 [SyncSpace WS] Real-time collaboration server listening on ${host}:${port}`);
  console.log(`📡 WebSocket URL: ws://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
});
