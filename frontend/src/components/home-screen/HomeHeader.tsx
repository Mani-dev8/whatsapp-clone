import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import tw from '../../libs/tailwind';
import {COLORS} from '../../utils/constants';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import TouchableText from '../commons/TouchableText';
import {useLogoutMutation} from '../../store/apiSlice';
import {STORAGE_KEYS, storageUtils} from '../../utils/storage';
import {useNavigation} from '@react-navigation/native';

type Props = {};

const HomeHeader = (props: Props) => {
  const [logout] = useLogoutMutation();
  const navigation = useNavigation<any>();
  const handleLogout = async () => {
    const {error, data} = await logout();
    console.log(data, error);
    storageUtils.removeItem(STORAGE_KEYS.TOKEN);
  };

  return (
    <View
      style={tw`bg-[${COLORS.app.primary}] p-4 flex-row justify-between items-center`}>
      <Text style={tw`text-white text-xl font-bold`}>WhatsApp</Text>
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity style={tw`mr-4`}>
          <Ionicons name="camera-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
        <Menu
          onSelect={value => {
            if (value == 1) {
              navigation.navigate('Profile');
            } else if (value == 2) {
              handleLogout();
            }
          }}>
          <MenuTrigger style={tw`ml-4`}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </MenuTrigger>
          <MenuOptions customStyles={{optionsContainer: tw`mt-8 w-40`}}>
            <MenuOption value={1} text="Profile" style={tw`px-2 py-2`} />
            <MenuOption value={2} text="Logout" style={tw`px-2 py-2`} />
          </MenuOptions>
        </Menu>
      </View>
    </View>
  );
};

export default HomeHeader;
