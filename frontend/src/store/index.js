import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import notificationsReducer from './slices/notificationsSlice';
import postReducer from './slices/postSlice';
import userReducer from './slices/userSlice';
import searchReducer from './slices/searchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
    posts: postReducer,
    user: userReducer,
    search: searchReducer,
  },
});

export default store;
