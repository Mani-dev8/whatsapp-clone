import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT: str({ desc: 'PORT number' }),
  JWT_SECRET: str({ desc: 'JWT secret for signing tokens' }),
  MONGODB_URI: str({ desc: 'MongoDB connection string' }),
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),
});
