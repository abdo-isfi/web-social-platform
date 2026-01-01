import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '@/services/user.service';
import { followerService } from '@/services/follower.service';

export const fetchSuggestions = createAsyncThunk(
  'user/fetchSuggestions',
  async () => {
    return await userService.getSuggestions();
  }
);

export const followUser = createAsyncThunk(
  'user/followUser',
  async (userId) => {
    return await followerService.followUser(userId);
  }
);

export const unfollowUser = createAsyncThunk(
  'user/unfollowUser',
  async (userId) => {
    return await followerService.unfollowUser(userId);
  }
);

const initialState = {
  suggestions: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload || [];
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        const userId = action.meta.arg;
        state.suggestions = state.suggestions.filter(user => user._id !== userId);
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        // We don't necessarily add them back to suggestions immediately 
        // because suggestions are filtered by backend (users not followed).
        // But if they are in suggestions and was "unfollowed" (which shouldn't happen), 
        // we'd handle it. For now, removing on follow is the main sync.
      });
  },
});

export default userSlice.reducer;
