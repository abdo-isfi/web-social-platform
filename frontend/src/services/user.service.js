import api from './api';

export const userService = {
  // Get user profile
  getProfile: async (userId) => {
    return await api.get(`/user/${userId}`);
  },

  // Update user profile
  updateProfile: async (data, isFormData = false) => {
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return await api.patch('/user/me', data, config);
  },

  // Get user posts
  getUserPosts: async (userId) => {
    return await api.get(`/user/${userId}/posts`);
  },

  // Get suggestions
  getSuggestions: async () => {
    return await api.get('/user/suggestions');
  },
};
