import api from './api';

export const notificationService = {
  // Get all unread notifications
  getNotifications: async () => {
    return await api.get('/notification/unread');
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await api.put(`/notification/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: async () => {
    return await api.put('/notification/read-all');
  },

  // Delete notification (if backend implements this later)
  deleteNotification: async (notificationId) => {
    return await api.delete(`/notification/${notificationId}`);
  },
};
