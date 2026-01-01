import api from './api';

export const postService = {
  // Get all posts (feed) - Uses /thread which supports auth for personalized feed
  getPosts: async (page = 1, limit = 10, mode = 'discover') => {
    return await api.get(`/thread?page=${page}&limit=${limit}&mode=${mode}`);
  },

  // Get single post
  getPost: async (postId) => {
    return await api.get(`/thread/me/${postId}`);
  },

  // Create post
  createPost: async (postData) => {
    return await api.post('/thread', postData);
  },

  // Update post
  updatePost: async (postId, postData) => {
    return await api.patch(`/thread/me/${postId}`, postData);
  },

  // Archive post (delete)
  archivePost: async (postId) => {
    return await api.patch(`/thread/archive/${postId}`);
  },

  // Like post
  likePost: async (threadId) => {
    return await api.post(`/like/${threadId}/like`);
  },

  // Unlike post
  unlikePost: async (threadId) => {
    return await api.delete(`/like/${threadId}/unlike`);
  },

  // Get user's liked threads
  getLikedThreads: async (page = 1, limit = 10) => {
    return await api.get(`/like/likedthread?page=${page}&limit=${limit}`);
  },

  // Get post comments
  getComments: async (postId, params = {}) => {
    return await api.get(`/thread/${postId}/comments`, { params });
  },

  // Add comment
  addComment: async (postId, content) => {
    return await api.post(`/thread/${postId}/comments`, { content });
  },

  // Bookmark post
  bookmarkPost: async (postId) => {
    return await api.post(`/thread/${postId}/bookmark`);
  },

  // Get bookmarked posts
  getBookmarkedPosts: async (page = 1, limit = 10) => {
    return await api.get(`/thread/user/bookmarks?page=${page}&limit=${limit}`);
  },

  // Get archived posts
  getArchivedPosts: async (page = 1, limit = 10) => {
    return await api.get(`/thread/archived?page=${page}&limit=${limit}`);
  },

  // Delete post permanently
  deletePost: async (postId) => {
    return await api.delete(`/thread/me/${postId}`);
  },
};

