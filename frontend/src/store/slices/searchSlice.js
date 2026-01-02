import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/services/api';

export const performSearch = createAsyncThunk(
  'search/performSearch',
  async ({ query, type = 'top' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/search?q=${encodeURIComponent(query)}&type=${type}`);
      // The api interceptor already returns response.data.data
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    results: {
      users: [],
      threads: []
    },
    query: '',
    loading: false,
    error: null
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.query = action.payload;
    },
    clearSearch: (state) => {
      state.results = { users: [], threads: [] };
      state.query = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(performSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sync follow status from user actions
      .addMatcher(
        (action) => action.type === 'user/followUser/fulfilled',
        (state, action) => {
          const userId = action.meta.arg;
          const user = state.results.users.find(u => (u._id || u.id) === userId);
          if (user) user.isFollowing = true;
        }
      )
      .addMatcher(
        (action) => action.type === 'user/unfollowUser/fulfilled',
        (state, action) => {
          const userId = action.meta.arg;
          const user = state.results.users.find(u => (u._id || u.id) === userId);
          if (user) user.isFollowing = false;
        }
      );
  }
});

export const { setSearchQuery, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
