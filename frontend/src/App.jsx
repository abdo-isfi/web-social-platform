import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import Feed from '@/pages/Feed';
import { ProfilePage } from '@/pages/ProfilePage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { ArchivedPostsPage } from '@/pages/ArchivedPostsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useSelector, useDispatch } from 'react-redux';
import { setAuth } from '@/store/slices/authSlice';
import socketService from '@/services/socket';
import { addNotification } from '@/store/slices/notificationsSlice';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const dispatch = useDispatch();
  const [isRehydrating, setIsRehydrating] = useState(true);

  const { theme } = useSelector(state => state.ui);

  // Sync theme with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Rehydrate auth state on app load
  useEffect(() => {
    const rehydrate = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          // Initial rehydration from cache for immediate UI
          dispatch(setAuth({ user, token }));
          
          // Active verification from server (Source of Truth)
          const { fetchMe } = await import('@/store/slices/authSlice');
          await dispatch(fetchMe());
        } catch (e) {
          console.error("Failed to rehydrate auth", e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsRehydrating(false);
    };

    rehydrate();
  }, [dispatch]);

  // Socket Connection Handling
  const { isAuthenticated, token, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated && token && user) {
      const socket = socketService.connect(token);
      
      // Register user ID for private events
      socket.emit('register', user._id || user.id);

      socketService.on('notification:new', (notification) => {
        dispatch(addNotification(notification));
        // Optional: Play sound or show toast
      });

      return () => {
        socketService.off('notification:new');
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token, user, dispatch]);

  if (isRehydrating) {
    return null; // Or a loading spinner
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bookmarks" 
          element={
            <ProtectedRoute>
              <BookmarksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/archived" 
          element={
            <ProtectedRoute>
              <ArchivedPostsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
