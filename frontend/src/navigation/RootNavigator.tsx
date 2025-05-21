import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import {useSelector} from 'react-redux';
import {RootState} from '../store';
import SignupScreen from '../screens/SignupScreen';
import tw from '../libs/tailwind';
import {Text, TouchableOpacity, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {STORAGE_KEYS, storageUtils} from '../utils/storage';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  console.log(token);
  console.log(storageUtils.getItem(STORAGE_KEYS.TOKEN));
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          header: ({route, back, navigation}) => (
            <View style={tw`bg-white`}>
              {navigation.canGoBack() ? (
                <TouchableOpacity
                  style={tw`p-3.5 self-start`}
                  onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={24} />
                </TouchableOpacity>
              ) : null}
              {/* <Text>{route.name}</Text> */}
            </View>
          ),
        }}>
        {token ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{headerShown: false}}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="SignUp"
              component={SignupScreen}
              // options={{headerShown: false}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
