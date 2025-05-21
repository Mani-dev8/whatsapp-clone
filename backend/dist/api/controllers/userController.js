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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const tsoa_1 = require("tsoa");
const userModel_1 = require("../models/userModel");
const errorTypes_1 = require("@/util/errorTypes");
let UserController = class UserController extends tsoa_1.Controller {
    /**
     * Get the current user's profile
     */
    async getCurrentUser(request) {
        const userId = request.user?._id;
        if (!userId) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const user = await userModel_1.User.findById(userId);
        if (!user) {
            throw new errorTypes_1.NotFoundError('User not found');
        }
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            about: user.about,
            lastSeen: user.lastSeen,
            isOnline: user.isOnline
        };
    }
    /**
     * Update the current user's profile
     */
    async updateProfile(request, requestBody) {
        const userId = request.user?._id;
        if (!userId) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const updatedUser = await userModel_1.User.findByIdAndUpdate(userId, { $set: requestBody }, { new: true });
        if (!updatedUser) {
            throw new errorTypes_1.NotFoundError('User not found');
        }
        return {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            profilePicture: updatedUser.profilePicture,
            about: updatedUser.about,
            lastSeen: updatedUser.lastSeen,
            isOnline: updatedUser.isOnline
        };
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const user = await userModel_1.User.findById(userId);
        if (!user) {
            throw new errorTypes_1.NotFoundError('User not found');
        }
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            about: user.about,
            lastSeen: user.lastSeen,
            isOnline: user.isOnline
        };
    }
    /**
     * Search users by name or email
     */
    async searchUsers(request, query) {
        const userId = request.user?._id;
        if (!userId) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const users = await userModel_1.User.find({
            $and: [
                { _id: { $ne: userId } },
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).limit(20);
        return users.map(user => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            about: user.about,
            lastSeen: user.lastSeen,
            isOnline: user.isOnline
        }));
    }
};
exports.UserController = UserController;
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Get)('me'),
    (0, tsoa_1.Response)(200, 'Success'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getCurrentUser", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Put)('me'),
    (0, tsoa_1.Response)(200, 'Profile updated successfully'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateProfile", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Get)('{userId}'),
    (0, tsoa_1.Response)(200, 'Success'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    (0, tsoa_1.Response)(404, 'User not found'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserById", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Get)('search/{query}'),
    (0, tsoa_1.Response)(200, 'Success'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "searchUsers", null);
exports.UserController = UserController = __decorate([
    (0, tsoa_1.Route)('users'),
    (0, tsoa_1.Tags)('Users')
], UserController);
