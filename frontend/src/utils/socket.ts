import { io, Socket } from 'socket.io-client';
import { storage, STORAGE_KEYS } from './storage';

let socket: Socket | null = null;

export const initSocket = async () => {
  const token = await storage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) return;

  socket = io('http://localhost:5001', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket.IO connect error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};