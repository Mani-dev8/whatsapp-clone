import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const storageUtils = {
  setItem: (key: string, value: string) => {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error('MMKV setItem error:', error);
    }
  },
  getItem: (key: string) => {
    try {
      return storage.getString(key) || null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return null;
    }
  },
  removeItem: (key: string) => {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
    }
  },
};

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_profile',
};