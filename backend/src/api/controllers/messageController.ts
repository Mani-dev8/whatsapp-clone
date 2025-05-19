// src/api/controllers/messageController.ts
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/util/errorTypes';
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Chat } from '../models/chatModel';
import {
  Message,
  MessageDocument,
  MessageStatus,
  MessageType,
  PopulatedMessage,
} from '../models/messageModel';

interface MessageResponse {
  id: string;
  chat: string;
  sender: {
    id: string;
    name: string;
  };
  content: string;
  messageType: MessageType;
  mediaUrl?: string;
  status: MessageStatus;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateMessageRequest {
  chatId: string;
  content: string;
  messageType?: MessageType;
  mediaUrl?: string;
}

@Route('messages')
@Tags('Messages')
export class MessageController extends Controller {
  /**
   * Create a new message in a chat
   */
  @Security('jwt')
  @Post()
  @Response(201, 'Message created successfully')
  @Response(400, 'Bad request')
  @Response(401, 'Unauthorized')
  @Response(403, 'Forbidden')
  @Response(404, 'Chat not found')
  public async createMessage(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: CreateMessageRequest,
  ): Promise<MessageResponse> {
    const userId = request.user?._id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const {
      chatId,
      content,
      messageType = MessageType.TEXT,
      mediaUrl,
    } = requestBody;

    if (!content && !mediaUrl) {
      throw new BadRequestError('Message content or media URL is required');
    }

    // Validate chat existence and user participation
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      isActive: true,
    });

    if (!chat) {
      throw new NotFoundError('Chat not found or user not a participant');
    }

    // Create new message
    const newMessage = new Message({
      chat: chatId,
      sender: userId,
      content,
      messageType,
      mediaUrl,
      status: MessageStatus.SENT,
      readBy: [userId],
      deletedFor: [],
    }) as MessageDocument;

    await newMessage.save();

    // Update chat's latest message
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: newMessage._id,
      updatedAt: new Date(),
    });

    // Populate sender information
    const populatedMessage = (await Message.findById(newMessage._id).populate(
      'sender',
      'name',
    )) as PopulatedMessage | null;

    if (!populatedMessage) {
      throw new NotFoundError('Message not found after creation');
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
      readBy: populatedMessage.readBy.map((id: any) => id.toHexString()),
      createdAt: populatedMessage.createdAt,
      updatedAt: populatedMessage.updatedAt,
    };
  }

  /**
   * Get messages for a specific chat
   */
  @Security('jwt')
  @Get('chat/{chatId}')
  @Response(200, 'Success')
  @Response(401, 'Unauthorized')
  @Response(403, 'Forbidden')
  @Response(404, 'Chat not found')
  public async getChatMessages(
    @Request() request: AuthenticatedRequest,
    @Path() chatId: string,
    @Query() page: number = 1,
    @Query() limit: number = 50,
  ): Promise<MessageResponse[]> {
    const userId = request.user?._id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    // Validate chat existence and user participation
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      isActive: true,
    });

    if (!chat) {
      throw new NotFoundError('Chat not found or user not a participant');
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get messages with pagination, excluding those deleted for the user
    const messages = (await Message.find({
      chat: chatId,
      deletedFor: { $ne: userId },
    })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)) as PopulatedMessage[];

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
      readBy: message.readBy.map((id: any) => id.toHexString()),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));
  }

  /**
   * Update message status (e.g., mark as read)
   */
  @Security('jwt')
  @Put('{messageId}/status')
  @Response(200, 'Message status updated successfully')
  @Response(401, 'Unauthorized')
  @Response(403, 'Forbidden')
  @Response(404, 'Message not found')
  public async updateMessageStatus(
    @Request() request: AuthenticatedRequest,
    @Path() messageId: string,
    @Body() requestBody: { status: MessageStatus },
  ): Promise<MessageResponse> {
    const userId = request.user?._id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const message = (await Message.findById(messageId)
      .populate('sender', 'name')
      .populate('chat')) as PopulatedMessage | null;

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: message.chat,
      participants: userId,
      isActive: true,
    });

    if (!chat) {
      throw new ForbiddenError('User not authorized to update this message');
    }

    // Update status
    if (requestBody.status === MessageStatus.READ) {
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        message.status = MessageStatus.READ;
      }
    } else if (requestBody.status === MessageStatus.DELIVERED) {
      message.status = MessageStatus.DELIVERED;
    } else {
      throw new BadRequestError('Invalid status update');
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
      readBy: message.readBy.map((id: any) => id.toHexString()),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  /**
   * Delete message for the current user
   */
  @Security('jwt')
  @Delete('{messageId}')
  @Response(200, 'Message deleted successfully')
  @Response(401, 'Unauthorized')
  @Response(403, 'Forbidden')
  @Response(404, 'Message not found')
  public async deleteMessage(
    @Request() request: AuthenticatedRequest,
    @Path() messageId: string,
  ): Promise<{ message: string }> {
    const userId = request.user?._id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const message = (await Message.findById(messageId).populate(
      'chat',
    )) as MessageDocument | null;

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: message.chat,
      participants: userId,
      isActive: true,
    });

    if (!chat) {
      throw new ForbiddenError('User not authorized to delete this message');
    }

    // Add user to deletedFor array
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    // If message is deleted for all participants, remove it
    if (message.deletedFor.length === chat.participants.length) {
      await Message.findByIdAndDelete(messageId);

      // Update chat's latest message if this was the latest
      if (chat.latestMessage?.toHexString() === messageId) {
        const latestMessage = await Message.findOne({
          chat: chat._id,
          deletedFor: { $ne: userId },
        }).sort({ createdAt: -1 });

        await Chat.findByIdAndUpdate(chat._id, {
          latestMessage: latestMessage?._id || null,
          updatedAt: new Date(),
        });
      }
    }

    return { message: 'Message deleted successfully' };
  }
}
