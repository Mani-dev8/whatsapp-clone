"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const messageModel_1 = require("./models/messageModel");
const chatModel_1 = require("./models/chatModel");
const userModel_1 = require("./models/userModel");
const errorTypes_1 = require("@/util/errorTypes");
const logger_1 = require("@/util/logger");
const env_1 = require("./config/env");
function initializeSocket(io) {
    // Middleware for socket authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                throw new errorTypes_1.UnauthorizedError('No token provided');
            }
            const jwtSecret = env_1.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not defined');
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            socket.user = { userId: decoded._id };
            next();
        }
        catch (error) {
            logger_1.winstonLogger.error('Socket authentication error:', error);
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                next(new errorTypes_1.UnauthorizedError('Token expired'));
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                next(new errorTypes_1.UnauthorizedError('Invalid token'));
            }
            else {
                next(error instanceof Error
                    ? error
                    : new errorTypes_1.UnauthorizedError('Authentication failed'));
            }
        }
    });
    // Handle socket connections
    io.on('connection', (socket) => {
        const auth = socket.user;
        const userId = auth.userId;
        logger_1.winstonLogger.info(`User connected: ${userId}`);
        // Join user to their own room for direct messaging
        socket.join(userId);
        // Update user online status
        updateUserStatus(io, userId, true);
        // Join user to all their chats
        joinUserChats(socket, userId);
        // Handle new message
        socket.on('newMessage', async (data) => {
            try {
                const { chatId, content, messageType = 'text', mediaUrl } = data;
                logger_1.winstonLogger.info(`New message from ${userId} in chat ${chatId}: ${content}`);
                const chat = await chatModel_1.Chat.findById(chatId);
                if (!chat) {
                    socket.emit('error', { message: 'Chat not found' });
                    return;
                }
                // Verify user is part of the chat
                if (!chat.participants.some((p) => p.toString() === userId)) {
                    socket.emit('error', { message: 'User not in chat' });
                    return;
                }
                // Create new message
                const message = new messageModel_1.Message({
                    chat: chatId,
                    sender: userId,
                    content,
                    messageType,
                    mediaUrl,
                    status: 'sent',
                    readBy: [userId],
                    deletedFor: [],
                });
                await message.save();
                // Update chat's latest message
                await chatModel_1.Chat.findByIdAndUpdate(chatId, {
                    latestMessage: message._id,
                    updatedAt: new Date(),
                });
                // Populate message for response
                const populatedMessage = (await messageModel_1.Message.findById(message._id)
                    .populate('sender', 'name')
                    .lean());
                if (!populatedMessage) {
                    socket.emit('error', { message: 'Message not found after saving' });
                    return;
                }
                // Format message for response
                const messageResponse = {
                    id: populatedMessage._id.toString(),
                    chat: populatedMessage.chat.toString(),
                    sender: {
                        id: populatedMessage.sender._id.toString(),
                        name: populatedMessage.sender.name,
                    },
                    content: populatedMessage.content,
                    messageType: populatedMessage.messageType,
                    mediaUrl: populatedMessage.mediaUrl,
                    status: populatedMessage.status,
                    readBy: populatedMessage.readBy.map((id) => id.toString()),
                    createdAt: populatedMessage.createdAt,
                    updatedAt: populatedMessage.updatedAt,
                };
                // Get all participants
                const participants = chat.participants.map((p) => p.toString());
                logger_1.winstonLogger.info(`Broadcasting message to participants: ${participants.join(', ')}`);
                // Emit to all participants
                participants.forEach((participantId) => {
                    io.to(participantId).emit('message', messageResponse);
                });
                // For participants who are online, update message status to 'delivered'
                const onlineParticipants = participants.filter((pid) => pid !== userId && io.sockets.adapter.rooms.has(pid));
                if (onlineParticipants.length > 0) {
                    await messageModel_1.Message.findByIdAndUpdate(message._id, {
                        status: 'delivered',
                        $addToSet: {
                            readBy: { $each: onlineParticipants },
                        },
                    });
                    const statusUpdate = {
                        messageId: message._id.toString(),
                        status: 'delivered',
                        readBy: [
                            ...message.readBy.map((id) => id.toString()),
                            ...onlineParticipants,
                        ],
                    };
                    // Send status update to sender
                    socket.emit('messageStatus', statusUpdate);
                }
            }
            catch (error) {
                logger_1.winstonLogger.error('Error sending message:', error);
                socket.emit('error', {
                    message: error instanceof Error ? error.message : 'Failed to send message',
                });
            }
        });
        // Handle typing indicator
        socket.on('typing', (data) => {
            const { chatId, isTyping } = data;
            // Get the chat
            chatModel_1.Chat.findById(chatId)
                .then((chat) => {
                if (!chat)
                    return;
                // Broadcast typing status to all participants except sender
                chat.participants.forEach((participant) => {
                    const pid = participant.toString();
                    if (pid !== userId) {
                        io.to(pid).emit('typing', { userId, chatId, isTyping });
                    }
                });
            })
                .catch((err) => {
                logger_1.winstonLogger.error('Error in typing indicator:', err);
            });
        });
        // Handle message status update (e.g., read)
        socket.on('updateMessageStatus', async (data) => {
            try {
                const { messageId, status } = data;
                const message = await messageModel_1.Message.findById(messageId);
                if (!message) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }
                const chatId = message.chat.toString();
                const chat = await chatModel_1.Chat.findById(chatId);
                if (!chat) {
                    socket.emit('error', { message: 'Chat not found' });
                    return;
                }
                // Verify user is part of the chat
                if (!chat.participants.some((p) => p.toString() === userId)) {
                    socket.emit('error', { message: 'User not in chat' });
                    return;
                }
                // Update message status
                if (status === 'read' &&
                    !message.readBy.some((id) => id.toString() === userId)) {
                    message.readBy.push(new mongoose_1.default.Types.ObjectId(userId));
                    message.status = 'read';
                    await message.save();
                    // Notify all participants about status change
                    const statusUpdate = {
                        messageId: message._id.toString(),
                        status: 'read',
                        readBy: message.readBy.map((id) => id.toString()),
                    };
                    chat.participants.forEach((participant) => {
                        io.to(participant.toString()).emit('messageStatus', statusUpdate);
                    });
                }
            }
            catch (error) {
                logger_1.winstonLogger.error('Error updating message status:', error);
                socket.emit('error', {
                    message: error instanceof Error
                        ? error.message
                        : 'Failed to update message status',
                });
            }
        });
        // Handle disconnect
        socket.on('disconnect', async () => {
            logger_1.winstonLogger.info(`User disconnected: ${userId}`);
            await updateUserStatus(io, userId, false);
        });
    });
}
// Update user online status
async function updateUserStatus(io, userId, isOnline) {
    try {
        await userModel_1.User.findByIdAndUpdate(userId, {
            isOnline,
            lastSeen: new Date(),
        });
        logger_1.winstonLogger.http('Socket connected');
        // Broadcast user status to all connected clients
        io.emit('userStatus', { userId, isOnline });
    }
    catch (error) {
        logger_1.winstonLogger.error('Error updating user status:', error);
    }
}
// Join user to all their chats
async function joinUserChats(socket, userId) {
    try {
        const chats = await chatModel_1.Chat.find({
            participants: userId,
            isActive: true,
        });
        chats.forEach((chat) => {
            socket.join(chat._id.toString());
            logger_1.winstonLogger.info(`User ${userId} joined chat room: ${chat._id}`);
        });
    }
    catch (error) {
        logger_1.winstonLogger.error('Error joining chats:', error);
    }
}
