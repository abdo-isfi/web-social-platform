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
      localStorage.setItem('user', JSON.stringify(action.payload.user));
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
      localStorage.setItem('user', JSON.stringify(action.payload.user));
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

// Thunk actions (mocked for now)
export const login = (credentials) => async (dispatch) => {
  dispatch(loginStart());
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful login
    const mockUser = {
      id: '1',
      username: 'johndoe',
      email: credentials.email,
      avatar: 'https://github.com/shadcn.png',
      name: 'John Doe',
      followers: 120,
      following: 50,
      banner: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop',
      location: 'New York, USA',
      website: 'https://example.com',
      birthday: '1990-01-01',
    };
    
    dispatch(loginSuccess({ user: mockUser, token: 'mock-jwt-token' }));
    return true;
  } catch (error) {
    dispatch(loginFailure(error.message || 'Login failed'));
    return false;
  }
};

export const register = (userData) => async (dispatch) => {
  dispatch(registerStart());
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      id: '2',
      username: userData.email.split('@')[0],
      email: userData.email,
      name: `${userData.firstName} ${userData.lastName}`,
      avatar: 'https://github.com/shadcn.png',
      banner: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop',
    };
    
    dispatch(registerSuccess({ user: mockUser, token: 'mock-jwt-token' }));
    return true;
  } catch (error) {
    dispatch(registerFailure(error.message || 'Registration failed'));
    return false;
  }
};

export const { 
  loginStart, loginSuccess, loginFailure, logout,
  registerStart, registerSuccess, registerFailure,
  clearError, updateUser 
} = authSlice.actions;

export default authSlice.reducer;
