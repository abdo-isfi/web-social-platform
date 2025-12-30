import api from './api';

export const followerService = {
  // Follow a user
  followUser: async (userId) => {
    return await api.post('/follower/follow', { followingId: userId });
  },

  // Unfollow a user
  unfollowUser: async (userId) => {
    return await api.delete(`/follower/${userId}/unfollow`);
  },

  // Accept follow request
  acceptFollowRequest: async (userId) => {
    return await api.patch('/follower/accept', { followerId: userId });
  },

  // Get followers (if backend implements this later)
  getFollowers: async (userId) => {
    return await api.get(`/follower/${userId}/followers`);
  },

  // Get following (if backend implements this later)
  getFollowing: async (userId) => {
    return await api.get(`/follower/${userId}/following`);
  },
};
