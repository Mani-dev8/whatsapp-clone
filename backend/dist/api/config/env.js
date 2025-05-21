"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const envalid_1 = require("envalid");
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    PORT: (0, envalid_1.port)({ desc: 'Server port number' }),
    NODE_ENV: (0, envalid_1.str)({
        desc: 'Node environment',
        choices: ['development', 'production', 'test'],
        default: 'development',
    }),
    // Database
    MONGODB_URI: (0, envalid_1.str)({ desc: 'MongoDB connection URI' }),
    // Authentication
    JWT_SECRET: (0, envalid_1.str)({ desc: 'JWT secret for signing tokens' }),
    JWT_EXPIRATION: (0, envalid_1.str)({ desc: 'JWT expiration time in seconds' }),
    // CORS
    CORS_ORIGIN: (0, envalid_1.str)({ desc: 'Comma-separated list of allowed CORS origins' }),
    // Socket.io
    SOCKET_CORS: (0, envalid_1.str)({ desc: 'Comma-separated list of allowed origins for Socket.io' }),
});
