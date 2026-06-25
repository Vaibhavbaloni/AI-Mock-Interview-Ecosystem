// apps/web/src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: activeToken,
      },
      autoConnect: false,
    });
  } else if (activeToken) {
    socket.auth = { token: activeToken };
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
