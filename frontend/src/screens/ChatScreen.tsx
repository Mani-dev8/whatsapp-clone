import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  useGetChatMessagesQuery,
  useCreateMessageMutation,
  useUpdateMessageStatusMutation,
} from '../store/apiSlice';
import { RootState } from '../store';
import { getSocket } from '../utils/socket';
import { toast } from 'sonner-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Message {
  id: string;
  chat: string;
  sender: { id: string; name: string };
  content: string;
  messageType: 'text';
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  createdAt: string;
}

const ChatScreen = ({ route, navigation }: any) => {
  const { chatId, chatName } = route.params;
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [messageText, setMessageText] = useState('');
  const [page, setPage] = useState(1);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const isInitialLoad = useRef(true);

  const { data: messagesData, isLoading, isFetching } = useGetChatMessagesQuery({
    chatId,
    page,
    limit: 20,
  });
  console.log('Messages fetched:', messagesData, 'Page:', page, 'Messages count:', allMessages.length);

  const [createMessage] = useCreateMessageMutation();
  const [updateMessageStatus] = useUpdateMessageStatusMutation();

  useEffect(() => {
    if (messagesData && isInitialLoad.current) {
      setAllMessages(messagesData);
      isInitialLoad.current = false;
      console.log('Initial messages set:', messagesData.length);
    } else if (messagesData && page > 1) {
      setAllMessages((prev) => {
        const newMessages = messagesData.filter(
          (msg) => !prev.some((m) => m.id === msg.id),
        );
        console.log('Appending messages:', newMessages.length, 'Total:', [...prev, ...newMessages].length);
        return [...prev, ...newMessages];
      });
    }
  }, [messagesData, page]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('joinChat', chatId);
      console.log('Joined chat:', chatId);

      socket.on('message', (newMessage: Message) => {
        console.log('New message received:', newMessage);
        if (newMessage.chat === chatId) {
          setAllMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) {
              console.log('Duplicate message ignored:', newMessage.id);
              return prev;
            }
            console.log('Appending new message:', newMessage.id, 'Total:', [newMessage, ...prev].length);
            return [newMessage, ...prev];
          });
          if (newMessage.sender.id !== userId) {
            updateMessageStatus({ messageId: newMessage.id, status: 'read' });
          }
        }
      });

      socket.on('messageStatus', (updatedMessage: Message) => {
        console.log('Message status updated:', updatedMessage);
        if (updatedMessage.chat === chatId) {
          setAllMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? { ...msg, status: updatedMessage.status } : msg,
            ),
          );
        }
      });

      return () => {
        socket.emit('leaveChat', chatId);
        console.log('Left chat:', chatId);
        socket.off('message');
        socket.off('messageStatus');
      };
    }
  }, [chatId, userId, updateMessageStatus]);

  useEffect(() => {
    if (allMessages.length > 0 && userId) {
      const unreadMessages = allMessages.filter(
        (msg) => msg.sender.id !== userId && !msg.readBy.includes(userId),
      );
      unreadMessages.forEach((msg) => {
        updateMessageStatus({ messageId: msg.id, status: 'read' });
      });
    }
  }, [allMessages, userId, updateMessageStatus]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const newMessage = await createMessage({
        chatId,
        content: messageText,
        messageType: 'text',
      }).unwrap();
      console.log('Message sent:', newMessage);
      setMessageText('');
      setAllMessages((prev) => {
        if (prev.some((msg) => msg.id === newMessage.id)) {
          console.log('Duplicate sent message ignored:', newMessage.id);
          return prev;
        }
        console.log('Appending sent message:', newMessage.id, 'Total:', [newMessage, ...prev].length);
        return [newMessage, ...prev];
      });
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    }
  };

  const loadMoreMessages = () => {
    if (!isFetching && messagesData?.length === 20) {
      console.log('Loading more messages, page:', page + 1);
      setPage((prev) => prev + 1);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender.id === userId;
    const time = new Date(item.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{item.content}</Text>
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{time}</Text>
            {isOwnMessage && (
              <View style={styles.tickContainer}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{chatName}</Text>
      </View>
      {isLoading && page === 1 ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={allMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
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
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  messageContainer: {
    marginVertical: 5,
    marginHorizontal: 10,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 5,
  },
  tickContainer: {
    flexDirection: 'row',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
  },
});

export default ChatScreen;