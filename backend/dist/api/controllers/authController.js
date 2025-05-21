"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const tsoa_1 = require("tsoa");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("../models/userModel");
const errorTypes_1 = require("@/util/errorTypes");
const env_1 = require("../config/env");
let AuthController = class AuthController extends tsoa_1.Controller {
    /**
     * Register a new user
     */
    async register(requestBody) {
        const { name, email, password } = requestBody;
        if (!name || !email || !password) {
            throw new errorTypes_1.BadRequestError('Name, email, and password are required');
        }
        // Check if user already exists
        const existingUser = await userModel_1.User.findOne({ email });
        if (existingUser) {
            throw new errorTypes_1.BadRequestError('Email already in use');
        }
        // Create new user
        const user = new userModel_1.User({
            name,
            email,
            password,
        });
        await user.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ _id: user._id.toHexString(), email: user.email, role: user.role }, env_1.env.JWT_SECRET || 'secret88', { expiresIn: '24h' });
        return {
            token,
            user: {
                id: user._id.toHexString(),
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                about: user.about,
            },
        };
    }
    /**
     * Login a user
     */
    async login(requestBody) {
        const { email, password } = requestBody;
        if (!email || !password) {
            throw new errorTypes_1.BadRequestError('Email and password are required');
        }
        // Find user by email
        const user = (await userModel_1.User.findOne({ email }));
        if (!user) {
            throw new errorTypes_1.UnauthorizedError('Invalid credentials');
        }
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new errorTypes_1.UnauthorizedError('Invalid credentials');
        }
        // Update user status
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();
        const jwtSecret = env_1.env.JWT_SECRET;
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ _id: user._id.toHexString(), email: user.email, role: user.role }, jwtSecret, { expiresIn: '24h' });
        return {
            token,
            user: {
                id: user._id.toHexString(),
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                about: user.about,
            },
        };
    }
    /**
     * Logout a user
     */
    async logout(request) {
        const userId = request.user?._id;
        console.info(request.user);
        if (!userId) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        // Update user status
        const user = (await userModel_1.User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
        }, { new: true }));
        if (!user) {
            throw new errorTypes_1.NotFoundError('User not found');
        }
        return {
            message: 'Logout successful',
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, tsoa_1.Post)('register'),
    (0, tsoa_1.Response)(201, 'User registered successfully'),
    (0, tsoa_1.Response)(400, 'Bad request'),
    (0, tsoa_1.Response)(409, 'Email already in use'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, tsoa_1.Post)('login'),
    (0, tsoa_1.Response)(200, 'Login successful'),
    (0, tsoa_1.Response)(400, 'Bad request'),
    (0, tsoa_1.Response)(401, 'Invalid credentials'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Post)('logout'),
    (0, tsoa_1.Response)(200, 'Logout successful'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, tsoa_1.Route)('auth'),
    (0, tsoa_1.Tags)('Authentication')
], AuthController);
