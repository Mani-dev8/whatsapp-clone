import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice, UserProfileResponse } from './apiSlice';
import { persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Persist auth slice
};

const authReducer = persistReducer(
  persistConfig,
  combineReducers({
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: (state: { token: string | null; user: UserProfileResponse | null } = { token: null, user: null }, action: any) => {
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

const store = configureStore({
  reducer: authReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for AsyncStorage
    }).concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export {store, persistor};