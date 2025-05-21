import {io, Socket} from 'socket.io-client';
import {store} from '../store';
import {API_URL} from './constants';
import {STORAGE_KEYS, storageUtils} from './storage';

let socket: Socket | null = null;

export const initSocket = (tokenParam?: string) => {
  // Use provided token or get from storage
  const token =
    tokenParam ||
    storageUtils.getItem(STORAGE_KEYS.TOKEN) ||
    store.getState().auth.token;

  if (!token) {
    console.log('No token available for socket connection');
    return null;
  }

  // Only create a new socket if we don't have one already connected
  if (socket && socket.connected) {
    console.log('Reusing existing socket connection');
    return socket;
  }

  // Disconnect existing socket if it exists but isn't connected
  if (socket) {
    console.log('Disconnecting existing socket');
    socket.disconnect();
  }

  // Create new socket connection with auth token
  console.log('Creating new socket connection');
  socket = io(API_URL, {
    auth: {token},
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Setup event listeners
  socket.on('connect', () => {
    console.log('Socket connected successfully');
  });

  socket.on('connect_error', error => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', reason => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('error', (error: any) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket?.connected) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected manually');
  }
};
