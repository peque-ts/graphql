import { Server } from 'http';
import { Socket } from 'net';

const sockets = new Set<Socket>();

export function httpTerminator(server: Server): void {
  server.on('connection', (socket) => {
    socket.once('close', () => sockets.delete(socket));
    sockets.add(socket);
  });
}

export async function killServer(server: Server): Promise<void> {
  await new Promise((resolve) => {
    server.close(resolve);
  });

  for (const socket of sockets) {
    socket.destroy();
  }
  sockets.clear();
}
