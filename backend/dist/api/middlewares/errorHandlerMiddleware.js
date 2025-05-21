"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorTypes_1 = require("@/util/errorTypes");
const http_status_codes_1 = require("http-status-codes");
const env_1 = require("../config/env");
const mongoose_1 = require("mongoose");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof errorTypes_1.AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
        return;
    }
    // Handle Mongoose validation errors
    if (err instanceof mongoose_1.Error.ValidationError) {
        const errors = Object.values(err.errors).map((val) => val.message);
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Validation Error',
            errors,
        });
        return;
    }
    // Handle Mongoose cast errors (invalid IDs, etc.)
    if (err instanceof mongoose_1.Error.CastError) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: `Invalid ${err.path}: ${err.value}`,
        });
        return;
    }
    // Handle Mongoose duplicate key errors (unique constraint violations)
    if (err.name === 'MongoServerError' && err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
            status: 'error',
            message: `Duplicate value for ${field}. This ${field} is already in use.`,
        });
        return;
    }
    console.error(err);
    res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: env_1.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    });
};
exports.errorHandler = errorHandler;
