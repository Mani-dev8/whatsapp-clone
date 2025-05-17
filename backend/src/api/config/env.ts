import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT: str({ desc: 'PORT number' }),
  JWT_SECRET: str({ desc: 'JWT secret for signing tokens' }),
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),
});
