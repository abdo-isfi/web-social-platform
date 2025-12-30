import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import notificationsReducer from './slices/notificationsSlice';
import postReducer from './slices/postSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
    posts: postReducer,
  },
});

export default store;
