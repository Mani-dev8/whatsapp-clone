import {
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

import React from 'react';

type Props = TouchableOpacityProps & {
  text: string;
};

const TouchableText = ({text, ...props}: Props) => {
  return (
    <TouchableOpacity {...props}>
      <Text>{text}</Text>
    </TouchableOpacity>
  );
};

export default TouchableText;
