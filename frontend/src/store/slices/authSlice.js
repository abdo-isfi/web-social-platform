import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    registerStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    registerFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

// Thunk actions using real API
export const login = (credentials) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const { authService } = await import('@/services/auth.service');
    const response = await authService.login(credentials);
    
    dispatch(loginSuccess({ 
      user: response.user, 
      token: response.accessToken 
    }));
    return true;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    dispatch(loginFailure(errorMessage));
    return false;
  }
};

export const register = (userData) => async (dispatch) => {
  dispatch(registerStart());
  try {
    const { authService } = await import('@/services/auth.service');
    const response = await authService.register(userData);
    
    dispatch(registerSuccess({ 
      user: response.user, 
      token: response.accessToken 
    }));
    return true;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
    dispatch(registerFailure(errorMessage));
    return false;
  }
};

export const updateUserProfile = (userId, data, isFormData) => async (dispatch) => {
  try {
    const { userService } = await import('@/services/user.service');
    // Note: userId is largely ignored by service now as it uses /me, but kept for consistency if needed or we can drop it.
    // user.service updateProfile signature: (data, isFormData)
    const response = await userService.updateProfile(data, isFormData);
    
    // Response should be { success: true, data: { ... } } or just the data depending on service.
    // user.service uses api.patch which returns response.data (nested data). 
    // And user.controller returns { success: true, data: userResponse }.
    // api.js interceptor returns response.data (the json).
    // So response in service is json.
    // So response.data is the user object.
    
    // We need to dispatch updateUser to update local state
    if (response) {
        dispatch(updateUser(response));
    }
    return true;
  } catch (error) {
    console.error("Update profile failed", error);
    return false;
  }
};

export const { 
  loginStart, loginSuccess, loginFailure, logout,
  registerStart, registerSuccess, registerFailure,
  clearError, updateUser 
} = authSlice.actions;

export default authSlice.reducer;
