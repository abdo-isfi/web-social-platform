import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Use Vite proxy (configured in vite.config.js)
  withCredentials: true, // Important for cookies
  headers: {
    // Let axios set Content-Type automatically based on the request body
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and data extraction
api.interceptors.response.use(
  (response) => {
    // Backend wraps data in response.data.data structure
    // Extract the actual data for cleaner usage in services
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - excluding login/register to avoid loops on wrong credentials
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/register')) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token - relies on HttpOnly cookie
        const response = await axios.post(
          '/api/auth/refresh-token',
          {}, // Body not needed if using cookies
          { withCredentials: true }
        );
          
        const accessToken = response.data?.data?.accessToken || response.data?.accessToken;
        localStorage.setItem('token', accessToken);
          
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
