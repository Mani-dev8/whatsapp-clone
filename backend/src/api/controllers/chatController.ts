import {
  Controller,
  Get,
  Post,
  Delete,
  Route,
  Tags,
  Security,
  Request,
  Body,
  Path,
  Response,
} from 'tsoa';
import { Chat, ChatType } from '../models/chatModel';
import { Message } from '../models/messageModel';
import { User } from '../models/userModel';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '@/util/errorTypes';
import mongoose from 'mongoose';

interface ChatListResponse {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatar: string;
}

interface CreatePrivateChatRequest {
  participantId: string;
}

@Route('chats')
@Tags('Chats')
export class ChatController extends Controller {
  /**
   * Maps a chat document to a response format for the chat list.
   * @param chat The chat document from MongoDB.
   * @param userId The ID of the authenticated user.
   * @returns A formatted chat response.
   */
  private async mapChatToResponse(
    chat: any,
    userId: string,
  ): Promise<ChatListResponse> {
    const otherParticipant = chat.participants.find(
      (p: any) => p._id.toString() !== userId,
    );

    const unreadCount = await Message.countDocuments({
      chat: chat._id,
      status: { $ne: 'read' },
      readBy: { $ne: userId },
      deletedFor: { $ne: userId },
    });

    return {
      id: chat._id.toString(),
      name: otherParticipant?.name || 'Unknown',
      lastMessage: chat.latestMessage
        ? `${chat.latestMessage.sender?.name || 'Unknown'}: ${
            chat.latestMessage.content
          }`
        : '',
      time: chat.latestMessage
        ? new Date(chat.latestMessage.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
      unreadCount,
      avatar:
        otherParticipant?.profilePicture ||
        'https://api.a0.dev/assets/image?text=person%20professional%20portrait&aspect=1:1&seed=1',
    };
  }

  @Security('jwt')
  @Get()
  @Response(200, 'Success')
  @Response(401, 'Unauthorized')
  /**
   * Retrieves a list of active private chats for the authenticated user.
   * @description Returns chats sorted by most recent activity, including the last message and unread count.
   */
  public async getUserChats(
    @Request() request: AuthenticatedRequest,
  ): Promise<ChatListResponse[]> {
    const userId = request.user?._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedError('User not authenticated');
    }

    const chats = await Chat.find({
      participants: userId,
      chatType: ChatType.PRIVATE,
      isActive: true,
    })
      .populate('participants', 'name profilePicture isOnline')
      .populate({
        path: 'latestMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ updatedAt: -1 })
      .lean();

    return Promise.all(
      chats.map((chat) => this.mapChatToResponse(chat, userId.toString())),
    );
  }

  @Security('jwt')
  @Get('{chatId}')
  @Response(200, 'Success')
  @Response(401, 'Unauthorized')
  @Response(404, 'Chat not found')
  /**
   * Retrieves details of a specific private chat by its ID.
   * @description Returns the chat if the authenticated user is a participant and the chat is active.
   */
  public async getChatById(
    @Request() request: AuthenticatedRequest,
    @Path() chatId: string,
  ): Promise<ChatListResponse> {
    const userId = request.user?._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedError('User not authenticated');
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      chatType: ChatType.PRIVATE,
      isActive: true,
    })
      .populate('participants', 'name profilePicture isOnline')
      .populate({
        path: 'latestMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .lean();

    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    return this.mapChatToResponse(chat, userId.toString());
  }

  @Security('jwt')
  @Post('private')
  @Response(201, 'Chat created successfully')
  @Response(400, 'Bad request')
  @Response(401, 'Unauthorized')
  @Response(404, 'Participant not found')
  /**
   * Creates a new private chat between the authenticated user and another user.
   * @description Returns an existing chat if one already exists; emits a real-time 'newChat' event.
   */
  public async createPrivateChat(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: CreatePrivateChatRequest,
  ): Promise<ChatListResponse> {
    const userId = request.user?._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { participantId } = requestBody;
    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      throw new BadRequestError('Invalid participant ID');
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      throw new NotFoundError('Participant not found');
    }

    const existingChat = await Chat.findOne({
      chatType: ChatType.PRIVATE,
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

    const newChat = await Chat.create({
      chatType: ChatType.PRIVATE,
      participants: [userId, participantId],
      isActive: true,
    });

    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants', 'name profilePicture isOnline')
      .lean();

    const response = await this.mapChatToResponse(
      populatedChat,
      userId.toString(),
    );

    // Notify participants
    // global.io?.to(participantId).to(userId.toString()).emit('newChat', response);

    return response;
  }

  @Security('jwt')
  @Delete('{chatId}')
  @Response(200, 'Success')
  @Response(401, 'Unauthorized')
  @Response(404, 'Chat not found')
  public async deleteChat(
    @Request() request: AuthenticatedRequest,
    @Path() chatId: string,
  ): Promise<{ message: string }> {
    /**
     * Deletes a private chat for the authenticated user.
     * @description Marks the chat as inactive if the user is a participant.
     */
    const userId = request.user?._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedError('User not authenticated');
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      chatType: ChatType.PRIVATE,
      isActive: true,
    });

    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    chat.isActive = false;
    await chat.save();
    return { message: 'Chat deleted successfully' };
  }
}
