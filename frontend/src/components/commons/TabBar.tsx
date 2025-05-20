import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import tw from 'twrnc';
import {COLORS} from '../../utils/constants';

const tabs = ['Chats', 'Updates', 'Calls'];

type Props = {
  activeTab: string;
  setActiveTab: React.Dispatch<string>;
};

export default function TabBar({activeTab, setActiveTab}: Props) {
  return (
    <View style={tw`flex-row bg-[${COLORS.app.primary}]`}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab}
          style={tw`flex-1 items-center py-3 border-b-2 ${
            activeTab === tab ? 'border-white' : 'border-transparent'
          }`}
          onPress={() => setActiveTab(tab)}>
          <Text style={tw`text-white font-medium`}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
