import dotenv from 'dotenv';

dotenv.config();

import { winstonLogger } from './util/logger';
import app from './app';
import { env } from './api/config/env';

const PORT = env.PORT;

process.on('uncaughtException', (error) => {
  winstonLogger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  winstonLogger.error('Unhandled Rejection on', promise, 'reason:', reason);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  winstonLogger.info(`server is listening on port ${PORT}`);
});

const shutdown = () => {
  () => {
    server.close(() => {
      winstonLogger.error('Server shutting down...');
      process.exit(0);
    });

    setTimeout(() => {
      winstonLogger.error('Forcing server shutdown...');
      process.exit(1);
    }, 10000);
  };
};

// Handling shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
