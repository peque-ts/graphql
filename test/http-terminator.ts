import { Server } from 'http';
import { Socket } from 'net';

const sockets = new Set<Socket>();

export function httpTerminator(server: Server): void {
  server.on('connection', (socket) => {
    socket.once('close', () => sockets.delete(socket));
    sockets.add(socket);
  });
}

export function killServer(server: Server): void {
  server.close();
  for (const socket of sockets) {
    socket.destroy();
  }
  sockets.clear();
}
