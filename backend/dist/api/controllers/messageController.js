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
exports.MessageController = void 0;
const errorTypes_1 = require("@/util/errorTypes");
const tsoa_1 = require("tsoa");
const chatModel_1 = require("../models/chatModel");
const messageModel_1 = require("../models/messageModel");
let MessageController = class MessageController extends tsoa_1.Controller {
    /**
     * Create a new message in a chat
     */
    async createMessage(request, requestBody) {
        const userId = request.user?._id;
        if (!userId) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const { chatId, content, messageType = messageModel_1.MessageType.TEXT, mediaUrl, } = requestBody;
        if (!content && !mediaUrl) {
            throw new errorTypes_1.BadRequestError('Message content or media URL is required');
        }
        // Validate chat existence and user participation
        const chat = await chatModel_1.Chat.findOne({
            _id: chatId,
            participants: userId,
            isActive: true,
        });
        if (!chat) {
            throw new errorTypes_1.NotFoundError('Chat not found or user not a participant');
        }
        // Create new message
        const newMessage = new messageModel_1.Message({
            chat: chatId,
            sender: userId,
            content,
            messageType,
            mediaUrl,
            status: messageModel_1.MessageStatus.SENT,
            readBy: [userId],
            deletedFor: [],
        });
        await newMessage.save();
        // Update chat's latest message
        await chatModel_1.Chat.findByIdAndUpdate(chatId, {
            latestMessage: newMessage._id,
            updatedAt: new Date(),
        });
        // Populate sender information
        const populatedMessage = (await messageModel_1.Message.findById(newMessage._id).populate('sender', 'name'));
        if (!populatedMessage) {
            throw new errorTypes_1.NotFoundError('Message not found after creation');
        }
        return {
            id: populatedMessage._id.toHexString(),
            chat: populatedMessage.chat.toString(),
            sender: {
                id: populatedMessage.sender._id.toHexString(),
                name: populatedMessage.sender.name || 'Unknown',
            },
            content: populatedMessage.content,
            messageType: populatedMessage.messageType,
            mediaUrl: populatedMessage.mediaUrl,
            status: populatedMessage.status,
            readBy: populatedMessage.readBy.map((id) => id.toHexString()),
            createdAt: populatedMessage.createdAt,
            updatedAt: populatedMessage.updatedAt,
        };
    }
    /**
     * Get messages for a specific chat
     */
    async getChatMessages(request, chatId, page = 1, limit = 50) {
        const userId = request.user?._id;
        if (!userId) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        // Validate chat existence and user participation
        const chat = await chatModel_1.Chat.findOne({
            _id: chatId,
            participants: userId,
            isActive: true,
        });
        if (!chat) {
            throw new errorTypes_1.NotFoundError('Chat not found or user not a participant');
        }
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        // Get messages with pagination, excluding those deleted for the user
        const messages = (await messageModel_1.Message.find({
            chat: chatId,
            deletedFor: { $ne: userId },
        })
            .populate('sender', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit));
        return messages.map((message) => ({
            id: message._id.toHexString(),
            chat: message.chat.toString(),
            sender: {
                id: message.sender._id.toHexString(),
                name: message.sender.name || 'Unknown',
            },
            content: message.content,
            messageType: message.messageType,
            mediaUrl: message.mediaUrl,
            status: message.status,
            readBy: message.readBy.map((id) => id.toHexString()),
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        }));
    }
    /**
     * Update message status (e.g., mark as read)
     */
    async updateMessageStatus(request, messageId, requestBody) {
        const userId = request.user?._id;
        if (!userId) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const message = (await messageModel_1.Message.findById(messageId)
            .populate('sender', 'name')
            .populate('chat'));
        if (!message) {
            throw new errorTypes_1.NotFoundError('Message not found');
        }
        // Verify user is part of the chat
        const chat = await chatModel_1.Chat.findOne({
            _id: message.chat,
            participants: userId,
            isActive: true,
        });
        if (!chat) {
            throw new errorTypes_1.ForbiddenError('User not authorized to update this message');
        }
        // Update status
        if (requestBody.status === messageModel_1.MessageStatus.READ) {
            if (!message.readBy.includes(userId)) {
                message.readBy.push(userId);
                message.status = messageModel_1.MessageStatus.READ;
            }
        }
        else if (requestBody.status === messageModel_1.MessageStatus.DELIVERED) {
            message.status = messageModel_1.MessageStatus.DELIVERED;
        }
        else {
            throw new errorTypes_1.BadRequestError('Invalid status update');
        }
        await message.save();
        return {
            id: message._id.toHexString(),
            chat: message.chat.toString(),
            sender: {
                id: message.sender._id.toHexString(),
                name: message.sender.name || 'Unknown',
            },
            content: message.content,
            messageType: message.messageType,
            mediaUrl: message.mediaUrl,
            status: message.status,
            readBy: message.readBy.map((id) => id.toHexString()),
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        };
    }
    /**
     * Delete message for the current user
     */
    async deleteMessage(request, messageId) {
        const userId = request.user?._id;
        if (!userId) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const message = (await messageModel_1.Message.findById(messageId).populate('chat'));
        if (!message) {
            throw new errorTypes_1.NotFoundError('Message not found');
        }
        // Verify user is part of the chat
        const chat = await chatModel_1.Chat.findOne({
            _id: message.chat,
            participants: userId,
            isActive: true,
        });
        if (!chat) {
            throw new errorTypes_1.ForbiddenError('User not authorized to delete this message');
        }
        // Add user to deletedFor array
        if (!message.deletedFor.includes(userId)) {
            message.deletedFor.push(userId);
            await message.save();
        }
        // If message is deleted for all participants, remove it
        if (message.deletedFor.length === chat.participants.length) {
            await messageModel_1.Message.findByIdAndDelete(messageId);
            // Update chat's latest message if this was the latest
            if (chat.latestMessage?.toHexString() === messageId) {
                const latestMessage = await messageModel_1.Message.findOne({
                    chat: chat._id,
                    deletedFor: { $ne: userId },
                }).sort({ createdAt: -1 });
                await chatModel_1.Chat.findByIdAndUpdate(chat._id, {
                    latestMessage: latestMessage?._id || null,
                    updatedAt: new Date(),
                });
            }
        }
        return { message: 'Message deleted successfully' };
    }
};
exports.MessageController = MessageController;
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Post)(),
    (0, tsoa_1.Response)(201, 'Message created successfully'),
    (0, tsoa_1.Response)(400, 'Bad request'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    (0, tsoa_1.Response)(403, 'Forbidden'),
    (0, tsoa_1.Response)(404, 'Chat not found'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "createMessage", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Get)('chat/{chatId}'),
    (0, tsoa_1.Response)(200, 'Success'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    (0, tsoa_1.Response)(403, 'Forbidden'),
    (0, tsoa_1.Response)(404, 'Chat not found'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __param(2, (0, tsoa_1.Query)()),
    __param(3, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getChatMessages", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Put)('{messageId}/status'),
    (0, tsoa_1.Response)(200, 'Message status updated successfully'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    (0, tsoa_1.Response)(403, 'Forbidden'),
    (0, tsoa_1.Response)(404, 'Message not found'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __param(2, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "updateMessageStatus", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Delete)('{messageId}'),
    (0, tsoa_1.Response)(200, 'Message deleted successfully'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    (0, tsoa_1.Response)(403, 'Forbidden'),
    (0, tsoa_1.Response)(404, 'Message not found'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "deleteMessage", null);
exports.MessageController = MessageController = __decorate([
    (0, tsoa_1.Route)('messages'),
    (0, tsoa_1.Tags)('Messages')
], MessageController);
