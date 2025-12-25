import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Feed } from '@/pages/Feed';
import { ProfilePage } from '@/pages/ProfilePage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/slices/authSlice';

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
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(loginSuccess({ user, token }));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsRehydrating(false);
  }, [dispatch]);

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
