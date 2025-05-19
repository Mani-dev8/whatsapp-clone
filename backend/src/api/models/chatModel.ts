import mongoose, { Document, Schema } from 'mongoose';
import { UserDocument } from './userModel';

export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export interface ChatDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  chatType: ChatType;
  participants: UserDocument['_id'][];
  groupAdmin?: UserDocument['_id'];
  groupImage?: string;
  latestMessage?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<ChatDocument>(
  {
    name: {
      type: String,
      trim: true,
    },
    chatType: {
      type: String,
      enum: Object.values(ChatType),
      default: ChatType.PRIVATE,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    groupImage: {
      type: String,
    },
    latestMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Add index for faster queries
chatSchema.index({ participants: 1 });

// Add compound index for private chats to ensure uniqueness between same two users
chatSchema.index(
  { chatType: 1, participants: 1 },
  {
    unique: true,
    partialFilterExpression: {
      chatType: ChatType.PRIVATE,
      participants: { $size: 2 },
    },
  },
);

export const Chat = mongoose.model<ChatDocument>('Chat', chatSchema);
