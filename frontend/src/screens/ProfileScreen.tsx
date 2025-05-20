import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import ProfileEditModal from '../components/profile-screen/ProfileEditModal';

const initialProfile = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  profilePicture:
    'https://api.a0.dev/assets/image?text=professional%20portrait%20photo%20of%20person&seed=123',
  about: "Hey there! I'm using WhatsApp",
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editType, setEditType] = useState<'name' | 'about' | 'profilePicture' | null>(
    null,
  );

  const handleEdit = (type: 'name' | 'about' | 'profilePicture') => {
    setEditType(type);
    setIsEditModalVisible(true);
  };

  const handleUpdate = (type: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [type]: value,
    }));
    setIsEditModalVisible(false);
  };

  return (
    <ScrollView style={tw`flex-1 bg-gray-100`}>
      <View style={tw`bg-white`}>
        <View style={tw`items-center py-6`}>
          <TouchableOpacity
            onPress={() => handleEdit('profilePicture')}
            style={tw`relative`}>
            <Image
              source={{uri: profile.profilePicture}}
              style={tw`w-32 h-32 rounded-full`}
            />
            <View
              style={tw`absolute bottom-0 right-0 bg-teal-600 p-2 rounded-full`}>
              <MaterialIcons name="camera-alt" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={tw`px-4 py-4`}>
          <Text style={tw`text-xs text-gray-500 mb-1`}>Name</Text>
          <View style={tw`flex-row items-center justify-between`}>
            <Text style={tw`text-base`}>{profile.name}</Text>
            <TouchableOpacity onPress={() => handleEdit('name')}>
              <MaterialIcons name="edit" size={24} color="#075E54" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`mt-2 px-4 py-4`}>
          <Text style={tw`text-xs text-gray-500 mb-1`}>About</Text>
          <View style={tw`flex-row items-center justify-between`}>
            <Text style={tw`text-base`}>{profile.about}</Text>
            <TouchableOpacity onPress={() => handleEdit('about')}>
              <MaterialIcons name="edit" size={24} color="#075E54" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`mt-2 px-4 py-4`}>
          <Text style={tw`text-xs text-gray-500 mb-1`}>Email</Text>
          <Text style={tw`text-base text-gray-600`}>{profile.email}</Text>
        </View>
      </View>

      <ProfileEditModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSubmit={value => handleUpdate(editType!, value)}
        type={editType}
        initialValue={editType ? profile[editType] : ''}
      />
    </ScrollView>
  );
}
