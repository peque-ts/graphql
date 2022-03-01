import { Server } from 'http';

let sockets = {};
let socketId = 0;

export function httpTerminator(server: Server): void {
  server.on('connection', (socket) => {
    socketId++;
    sockets[socketId] = socket;

    socket.on('close', () => delete sockets[socketId]);
    socket.setTimeout(0);
  });
}

export function killServer(server: Server): void {
  for (const socket in sockets) {
    sockets[socket].destroy();
  }
  server.close();

  sockets = {};
  socketId = 0;
}
