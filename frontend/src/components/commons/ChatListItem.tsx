import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { UserProfileResponse } from '../../store/apiSlice';

type Props = {
  chat: UserProfileResponse;
  onPress: () => void;
};
export default function ChatListItem({ chat, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`flex-row items-center p-3 border-b border-gray-100`}>
      <Image
        source={{ uri: chat.profilePicture || `https://avatar.iran.liara.run/username?username=${chat.name}&bold=false&length=1` }}
        style={tw`w-12 h-12 rounded-full bg-zinc-100`}
      />
      <View style={tw`flex-1 ml-3`}>
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`font-semibold text-base capitalize`}>{chat.name}</Text>
          <Text style={tw`text-gray-500 text-xs`}>{chat.time}</Text>
        </View>
        <View style={tw`flex-row justify-between items-center mt-1`}>
          <Text style={tw`text-gray-500 flex-1 mr-2`} numberOfLines={1}>
            {chat.lastMessage.split(':')[1]}
          </Text>
          {chat.unreadCount > 0 && (
            <View
              style={tw`bg-[#25D366] rounded-full w-5 h-5 items-center justify-center`}>
              <Text style={tw`text-white text-xs`}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
