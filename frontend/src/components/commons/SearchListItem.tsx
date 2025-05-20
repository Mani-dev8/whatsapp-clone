import {View, Text, TouchableOpacity, Image} from 'react-native';
import React from 'react';
import tw from '../../libs/tailwind';
import {UserProfileResponse} from '../../store/apiSlice';

type Props = {
  user: Omit<UserProfileResponse, 'unreadCount' | 'time' | 'lastMessage'>;
  onPress: () => void;
};

const SearchListItem = ({user, onPress}: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`flex-row items-center p-3 border-b border-gray-100`}>
      <Image
        source={{uri: user.profilePicture}}
        style={tw`w-12 h-12 rounded-full bg-zinc-100`}
      />
      <View style={tw`flex-1 ml-3`}>
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`font-semibold text-base`}>{user.name}</Text>
        </View>
        <View style={tw`flex-row justify-between items-center mt-1`}>
          <Text style={tw`text-gray-500 flex-1 mr-2`} numberOfLines={1}>
            {user.about}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SearchListItem;
