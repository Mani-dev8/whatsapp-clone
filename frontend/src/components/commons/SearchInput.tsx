import { View, Text, TextInput } from 'react-native'
import React from 'react'
import tw from '../../libs/tailwind'
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = {}

const SearchInput = (props: Props) => {
  return (
    <View style={tw`px-4 py-2 bg-white`}>
      <View
        style={tw`bg-gray-100 rounded-full px-4 py-1 flex-row items-center`}>
        <Ionicons name="search" size={20} color="gray" />
        <TextInput
          style={tw`ml-2 flex-1 text-zinc-900`}
          placeholder="Search"
          value={searchQuery}
          placeholderTextColor={'#999'}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  )
}

export default SearchInput