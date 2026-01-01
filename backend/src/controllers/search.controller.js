const User = require('../models/user.model');
const Thread = require('../models/thread.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');

const search = async (req, res) => {
  try {
    const { q, type } = req.query; // type can be 'top', 'latest', 'people', 'media'
    
    if (!q || q.trim().length === 0) {
      return responseHandler.error(res, 'Search query is required', statusCodes.BAD_REQUEST);
    }

    const searchQuery = q.trim();
    const regex = new RegExp(searchQuery, 'i'); // for partial matches if needed, though text search is better for full words

    let users = [];
    let threads = [];

    // Search Users
    if (!type || type === 'people') {
      users = await User.find(
        { $text: { $search: searchQuery } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .select('_id name username avatar avatarType isPrivate')
      .lean();

      // Fallback to regex if no text match found (for partial names)
      if (users.length === 0) {
        users = await User.find({
          $or: [
            { name: { $regex: regex } },
            { username: { $regex: regex } }
          ]
        })
        .limit(10)
        .select('_id name username avatar avatarType isPrivate')
        .lean();
      }
    }

    // Search Threads
    if (!type || type === 'top' || type === 'latest' || type === 'media') {
       threads = await Thread.find(
        { $text: { $search: searchQuery }, isArchived: false },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(20)
      .populate('author', '_id username name avatar avatarType')
      .lean();
      
      // Fallback for hashtags specifically if the query looks like a tag
      if (threads.length === 0 && searchQuery.startsWith('#')) {
         const tag = searchQuery.substring(1).toLowerCase();
         threads = await Thread.find({ hashtags: tag, isArchived: false })
         .sort({ createdAt: -1 })
         .limit(20)
         .populate('author', '_id username name avatar avatarType')
         .lean();
      }
    }

    // Format avatars
    users.forEach(user => {
      if (user.avatar) {
        user.avatar = `data:${user.avatarType};base64,${user.avatar.toString('base64')}`;
      }
    });

    threads.forEach(thread => {
      if (thread.author && thread.author.avatar) {
        thread.author.avatar = `data:${thread.author.avatarType};base64,${thread.author.avatar.toString('base64')}`;
      }
    });

    return responseHandler.success(
      res,
      { users, threads },
      'Search results fetched successfully',
      statusCodes.SUCCESS
    );

  } catch (error) {
    console.error('Search error:', error);
    return responseHandler.error(res, 'Search failed', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  search
};
