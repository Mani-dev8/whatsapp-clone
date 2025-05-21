"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = require("express-rate-limit");
const helmet_1 = __importDefault(require("helmet"));
const loggerMiddleware_1 = require("./api/middlewares/loggerMiddleware");
const errorHandlerMiddleware_1 = require("./api/middlewares/errorHandlerMiddleware");
const routes_1 = require("./api/routes");
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, compression_1.default)());
app.use((0, helmet_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Request logging
app.use(loggerMiddleware_1.logger);
// Register TSOA routes and Swagger UI
(0, routes_1.registerRoutes)(app);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
app.use((req, res, next) => {
    console.log('App middleware request.user:', req.user);
    next();
});
// Error handling (must be last)
app.use(errorHandlerMiddleware_1.errorHandler);
exports.default = app;
