import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ChatListItem from '../components/ChatListItem';

const DUMMY_CHATS = [
  {
    id: '1',
    name: 'John Doe',
    lastMessage: 'Hey, how are you doing?',
    time: '9:30 AM',
    avatar: 'https://api.a0.dev/assets/image?text=profile%20picture%20of%20a%20young%20professional%20man&seed=1',
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Jane Smith',
    lastMessage: 'The meeting is scheduled for tomorrow',
    time: 'Yesterday',
    avatar: 'https://api.a0.dev/assets/image?text=profile%20picture%20of%20a%20young%20professional%20woman&seed=2',
    unreadCount: 1,
  },
  {
    id: '3',
    name: 'Developer Group',
    lastMessage: 'Alice: The new update is live!',
    time: 'Yesterday',
    avatar: 'https://api.a0.dev/assets/image?text=group%20of%20developers%20icon&seed=3',
    unreadCount: 5,
  },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  const handleChatPress = (chatId: string) => {
    navigation.navigate('Chat', { chatId });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={DUMMY_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            {...item}
            onPress={handleChatPress}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  separator: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginLeft: 82,
  },
});
