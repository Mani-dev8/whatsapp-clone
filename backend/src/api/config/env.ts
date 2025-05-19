import { cleanEnv, str, port } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT: port({ desc: 'Server port number' }),

  NODE_ENV: str({
    desc: 'Node environment',
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),

  // Database
  MONGODB_URI: str({ desc: 'MongoDB connection URI' }),

  // Authentication
  JWT_SECRET: str({ desc: 'JWT secret for signing tokens' }),
  JWT_EXPIRATION: str({ desc: 'JWT expiration time in seconds' }),

  // CORS
  CORS_ORIGIN: str({ desc: 'Comma-separated list of allowed CORS origins' }),

  // Socket.io
  SOCKET_CORS: str({ desc: 'Comma-separated list of allowed origins for Socket.io' }),
});