import {
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import React from 'react';
import tw from '../../libs/tailwind';
import {ClassInput} from 'twrnc';

interface Props extends Omit<TouchableOpacityProps, 'style'> {
  style?: ClassInput;
  title: string;
}

const PrimaryButton = ({title, style, ...props}: Props) => {
  return (
    <TouchableOpacity
      style={tw.style('bg-[#128C7E] py-2 rounded-lg', style as ClassInput)}
      {...props}>
      <Text style={tw`text-white text-center text-lg font-semibold`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;
