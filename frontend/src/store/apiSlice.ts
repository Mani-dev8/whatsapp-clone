import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {storageUtils, STORAGE_KEYS} from '../utils/storage';
import {API_URL} from '../utils/constants';

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  about?: string;
  lastSeen: string;
  isOnline: boolean;
  lastMessage: string;
  unreadCount: number;
  time: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    about?: string;
  };
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

export interface MessageResponse {
  id: string;
  chat: string;
  sender: {id: string; name: string};
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

interface UpdateMessageStatusRequest {
  status: 'read' | 'delivered';
}

interface CreatePrivateChatRequest {
  participantId: string;
}

interface UpdateUserProfileRequest {
  name?: string;
  about?: string;
  profilePicture?: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: headers => {
      const token = storageUtils.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Chats', 'Messages'],
  endpoints: builder => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: body => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: body => ({
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
      async onQueryStarted(_, {dispatch, queryFulfilled}) {
        try {
          await queryFulfilled;
        } catch (err) {
        } finally {
          dispatch({type: 'auth/logout'});
        }
      },
    }),
    getCurrentUser: builder.query<UserProfileResponse, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation<
      UserProfileResponse,
      UpdateUserProfileRequest
    >({
      query: body => ({
        url: '/users/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    getUserById: builder.query<UserProfileResponse, string>({
      query: userId => `/users/${userId}`,
    }),
    searchUsers: builder.query<UserProfileResponse[], string>({
      query: query => `/users/search/${encodeURIComponent(query)}`,
    }),
    getChats: builder.query<UserProfileResponse[], void>({
      query: () => '/chats',
    }),
    getChatById: builder.query<UserProfileResponse, string>({
      query: chatId => `/chats/${chatId}`,
    }),
    createPrivateChat: builder.mutation<
      UserProfileResponse,
      CreatePrivateChatRequest
    >({
      query: body => ({
        url: '/chats/private',
        method: 'POST',
        body,
      }),
    }),
    deleteChat: builder.mutation<{message: string}, string>({
      query: chatId => ({
        url: `/chats/${chatId}`,
        method: 'DELETE',
      }),
    }),
    createMessage: builder.mutation<MessageResponse, CreateMessageRequest>({
      query: body => ({
        url: '/messages',
        method: 'POST',
        body,
      }),
    }),
    getChatMessages: builder.query<
      MessageResponse[],
      {chatId: string; page?: number; limit?: number}
    >({
      query: ({chatId, page = 1, limit = 50}) =>
        `/messages/chat/${chatId}?page=${page}&limit=${limit}`,
    }),
    updateMessageStatus: builder.mutation<
      MessageResponse,
      {messageId: string; status: 'read' | 'delivered'}
    >({
      query: ({messageId, status}) => ({
        url: `/messages/${messageId}/status`,
        method: 'PUT',
        body: {status},
      }),
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
  useLazySearchUsersQuery,
  useGetChatsQuery,
  useGetChatByIdQuery,
  useCreatePrivateChatMutation,
  useDeleteChatMutation,
  useCreateMessageMutation,
  useGetChatMessagesQuery,
  useUpdateMessageStatusMutation,
  useUpdateUserProfileMutation
} = apiSlice;
