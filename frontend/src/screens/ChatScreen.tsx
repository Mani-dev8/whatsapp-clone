import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useGetChatMessagesQuery,
  useCreateMessageMutation,
  useUpdateMessageStatusMutation,
  MessageResponse,
} from '../store/apiSlice';
import {RootState} from '../store';
import {getSocket, initSocket} from '../utils/socket';
import {toast} from 'sonner-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import tw from 'twrnc';

// Helper function to create a unique message ID map
const createMessageMap = (messages: MessageResponse[]) => {
  const messageMap = new Map<string, MessageResponse>();

  messages.forEach(msg => {
    const existingMsg = messageMap.get(
      msg.content + msg.sender.id + msg.createdAt.split('T')[1].substring(0, 8),
    );

    if (!existingMsg) {
      messageMap.set(
        msg.content +
          msg.sender.id +
          msg.createdAt.split('T')[1].substring(0, 8),
        msg,
      );
    } else {
      if (
        msg.status === 'read' ||
        (msg.status === 'delivered' && existingMsg.status === 'sent')
      ) {
        messageMap.set(
          msg.content +
            msg.sender.id +
            msg.createdAt.split('T')[1].substring(0, 8),
          msg,
        );
      }
    }
  });

  return Array.from(messageMap.values());
};

const ChatScreen = ({route, navigation}: any) => {
  const {chatId, chatName} = route.params;
  const {user, token} = useSelector((state: RootState) => state.auth);
  const userId = user?.id;
  const [messageText, setMessageText] = useState('');
  const [page, setPage] = useState(1);
  const [allMessages, setAllMessages] = useState<MessageResponse[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isInitialLoad = useRef(true);
  const socketRef = useRef<ReturnType<typeof getSocket>>(null);
  const pendingMessagesRef = useRef<Map<string, string>>(new Map());

  const {
    data: messagesData,
    isLoading,
    isFetching,
  } = useGetChatMessagesQuery({
    chatId,
    page,
    limit: 20,
  });

  const [createMessage] = useCreateMessageMutation();
  const [updateMessageStatus] = useUpdateMessageStatusMutation();

  useEffect(() => {
    if (!socketRef.current && token) {
      console.log('Initializing socket connection');
      socketRef.current = initSocket();
    }

    return () => {};
  }, [token]);

  useEffect(() => {
    if (messagesData && isInitialLoad.current) {
      setAllMessages(createMessageMap(messagesData));
      isInitialLoad.current = false;
    } else if (messagesData && page > 1) {
      setAllMessages(prev => {
        const combinedMessages = [
          ...prev,
          ...messagesData.filter(msg => !prev.some(m => m.id === msg.id)),
        ];
        return createMessageMap(combinedMessages);
      });
    }
  }, [messagesData, page]);

  const handleIncomingMessage = useCallback(
    (newMessage: MessageResponse) => {
      console.log('Socket received message:', newMessage);
      if (newMessage.chat === chatId) {
        setAllMessages(prev => {
          const combinedKey =
            newMessage.content +
            newMessage.sender.id +
            new Date(newMessage.createdAt)
              .toISOString()
              .split('T')[1]
              .substring(0, 8);

          const updatedMessages = prev.map(msg => {
            if (
              msg.id.startsWith('temp-') &&
              msg.content === newMessage.content &&
              msg.sender.id === newMessage.sender.id &&
              Math.abs(
                new Date(msg.createdAt).getTime() -
                  new Date(newMessage.createdAt).getTime(),
              ) < 10000
            ) {
              return newMessage;
            }
            return msg;
          });

          if (!updatedMessages.some(msg => msg.id === newMessage.id)) {
            return createMessageMap([newMessage, ...updatedMessages]);
          }

          return createMessageMap(updatedMessages);
        });

        if (newMessage.sender.id !== userId && socketRef.current) {
          socketRef.current.emit('updateMessageStatus', {
            messageId: newMessage.id,
            status: 'read',
          });

          updateMessageStatus({messageId: newMessage.id, status: 'read'}).catch(
            err => console.error('Failed to update message status:', err),
          );
        }
      }
    },
    [chatId, userId, updateMessageStatus],
  );

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('message', handleIncomingMessage);
    socket.on('messageStatus', data => {
      console.log('Socket received message status update:', data);
      if (data.messageId) {
        setAllMessages(prev => {
          const updatedMessages = prev.map(msg =>
            msg.id === data.messageId
              ? {...msg, status: data.status, readBy: data.readBy || msg.readBy}
              : msg,
          );
          return createMessageMap(updatedMessages);
        });
      }
    });

    socket.on('typing', data => {
      if (data.chatId === chatId && data.userId !== userId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socket.off('message', handleIncomingMessage);
      socket.off('messageStatus');
      socket.off('typing');
    };
  }, [chatId, userId, handleIncomingMessage]);

  const handleTyping = (text: string) => {
    setMessageText(text);
    const socket = socketRef.current;
    if (socket) {
      socket.emit('typing', {chatId, isTyping: text.length > 0});
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText('');

    const socket = socketRef.current;
    if (socket) {
      socket.emit('typing', {chatId, isTyping: false});
    }

    try {
      const tempId = `temp-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const optimisticMessage: MessageResponse = {
        id: tempId,
        chat: chatId,
        sender: {id: userId!, name: user?.name || 'Me'},
        content,
        messageType: 'text',
        status: 'sent',
        readBy: [userId!],
        createdAt,
        updatedAt: createdAt,
      };

      setAllMessages(prev => createMessageMap([optimisticMessage, ...prev]));

      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({offset: 0, animated: true});
      }

      if (socket) {
        socket.emit('newMessage', {
          chatId,
          content,
          messageType: 'text',
        });
      }

      if (!socket || !socket.connected) {
        const result = await createMessage({
          chatId,
          content,
          messageType: 'text',
        }).unwrap();

        setAllMessages(prev =>
          createMessageMap(prev.map(msg => (msg.id === tempId ? result : msg))),
        );
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
      setAllMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  };

  const loadMoreMessages = () => {
    if (!isFetching && messagesData?.length === 20) {
      setPage(prev => prev + 1);
    }
  };

  const renderMessage = ({item}: {item: MessageResponse}) => {
    const isOwnMessage = item.sender.id === userId;
    const time = new Date(item.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={tw`my-1 mx-2 max-w-[80%] ${
          isOwnMessage ? 'self-end' : 'self-start'
        }`}>
        <View
          style={tw`bg-white rounded-lg p-2 shadow-md shadow-black/10 elevation-2`}>
          <Text style={tw`text-base`}>{item.content}</Text>
          <View style={tw`flex-row justify-end items-center mt-1`}>
            <Text style={tw`text-xs text-gray-600 mr-1`}>{time}</Text>
            {isOwnMessage && (
              <View style={tw`flex-row`}>
                {item.status === 'sent' && (
                  <Ionicons name="checkmark" size={16} color="#999" />
                )}
                {item.status === 'delivered' && (
                  <>
                    <Ionicons name="checkmark" size={16} color="#999" />
                    <Ionicons name="checkmark" size={16} color="#999" />
                  </>
                )}
                {item.status === 'read' && (
                  <>
                    <Ionicons name="checkmark" size={16} color="#00f" />
                    <Ionicons name="checkmark" size={16} color="#00f" />
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <View
        style={tw`flex-row items-center p-2 bg-white border-b border-gray-300`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold ml-2 flex-1`}>{chatName}</Text>
        {isTyping && (
          <Text style={tw`text-sm italic text-gray-600`}>typing...</Text>
        )}
      </View>
      {isLoading && page === 1 ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={allMessages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          inverted
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && page > 1 ? (
              <ActivityIndicator size="small" color="#007bff" />
            ) : null
          }
        />
      )}
      <View
        style={tw`flex-row items-center p-2 bg-white border-t border-gray-300`}>
        <TextInput
          style={tw`flex-1 border border-gray-300 rounded-full p-2 max-h-24`}
          value={messageText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor={"#8888"}
          multiline
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          style={tw`ml-2 p-1`}
          disabled={!messageText.trim()}>
          <Ionicons
            name="send"
            size={24}
            color={messageText.trim() ? '#007bff' : '#ccc'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;
