import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useGetCurrentUserQuery, useSearchUsersQuery } from '../store/apiSlice';
import { useDispatch } from 'react-redux';
import { storageUtils, STORAGE_KEYS } from '../utils/storage';
import { disconnectSocket } from '../utils/socket';

const HomeScreen = ({ navigation }: any) => {
  const { data: user, error, isLoading } = useGetCurrentUserQuery();
  const { data: users } = useSearchUsersQuery('te');
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      storageUtils.removeItem(STORAGE_KEYS.TOKEN);
      storageUtils.removeItem(STORAGE_KEYS.USER);
      dispatch({ type: 'auth/logout' });
      disconnectSocket();
      navigation.navigate('Login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {JSON.stringify(error)}</Text>;

  return (
    <View>
      <Text>Welcome, {user?.name}</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text
            onPress={() => navigation.navigate('Chat', { chatId: item.id })}
          >
            {item.name}
          </Text>
        )}
      />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default HomeScreen;