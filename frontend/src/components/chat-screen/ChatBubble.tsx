import React from 'react';
import {View, Pressable, ViewStyle} from 'react-native';
import {Svg, Path} from 'react-native-svg';
import tw from 'twrnc';

interface ChatBubbleProps {
  isOwnMessage: boolean;
  children: React.ReactNode;
  bubbleColor?: string;
  tailColor?: string;
  withTail?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  hitSlop?: any;
  maxWidth?: number;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  isOwnMessage,
  children,
  bubbleColor = isOwnMessage ? '#DCF8C6' : '#fff',
  tailColor = bubbleColor,
  withTail = true,
  style,
  onPress,
  hitSlop,
  maxWidth = 280,
}) => {
  const Container = onPress ? Pressable : View;

  const tailPath = isOwnMessage
    ? 'M48,35c-7-4-6-8.75-6-17.5C28,17.5,29,35,48,35z'
    : 'M38.484,17.5c0,8.75,1,13.5-6,17.5C51.484,35,52.484,17.5,38.484,17.5z';

  const bubbleStyles = [
    tw`px-3 py-2 my-2 rounded-2xl`,
    isOwnMessage ? tw`self-end` : tw`self-start`,
    {backgroundColor: bubbleColor, maxWidth},
    style,
  ];

  const svgWrapperStyles = [
    tw`absolute top-0 bottom-0 left-0 right-0 z-[-1] flex`,
    isOwnMessage ? tw`items-end justify-end` : tw`items-start justify-end`,
  ];

  return (
    <Container onPress={onPress} hitSlop={hitSlop}>
      <View style={bubbleStyles}>{children}</View>
      {withTail && (
        <View style={svgWrapperStyles}>
          <Svg width={16} height={18} viewBox="32.485 17.5 15.515 17.5">
            <Path d={tailPath} fill={tailColor} />
          </Svg>
        </View>
      )}
    </Container>
  );
};

export default ChatBubble;
