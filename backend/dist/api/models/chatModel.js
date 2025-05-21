"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = exports.ChatType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ChatType;
(function (ChatType) {
    ChatType["PRIVATE"] = "private";
    ChatType["GROUP"] = "group";
})(ChatType || (exports.ChatType = ChatType = {}));
const chatSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
    groupAdmin: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    groupImage: {
        type: String,
    },
    latestMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Add index for faster queries
chatSchema.index({ participants: 1 });
// Add compound index for private chats to ensure uniqueness between same two users
chatSchema.index({ chatType: 1, participants: 1 }, {
    unique: true,
    partialFilterExpression: {
        chatType: ChatType.PRIVATE,
        participants: { $size: 2 },
    },
});
exports.Chat = mongoose_1.default.model('Chat', chatSchema);
