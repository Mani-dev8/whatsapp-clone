"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const logger_1 = require("../../util/logger");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
exports.logger = router.use((req, _res, next) => {
    logger_1.winstonLogger.info(`${req.method} ${req.url}`);
    next();
});
