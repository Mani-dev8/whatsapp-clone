import {Dimensions} from 'react-native';
import {isDevelopmentMode} from './helper';

export const API_URL = isDevelopmentMode
  ? 'http://192.168.122.81:5001/'
  : 'https://whatsapp-clone-vitp.onrender.com';

export const {width: WINDOW_WIDTH, height: WINDOW_HEIGHT} =
  Dimensions.get('window');

export const COLORS = {
  app: {
    primary: '#128C7E',
    secondary: '#EAFEFF',
  },
  screen: {
    primary: '#FEFEFE',
    secondary: '#EAFEFF',
    tertiary: '#F0F0F0',
  },
  placeholder: '#a1a1aa',
  highlight: {
    yellow: '#FFD561',
    blue: '#E7FEFF',
    grey: '#DFDFDF',
  },
};
