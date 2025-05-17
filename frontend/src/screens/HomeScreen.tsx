import { View, Text } from 'react-native'
import React from 'react'
import tw from '../libs/tailwind'

type Props = {}

const HomeScreen = (props: Props) => {
  return (
    <View style={tw`flex-1`}>
      <Text style={tw`text-black`}>HomeScreen</Text>
    </View>
  )
}

export default HomeScreen