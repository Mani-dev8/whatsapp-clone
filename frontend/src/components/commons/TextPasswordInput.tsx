import React, {useState} from 'react';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import tw from '../../libs/tailwind';
import PrimaryTextInput, {PrimaryTextInputProps} from './PrimaryTextInput';
interface Props extends PrimaryTextInputProps {}

const TextPasswordInput = ({value, onChangeText, ...props}: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <PrimaryTextInput
        placeholder="Password"
        value={value}
        onChangeText={onChangeText}
        style="text-zinc-900"
        secureTextEntry={!showPassword}
        {...props}
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={tw`px-3 absolute right-0 top-3.5`}>
        <Ionicons
          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
          size={24}
          color="#888"
        />
      </TouchableOpacity>
    </>
  );
};

export default TextPasswordInput;
