import {io, Socket} from 'socket.io-client';
import {storageUtils, STORAGE_KEYS} from './storage';

let socket: Socket | null = null;

export const initSocket = async () => {
  const token = storageUtils.getItem(STORAGE_KEYS.TOKEN);
  if (!token) return;

  socket = io('http://192.168.1.146:5001', {
    auth: {token},
    reconnectionDelay: 1000,
    reconnection: true,
    reconnectionAttempts: 10,
    transports: ['websocket'],
    agent: false,
    upgrade: false,
    rejectUnauthorized: false,
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected');
  });

  socket.on('connect_error', err => {
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
