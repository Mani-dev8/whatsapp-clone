import React, { useState } from 'react';
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
import { useGetCurrentUserQuery, useUpdateUserProfileMutation } from '../store/apiSlice';
import { toast } from 'sonner-native';

export default function ProfileScreen() {
  const { data: profile, refetch } = useGetCurrentUserQuery();
  const [updateUserProfile] = useUpdateUserProfileMutation();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editType, setEditType] = useState<'name' | 'about' | 'profilePicture' | null>(null);

  const handleEdit = (type: 'name' | 'about' | 'profilePicture') => {
    setEditType(type);
    setIsEditModalVisible(true);
  };

  const handleUpdate = async (type: string, value: string) => {
    try {
      await updateUserProfile({ [type]: value }).unwrap();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
      refetch(); // Ensure latest profile data
      setIsEditModalVisible(false);
    } catch (error) {
      toast.error(`Failed to update ${type}`);
      console.error(`Update ${type} error:`, error);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <ScrollView style={tw`flex-1 bg-gray-100`} keyboardShouldPersistTaps="handled">
      <View style={tw`bg-white`}>
        <View style={tw`items-center py-6`}>
          <TouchableOpacity
            onPress={() => handleEdit('profilePicture')}
            style={tw`relative`}
          >
            <Image
              source={{
                uri:
                  profile.profilePicture ||
                  `https://avatar.iran.liara.run/username?username=${profile.name}&bold=false&length=1`,
              }}
              style={tw`w-32 h-32 rounded-full bg-zinc-100`}
            />
            <View style={tw`absolute bottom-0 right-0 bg-teal-600 p-2 rounded-full`}>
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
