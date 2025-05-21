import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Message, MessageDocument, MessageStatus } from './models/messageModel';
import { Chat, ChatDocument } from './models/chatModel';
import { User } from './models/userModel';
import { UnauthorizedError } from '@/util/errorTypes';
import { winstonLogger } from '@/util/logger';
import { env } from './config/env';

interface JwtPayload {
  _id: string;
  email: string;
  role?: string;
}

interface SocketAuth {
  userId: string;
}

interface PopulatedMessage {
  _id: mongoose.Types.ObjectId;
  chat: mongoose.Types.ObjectId;
  sender: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };
  content: string;
  messageType: string;
  mediaUrl?: string;
  status: MessageStatus;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export function initializeSocket(io: SocketIOServer) {
  // Middleware for socket authentication
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      const jwtSecret = env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      (socket as any).user = { userId: decoded._id };
      next();
    } catch (error) {
      winstonLogger.error('Socket authentication error:', error);
      if (error instanceof jwt.TokenExpiredError) {
        next(new UnauthorizedError('Token expired'));
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new UnauthorizedError('Invalid token'));
      } else {
        next(
          error instanceof Error
            ? error
            : new UnauthorizedError('Authentication failed'),
        );
      }
    }
  });

  // Handle socket connections
  io.on('connection', (socket: Socket) => {
    const auth = (socket as any).user as SocketAuth;
    const userId = auth.userId;
    winstonLogger.info(`User connected: ${userId}`);

    // Join user to their own room for direct messaging
    socket.join(userId);

    // Update user online status
    updateUserStatus(io, userId, true);

    // Join user to all their chats
    joinUserChats(socket, userId);

    // Handle new message
    socket.on(
      'newMessage',
      async (data: {
        chatId: string;
        content: string;
        messageType?: string;
        mediaUrl?: string;
      }) => {
        try {
          const { chatId, content, messageType = 'text', mediaUrl } = data;

          winstonLogger.info(
            `New message from ${userId} in chat ${chatId}: ${content}`,
          );

          const chat = await Chat.findById(chatId);
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
          const message = new Message({
            chat: chatId,
            sender: userId,
            content,
            messageType,
            mediaUrl,
            status: 'sent',
            readBy: [userId],
            deletedFor: [],
          }) as MessageDocument;

          await message.save();

          // Update chat's latest message
          await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message._id,
            updatedAt: new Date(),
          });

          // Populate message for response
          const populatedMessage = (await Message.findById(message._id)
            .populate('sender', 'name')
            .lean()) as PopulatedMessage | null;

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
          winstonLogger.info(
            `Broadcasting message to participants: ${participants.join(', ')}`,
          );

          // Emit to all participants
          participants.forEach((participantId) => {
            io.to(participantId).emit('message', messageResponse);
          });

          // For participants who are online, update message status to 'delivered'
          const onlineParticipants = participants.filter(
            (pid) => pid !== userId && io.sockets.adapter.rooms.has(pid),
          );

          if (onlineParticipants.length > 0) {
            await Message.findByIdAndUpdate(message._id, {
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
        } catch (error) {
          winstonLogger.error('Error sending message:', error);
          socket.emit('error', {
            message:
              error instanceof Error ? error.message : 'Failed to send message',
          });
        }
      },
    );

    // Handle typing indicator
    socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
      const { chatId, isTyping } = data;

      // Get the chat
      Chat.findById(chatId)
        .then((chat) => {
          if (!chat) return;

          // Broadcast typing status to all participants except sender
          chat.participants.forEach((participant) => {
            const pid = participant.toString();
            if (pid !== userId) {
              io.to(pid).emit('typing', { userId, chatId, isTyping });
            }
          });
        })
        .catch((err) => {
          winstonLogger.error('Error in typing indicator:', err);
        });
    });

    // Handle message status update (e.g., read)
    socket.on(
      'updateMessageStatus',
      async (data: { messageId: string; status: string }) => {
        try {
          const { messageId, status } = data;
          const message = await Message.findById(messageId);

          if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }

          const chatId = message.chat.toString();
          const chat = await Chat.findById(chatId);

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
          if (
            status === 'read' &&
            !message.readBy.some((id) => id.toString() === userId)
          ) {
            message.readBy.push(new mongoose.Types.ObjectId(userId));
            message.status = 'read' as MessageStatus;
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
        } catch (error) {
          winstonLogger.error('Error updating message status:', error);
          socket.emit('error', {
            message:
              error instanceof Error
                ? error.message
                : 'Failed to update message status',
          });
        }
      },
    );

    // Handle disconnect
    socket.on('disconnect', async () => {
      winstonLogger.info(`User disconnected: ${userId}`);
      await updateUserStatus(io, userId, false);
    });
  });
}

// Update user online status
async function updateUserStatus(
  io: SocketIOServer,
  userId: string,
  isOnline: boolean,
) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date(),
    });
    winstonLogger.http('Socket connected');
    // Broadcast user status to all connected clients
    io.emit('userStatus', { userId, isOnline });
  } catch (error) {
    winstonLogger.error('Error updating user status:', error);
  }
}

// Join user to all their chats
async function joinUserChats(socket: Socket, userId: string) {
  try {
    const chats = await Chat.find({
      participants: userId,
      isActive: true,
    });

    chats.forEach((chat) => {
      socket.join(chat._id.toString());
      winstonLogger.info(`User ${userId} joined chat room: ${chat._id}`);
    });
  } catch (error) {
    winstonLogger.error('Error joining chats:', error);
  }
}
