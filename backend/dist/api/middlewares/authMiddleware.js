"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressAuthentication = expressAuthentication;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const errorTypes_1 = require("@/util/errorTypes");
const env_1 = require("../config/env");
async function expressAuthentication(request, securityName, scopes) {
    if (securityName !== 'jwt') {
        throw new errorTypes_1.ForbiddenError('Invalid authentication method');
    }
    const token = extractTokenFromRequest(request);
    if (!token) {
        throw new errorTypes_1.UnauthorizedError('No token provided');
    }
    const jwtSecret = env_1.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        request.user = {
            _id: new mongoose_1.default.Types.ObjectId(decoded.userId),
            email: decoded.email,
            role: decoded.role || 'user',
        };
        if (scopes && scopes.length > 0) {
            if (!decoded.role || !scopes.includes(decoded.role)) {
                throw new errorTypes_1.ForbiddenError('User does not have the required permissions');
            }
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errorTypes_1.UnauthorizedError('Token expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorTypes_1.UnauthorizedError('Invalid token');
        }
        throw new errorTypes_1.UnauthorizedError('Authentication failed: ' +
            (error instanceof Error ? error.message : 'Unknown error'));
    }
}
function extractTokenFromRequest(request) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
