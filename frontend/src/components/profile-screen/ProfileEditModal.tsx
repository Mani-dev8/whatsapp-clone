import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import tw from 'twrnc';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  type: 'name' | 'about' | 'profilePicture' | null;
  initialValue: string;
}

export default function ProfileEditModal({
  visible,
  onClose,
  onSubmit,
  type,
  initialValue,
}: ProfileEditModalProps) {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setValue(initialValue);
    validateInput(initialValue);
  }, [initialValue]);

  const validateInput = (input: string) => {
    if (type === 'name') {
      setIsValid(input.trim().length >= 3);
    } else if (type === 'about') {
      setIsValid(input.trim().length >= 5);
    } else if (type === 'photo') {
      setIsValid(input.trim().length > 0);
    }
  };

  const handleChange = (text: string) => {
    setValue(text);
    validateInput(text);
  };

  const getModalTitle = () => {
    switch (type) {
      case 'name':
        return 'Edit name';
      case 'about':
        return 'Edit about';
      case 'photo':
        return 'Change profile photo';
      default:
        return '';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'name':
        return 'Enter your name';
      case 'about':
        return 'Enter about info';
      case 'photo':
        return 'Enter photo URL';
      default:
        return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl`}>
          <View style={tw`p-4 border-b border-gray-200`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-lg font-semibold`}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#075E54" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={tw`p-4`}>
            {type === 'photo' && value && (
              <Image
                source={{uri: value}}
                style={tw`w-32 h-32 rounded-full self-center mb-4`}
              />
            )}

            <TextInput
              value={value}
              onChangeText={handleChange}
              placeholder={getPlaceholder()}
              multiline={type === 'about'}
              style={tw`border border-gray-300 rounded-lg p-3 ${
                type === 'about' ? 'h-24' : 'h-12'
              }`}
            />

            <TouchableOpacity
              onPress={() => onSubmit(value)}
              disabled={!isValid}
              style={tw`mt-4 bg-${
                isValid ? 'teal-600' : 'gray-400'
              } py-3 rounded-lg`}>
              <Text style={tw`text-white text-center font-semibold`}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
