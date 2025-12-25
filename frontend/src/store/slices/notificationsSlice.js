import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [
    {
      id: 1,
      user: { name: "Chris Tompson", avatar: "https://i.pravatar.cc/150?u=1" },
      action: "requested review on",
      target: "PR #42: Feature implementation",
      timestamp: "15 minutes ago",
      isRead: false,
    },
    {
      id: 2,
      user: { name: "Emma Davis", avatar: "https://i.pravatar.cc/150?u=2" },
      action: "shared",
      target: "New component library",
      timestamp: "45 minutes ago",
      isRead: false,
    },
     {
      id: 3,
      user: { name: "James Wilson", avatar: "https://i.pravatar.cc/150?u=3" },
      action: "assigned you to",
      target: "API integration task",
      timestamp: "4 hours ago",
      isRead: true,
    }
  ],
  unreadCount: 2,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    addNotification: (state, action) => {
      state.notifications.unshift({
        ...action.payload,
        isRead: false,
        timestamp: 'Just now'
      });
      state.unreadCount += 1;
    }
  },
});

export const { setNotifications, markAsRead, markAllAsRead, addNotification } = notificationsSlice.actions;

export default notificationsSlice.reducer;
