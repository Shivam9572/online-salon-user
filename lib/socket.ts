// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_HOST, {
      withCredentials: true,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}