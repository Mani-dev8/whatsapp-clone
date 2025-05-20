import {StatusBar} from 'react-native';
import {COLORS} from './constants';

export const statusBarWithPrimaryBg = () => {
  StatusBar.setBackgroundColor(COLORS.app.primary);
  StatusBar.setBarStyle('light-content');
};

export const statusBarWithWhiteBg = () => {
  StatusBar.setBackgroundColor('white');
  StatusBar.setBarStyle('dark-content');
};
