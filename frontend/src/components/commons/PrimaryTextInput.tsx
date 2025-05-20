import {View, Text, TextInputProps, TextInput} from 'react-native';
import React from 'react';
import tw from '../../libs/tailwind';
import {ClassInput} from 'twrnc';

export interface PrimaryTextInputProps
  extends Omit<TextInputProps, 'onChangeText' | 'value' | 'style'> {
  style?: ClassInput;
  value: string;
  onChangeText: (text: string) => void;
  showError?: boolean;
  errorMessage?: string;
}

const PrimaryTextInput = ({
  value,
  style,
  onChangeText,
  showError,
  errorMessage,
  ...props
}: PrimaryTextInputProps) => {
  return (
    <>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={tw.style('border-b border-gray-300 p-3 text-base', style)}
        placeholderTextColor="#666"
        {...props}
      />
      {showError && (
        <Text style={tw`text-red-500 text-sm mt-1`}>{errorMessage}</Text>
      )}
    </>
  );
};

export default PrimaryTextInput;
