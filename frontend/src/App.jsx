import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import Feed from '@/pages/Feed';
import { ProfilePage } from '@/pages/ProfilePage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { ArchivedPostsPage } from '@/pages/ArchivedPostsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import SearchPage from '@/pages/SearchPage';
import { InterestsPage } from '@/pages/onboarding/InterestsPage';
import { RecommendedPage } from '@/pages/RecommendedPage';
import { useSelector, useDispatch } from 'react-redux';
import { setAuth } from '@/store/slices/authSlice';
import socketService from '@/services/socket';
import { addNotification } from '@/store/slices/notificationsSlice';
import { updatePostStats } from '@/store/slices/postSlice';
import { Toaster } from 'react-hot-toast';

// Onboarding Check Wrapper
const OnboardingGuard = ({ children }) => {
  const { isAuthenticated, user, isJustSignedUp } = useSelector(state => state.auth);
  const location = useLocation();

  if (isAuthenticated && user && isJustSignedUp && (!user.interests || user.interests.length === 0)) {
    if (location.pathname !== '/onboarding/interests') {
      return <Navigate to="/onboarding/interests" replace />;
    }
  }

  // If already onboarded but trying to go back to interests, redirect to home
  if (isAuthenticated && user && user.interests && user.interests.length > 0 && location.pathname === '/onboarding/interests') {
    return <Navigate to="/" replace />;
  }

  return children;
};

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
          dispatch(setAuth({ user, token }));
          
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
      socket.emit('register', user._id || user.id);

      socketService.on('notification:new', (notification) => {
        dispatch(addNotification(notification));
      });

      socketService.on('post_updated', (data) => {
        dispatch(updatePostStats(data));
      });

      return () => {
        socketService.off('notification:new');
        socketService.off('post_updated');
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token, user, dispatch]);

  if (isRehydrating) {
    return null;
  }

  return (
    <>
      <AppLayout>
        <OnboardingGuard>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/onboarding/interests" element={<InterestsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/recommended" element={<ProtectedRoute><RecommendedPage /></ProtectedRoute>} />
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
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OnboardingGuard>
      </AppLayout>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          className: 'font-bold rounded-2xl bg-card text-foreground border border-border/50 shadow-2xl backdrop-blur-xl',
          duration: 4000,
        }}
      />
    </>
  );
}

export default App;
