import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import tw from 'twrnc';
import HomeHeader from '../components/home-screen/HomeHeader';
import TabBar from '../components/commons/TabBar';
import { statusBarWithPrimaryBg } from '../utils/helper';
import SearchBar from '../components/commons/SearchBar';
import { useCreatePrivateChatMutation, useLazySearchUsersQuery } from '../store/apiSlice';
import SearchListItem from '../components/commons/SearchListItem';
import ChatListItem from '../components/commons/ChatListItem';
import { toast } from 'sonner-native';

export default function HomeScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Chats');

  const [triggerSearch, { data: searchResults, isFetching }] =
    useLazySearchUsersQuery();

  const [createChat] = useCreatePrivateChatMutation();

  const startNewChat = async (userId: string) => {
    try {
      const chat = await createChat({ participantId: userId }).unwrap();
      navigation.navigate('Chat', { chatId: chat.id, chatName: chat.name });
    } catch (error) {
      toast.error('Failed to start chat');
      console.error('Create chat error:', error);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        triggerSearch(searchQuery.trim());
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      statusBarWithPrimaryBg();
      // return () => {
      //   statusBarWithWhiteBg();
      // };
    }, []),
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HomeHeader />
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList
        data={searchQuery ? searchResults : []}
        keyExtractor={item => item.id}
        renderItem={({ item }) =>
          searchQuery ? (
            <SearchListItem
              user={item}
              onPress={() => startNewChat(item.id)}
            />
          ) : (
            <ChatListItem
              chat={item}
              onPress={() => startNewChat(item.id)}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
