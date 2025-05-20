import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice, UserProfileResponse } from './apiSlice';
import { persistReducer, persistStore } from 'redux-persist';
import { MMKV } from 'react-native-mmkv';
import { combineReducers } from 'redux';

const mmkv = new MMKV();

const persistConfig = {
  key: 'root',
  storage: {
    setItem: (key: string, value: string) => {
      mmkv.set(key, value);
      return Promise.resolve();
    },
    getItem: (key: string) => {
      const value = mmkv.getString(key);
      return Promise.resolve(value || '');
    },
    removeItem: (key: string) => {
      mmkv.delete(key);
      return Promise.resolve();
    },
  },
  whitelist: ['auth'],
};

const authReducer = persistReducer(
  persistConfig,
  combineReducers({
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: (
      state: { token: string | null; user: UserProfileResponse | null } = { token: null, user: null },
      action: any,
    ) => {
      switch (action.type) {
        case 'auth/login':
          return { token: action.payload.token, user: action.payload.user };
        case 'auth/logout':
          return { token: null, user: null };
        default:
          return state;
      }
    },
  }),
);

export const store = configureStore({
  reducer: authReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;