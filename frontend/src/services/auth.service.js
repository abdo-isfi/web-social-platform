import api from './api';

export const authService = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    // Response is already extracted by interceptor, check for accessToken
    if (response?.accessToken) {
      localStorage.setItem('token', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    return response;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response?.accessToken) {
      localStorage.setItem('token', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    return response;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Refresh token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post('/auth/refresh-token', { refreshToken });
    if (response?.accessToken) {
      localStorage.setItem('token', response.accessToken);
    }
    return response;
  },

  // Get current user from backend
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },
};
