import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { storage, STORAGE_KEYS } from '../utils/storage';

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  about?: string;
  lastSeen: string;
  isOnline: boolean;
}

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; profilePicture?: string; about?: string };
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface MessageResponse {
  id: string;
  chat: string;
  sender: { id: string; name: string };
  content: string;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'document' | 'location';
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateMessageRequest {
  chatId: string;
  content: string;
  messageType?: 'text' | 'image' | 'voice' | 'video' | 'document' | 'location';
  mediaUrl?: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5001',
    prepareHeaders: async (headers) => {
      const token = await storage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Auth Routes
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // User Routes
    getCurrentUser: builder.query<UserProfileResponse, void>({
      query: () => '/users/me',
    }),
    getUserById: builder.query<UserProfileResponse, string>({
      query: (userId) => `/users/${userId}`,
    }),
    searchUsers: builder.query<UserProfileResponse[], string>({
      query: (query) => `/users/search/${encodeURIComponent(query)}`,
    }),

    // Message Routes
    createMessage: builder.mutation<MessageResponse, CreateMessageRequest>({
      query: (body) => ({
        url: '/messages',
        method: 'POST',
        body,
      }),
    }),
    getChatMessages: builder.query<MessageResponse[], { chatId: string; page?: number; limit?: number }>({
      query: ({ chatId, page = 1, limit = 50 }) =>
        `/messages/chat/${chatId}?page=${page}&limit=${limit}`,
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useGetUserByIdQuery,
  useSearchUsersQuery,
  useCreateMessageMutation,
  useGetChatMessagesQuery,
} = apiSlice;