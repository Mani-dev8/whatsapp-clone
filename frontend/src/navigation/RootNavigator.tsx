import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import SignupScreen from '../screens/SignupScreen';
import tw from '../libs/tailwind';
import { Text, TouchableOpacity, View } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ header: ({ route, back, navigation }) => <View><TouchableOpacity onPress={() => navigation.goBack()}><Text style={tw``}>{back?.title}</Text></TouchableOpacity><Text>{route.name}</Text></View> }}>
        {token ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="SingUp" component={SignupScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;