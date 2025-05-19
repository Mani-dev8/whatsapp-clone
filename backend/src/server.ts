// src/server.ts
import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import { winstonLogger } from './util/logger';
import app from './app';
import { env } from './api/config/env';
import { initializeSocket } from './api/socket';


const PORT = env.PORT || 3000;
const MONGODB_URI =
  env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_clone';

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    winstonLogger.info('Connected to MongoDB');

    // Create HTTP server and initialize Socket.IO
    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: {
        origin: '*', // Adjust for production (e.g., your frontend URL)
        methods: ['GET', 'POST'],
      },
    });

    // Initialize Socket.IO handlers
    initializeSocket(io);

    // Start server
    server.listen(PORT, () => {
      winstonLogger.info(`Server is listening on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      winstonLogger.info('Received shutdown signal, closing server...');
      io.close(() => {
        winstonLogger.info('Socket.IO server closed');
      });
      server.close((err) => {
        if (err) {
          winstonLogger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        mongoose.connection.close(false).then(() => {
          winstonLogger.info('MongoDB connection closed');
          winstonLogger.info('Server closed successfully');
          process.exit(0);
        });
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        winstonLogger.error('Forcing server shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (error) => {
      winstonLogger.error('Uncaught Exception:', error);
      shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      winstonLogger.error(
        'Unhandled Rejection at:',
        promise,
        'reason:',
        reason,
      );
      shutdown();
    });

    // Handle shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    winstonLogger.error('Startup error:', error);
    process.exit(1);
  }
}

startServer();
