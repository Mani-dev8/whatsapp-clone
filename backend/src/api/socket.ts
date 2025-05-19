import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Message, MessageDocument } from './models/messageModel';
import { Chat, ChatDocument } from './models/chatModel';
import { User } from './models/userModel';
import { UnauthorizedError } from '@/util/errorTypes';
import { winstonLogger } from '@/util/logger';

interface JwtPayload {
  userId: string;
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
  status: string;
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

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      (socket as any).user = { userId: decoded.userId };
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
    const userId = new mongoose.Types.ObjectId(auth.userId);
    winstonLogger.info(`User connected: ${userId}`);

    // Join user to their own room for direct messaging
    socket.join(userId.toHexString());

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
          const chat = await Chat.findById(chatId).populate('participants');
          if (!chat) {
            socket.emit('error', { message: 'Chat not found' });
            return;
          }

          if (!chat.participants.some((p: any) => p._id.equals(userId))) {
            socket.emit('error', { message: 'User not in chat' });
            return;
          }

          const message = new Message({
            chat: chatId,
            sender: userId,
            content,
            messageType,
            mediaUrl,
            status: 'sent',
            readBy: [],
          }) as MessageDocument;

          await message.save();

          // Populate sender for response
          const populatedMessage = (await Message.findById(message._id)
            .populate('sender', 'name')
            .lean()) as PopulatedMessage | null;

          if (!populatedMessage) {
            socket.emit('error', { message: 'Message not found after saving' });
            winstonLogger.error(`Message ${message._id} not found after save`);
            return;
          }

          const messageResponse = {
            id: populatedMessage._id.toHexString(),
            chat: populatedMessage.chat.toString(),
            sender: {
              id: populatedMessage.sender._id.toHexString(),
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

          // Emit to all participants
          chat.participants.forEach((participant: any) => {
            io.to(participant._id.toHexString()).emit(
              'message',
              messageResponse,
            );
          });

          // Update message status to 'delivered' for online participants
          const onlineParticipants = chat.participants.filter(
            (p: any) =>
              io.sockets.adapter.rooms.has(p._id.toHexString()) &&
              !p._id.equals(userId),
          );
          if (onlineParticipants.length > 0) {
            await Message.findByIdAndUpdate(message._id, {
              status: 'delivered',
              $addToSet: {
                readBy: { $each: onlineParticipants.map((p: any) => p._id) },
              },
            });
            io.to(chatId).emit('messageStatus', {
              messageId: message._id.toString(),
              status: 'delivered',
              readBy: onlineParticipants.map((p: any) => p._id.toString()),
            });
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
      socket
        .to(chatId)
        .emit('typing', { userId: userId.toHexString(), isTyping });
    });

    // Handle message status update (e.g., read)
    socket.on(
      'updateMessageStatus',
      async (data: { messageId: string; status: 'read' }) => {
        try {
          const { messageId, status } = data;
          const message = await Message.findById(messageId);
          if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }

          if (!message.chat) {
            socket.emit('error', { message: 'Invalid chat' });
            return;
          }

          const chat = await Chat.findById(message.chat);
          if (
            !chat ||
            !chat.participants.some((p: any) => p._id.equals(userId))
          ) {
            socket.emit('error', { message: 'User not in chat' });
            return;
          }

          if (status === 'read' && !message.readBy.includes(userId)) {
            await Message.findByIdAndUpdate(messageId, {
              status: 'read',
              $addToSet: { readBy: userId },
            });
            io.to(message.chat.toString()).emit('messageStatus', {
              messageId: messageId,
              status: 'read',
              readBy: [
                ...message.readBy.map((id) => id.toString()),
                userId.toString(),
              ],
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

    // Handle disconnection
    socket.on('disconnect', async () => {
      winstonLogger.info(`User disconnected: ${userId}`);
      await updateUserStatus(io, userId, false);
      socket.broadcast.emit('userStatus', {
        userId: userId.toHexString(),
        isOnline: false,
      });
    });
  });
}

// Update user online status
async function updateUserStatus(
  io: SocketIOServer,
  userId: mongoose.Types.ObjectId,
  isOnline: boolean,
) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date(),
    });
    io.emit('userStatus', { userId: userId.toHexString(), isOnline });
  } catch (error) {
    winstonLogger.error('Error updating user status:', error);
  }
}

// Join user to all their chats
async function joinUserChats(socket: Socket, userId: mongoose.Types.ObjectId) {
  try {
    const chats = (await Chat.find({ participants: userId })) as ChatDocument[];
    chats.forEach((chat) => {
      socket.join(chat._id.toHexString());
    });
  } catch (error) {
    winstonLogger.error('Error joining chats:', error);
  }
}
