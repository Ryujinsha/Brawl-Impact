// ============================================================
// Brawl Impact - Server Entry Point
// ============================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SocketHandler } from '../network/SocketHandler.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const socketHandler = new SocketHandler(io);

io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║     🎮 Brawl Impact Server 🎮       ║
  ║                                      ║
  ║   Running on port ${PORT}              ║
  ║   CORS: ${CORS_ORIGIN}   ║
  ╚══════════════════════════════════════╝
  `);
});
