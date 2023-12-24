import { createServer } from 'node:http';
import * as dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1000,
  cors: { origin: process.env.CLIENT_URL },
});
const PORT = process.env.PORT ?? 4000;

app.use(morgan('dev'));

app.use(express.json({ limit: '50mb' }));

io.on('connection', (socket) => {
  const player = socket.handshake.auth;

  socket.on('join game', () => {
    // const connectedSockets = io.sockets.adapter.rooms.get(player.gameId);
    // const socketRooms = Array.from(socket.rooms.values()).filter(
    //   (r) => r !== socket.id
    // );
    // if (socketRooms.length > 0 || connectedSockets?.size === 2) {
    //   return socket.emit('join game error', {
    //     error: 'Room is full, please choose another one',
    //   });
    // }

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
