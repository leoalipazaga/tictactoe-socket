import { createServer } from 'node:http';
import * as dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { Server } from 'socket.io';

dotenv.config();
const MAX_PLAYERS = 2;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1000,
  connectionStateRecovery: {},
  cors: { origin: process.env.CLIENT_URL },
});
const PORT = process.env.PORT ?? 4000;

app.use(morgan('dev'));

io.use((socket, next) => {
  const player = socket.handshake.auth;
  const isAdmin = player.turn === 'X';
  if (isAdmin) {
    return next();
  }
  if (!io.of('/').adapter.rooms.has(player.gameId)) {
    return next(new Error('socket_not_exist'));
  }
  next();
});

io.use(async (socket, next) => {
  const player = socket.handshake.auth;
  const connectedSockets = await io.in(player.gameId).fetchSockets();
  if (connectedSockets?.length >= MAX_PLAYERS) {
    return next(new Error('room_full'));
  }
  next();
});

io.on('connection', (socket) => {
  const player = socket.handshake.auth;
  socket.on('join game', async () => {
    socket.join(player.gameId);
  });

  socket.on('put:board', ({ board }) => {
    io.to(player.gameId).emit('get:board:success', board);
    io.to(player.gameId).emit(
      'get:turn:success',
      player.turn === 'X' ? 'O' : 'X'
    );
  });

  socket.on('disconnect', (reason) => {
    console.info(
      `user has disconnected ${socket.id} ${socket.disconnected} ${reason}`
    );
  });
});

server.listen(PORT, () => {
  console.info(`server listening on port ${PORT}`);
});
