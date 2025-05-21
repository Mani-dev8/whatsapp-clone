"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./util/logger");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./api/config/env");
const socket_1 = require("./api/socket");
const PORT = env_1.env.PORT || 3000;
const MONGODB_URI = env_1.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_clone';
async function startServer() {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(MONGODB_URI);
        logger_1.winstonLogger.info('Connected to MongoDB');
        // Create HTTP server and initialize Socket.IO
        const server = http_1.default.createServer(app_1.default);
        const io = new socket_io_1.Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        // Initialize Socket.IO handlers
        (0, socket_1.initializeSocket)(io);
        // Start server
        server.listen(PORT, () => {
            logger_1.winstonLogger.info(`Server is listening on port ${PORT}`);
        });
        // Graceful shutdown
        const shutdown = () => {
            logger_1.winstonLogger.info('Received shutdown signal, closing server...');
            io.close(() => {
                logger_1.winstonLogger.info('Socket.IO server closed');
            });
            server.close((err) => {
                if (err) {
                    logger_1.winstonLogger.error('Error during server shutdown:', err);
                    process.exit(1);
                }
                mongoose_1.default.connection.close(false).then(() => {
                    logger_1.winstonLogger.info('MongoDB connection closed');
                    logger_1.winstonLogger.info('Server closed successfully');
                    process.exit(0);
                });
            });
            // Force exit after 10 seconds
            setTimeout(() => {
                logger_1.winstonLogger.error('Forcing server shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        // Handle uncaught exceptions and rejections
        process.on('uncaughtException', (error) => {
            logger_1.winstonLogger.error('Uncaught Exception:', error);
            shutdown();
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.winstonLogger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            shutdown();
        });
        // Handle shutdown signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        logger_1.winstonLogger.error('Startup error:', error);
        process.exit(1);
    }
}
startServer();
