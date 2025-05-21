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
exports.ChatController = void 0;
const tsoa_1 = require("tsoa");
const chatModel_1 = require("../models/chatModel");
const messageModel_1 = require("../models/messageModel");
const userModel_1 = require("../models/userModel");
const errorTypes_1 = require("@/util/errorTypes");
const mongoose_1 = __importDefault(require("mongoose"));
let ChatController = class ChatController extends tsoa_1.Controller {
    /**
     * Maps a chat document to a response format for the chat list.
     * @param chat The chat document from MongoDB.
     * @param userId The ID of the authenticated user.
     * @returns A formatted chat response.
     */
    async mapChatToResponse(chat, userId) {
        const otherParticipant = chat.participants.find((p) => p._id.toString() !== userId);
        const unreadCount = await messageModel_1.Message.countDocuments({
            chat: chat._id,
            status: { $ne: 'read' },
            readBy: { $ne: userId },
            deletedFor: { $ne: userId },
        });
        return {
            id: chat._id.toString(),
            name: otherParticipant?.name || 'Unknown',
            lastMessage: chat.latestMessage
                ? `${chat.latestMessage.sender?.name || 'Unknown'}: ${chat.latestMessage.content}`
                : '',
            time: chat.latestMessage
                ? new Date(chat.latestMessage.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                })
                : '',
            unreadCount,
            avatar: otherParticipant?.profilePicture ||
                'https://api.a0.dev/assets/image?text=person%20professional%20portrait&aspect=1:1&seed=1',
        };
    }
    async getUserChats(request) {
        const userId = request.user?._id;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const chats = await chatModel_1.Chat.find({
            participants: userId,
            chatType: chatModel_1.ChatType.PRIVATE,
            isActive: true,
        })
            .populate('participants', 'name profilePicture isOnline')
            .populate({
            path: 'latestMessage',
            populate: { path: 'sender', select: 'name' },
        })
            .sort({ updatedAt: -1 })
            .lean();
        return Promise.all(chats.map((chat) => this.mapChatToResponse(chat, userId.toString())));
    }
    async getChatById(request, chatId) {
        const userId = request.user?._id;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const chat = await chatModel_1.Chat.findOne({
            _id: chatId,
            participants: userId,
            chatType: chatModel_1.ChatType.PRIVATE,
            isActive: true,
        })
            .populate('participants', 'name profilePicture isOnline')
            .populate({
            path: 'latestMessage',
            populate: { path: 'sender', select: 'name' },
        })
            .lean();
        if (!chat) {
            throw new errorTypes_1.NotFoundError('Chat not found');
        }
        return this.mapChatToResponse(chat, userId.toString());
    }
    async createPrivateChat(request, requestBody) {
        const userId = request.user?._id;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const { participantId } = requestBody;
        if (!mongoose_1.default.Types.ObjectId.isValid(participantId)) {
            throw new errorTypes_1.BadRequestError('Invalid participant ID');
        }
        const participant = await userModel_1.User.findById(participantId);
        if (!participant) {
            throw new errorTypes_1.NotFoundError('Participant not found');
        }
        const existingChat = await chatModel_1.Chat.findOne({
            chatType: chatModel_1.ChatType.PRIVATE,
            participants: { $all: [userId, participantId], $size: 2 },
            isActive: true,
        })
            .populate('participants', 'name profilePicture isOnline')
            .populate({
            path: 'latestMessage',
            populate: { path: 'sender', select: 'name' },
        })
            .lean();
        if (existingChat) {
            return this.mapChatToResponse(existingChat, userId.toString());
        }
        const newChat = await chatModel_1.Chat.create({
            chatType: chatModel_1.ChatType.PRIVATE,
            participants: [userId, participantId],
            isActive: true,
        });
        const populatedChat = await chatModel_1.Chat.findById(newChat._id)
            .populate('participants', 'name profilePicture isOnline')
            .lean();
        const response = await this.mapChatToResponse(populatedChat, userId.toString());
        // Notify participants
        // global.io?.to(participantId).to(userId.toString()).emit('newChat', response);
        return response;
    }
    async deleteChat(request, chatId) {
        /**
         * Deletes a private chat for the authenticated user.
         * @description Marks the chat as inactive if the user is a participant.
         */
        const userId = request.user?._id;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new errorTypes_1.UnauthorizedError('User not authenticated');
        }
        const chat = await chatModel_1.Chat.findOne({
            _id: chatId,
            participants: userId,
            chatType: chatModel_1.ChatType.PRIVATE,
            isActive: true,
        });
        if (!chat) {
            throw new errorTypes_1.NotFoundError('Chat not found');
        }
        chat.isActive = false;
        await chat.save();
        return { message: 'Chat deleted successfully' };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Get)(),
    (0, tsoa_1.Response)(200, 'Success'),
    (0, tsoa_1.Response)(401, 'Unauthorized')
    /**
     * Retrieves a list of active private chats for the authenticated user.
     * @description Returns chats sorted by most recent activity, including the last message and unread count.
     */
    ,
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUserChats", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Get)('{chatId}'),
    (0, tsoa_1.Response)(200, 'Success'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    (0, tsoa_1.Response)(404, 'Chat not found')
    /**
     * Retrieves details of a specific private chat by its ID.
     * @description Returns the chat if the authenticated user is a participant and the chat is active.
     */
    ,
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatById", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Post)('private'),
    (0, tsoa_1.Response)(201, 'Chat created successfully'),
    (0, tsoa_1.Response)(400, 'Bad request'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    (0, tsoa_1.Response)(404, 'Participant not found')
    /**
     * Creates a new private chat between the authenticated user and another user.
     * @description Returns an existing chat if one already exists; emits a real-time 'newChat' event.
     */
    ,
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createPrivateChat", null);
__decorate([
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Delete)('{chatId}'),
    (0, tsoa_1.Response)(200, 'Success'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    (0, tsoa_1.Response)(404, 'Chat not found'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteChat", null);
exports.ChatController = ChatController = __decorate([
    (0, tsoa_1.Route)('chats'),
    (0, tsoa_1.Tags)('Chats')
], ChatController);
