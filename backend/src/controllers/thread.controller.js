const Thread = require("../models/thread.model");
const User = require('../models/user.model');
const Like=require("../models/like.model");
const Follow = require('../models/follower.model'); // Added Follow model
const Notification = require('../models/notification.model'); // Added Notification model
const { emitToUser } = require('../socket'); // Added socket
const responseHandler = require("../utils/responseHandler");
const { statusCodes } = require("../utils/statusCodes");

const createThread = async (req, res) => {
  try {
    const { content, parentThread } = req.body;
    if (!content || content.trim() === "") {
      return responseHandler.error(
        res,
        "Thread content is required",
        statusCodes.BAD_REQUEST
      );
    }
    if (parentThread) {
      const parent = await Thread.findById(parentThread);
      if (!parent) {
        return responseHandler.notFound(res, "Parent thread");
      }
    }

    const hashtags = content.match(/#[a-z0-9_]+/gi) || []; // Extract hashtags
    const mentions = content.match(/@[a-z0-9_]+/gi) || []; // Extract mentions raw strings (need to look up users)

    // Lookup mentioned users
    const mentionedUserIds = [];
    if (mentions.length > 0) {
        const usernames = mentions.map(m => m.substring(1)); // remove @
        const users = await User.find({ username: { $in: usernames } }).select('_id');
        users.forEach(u => mentionedUserIds.push(u._id));
    }

    const threadData = {
      content: content.trim(),
      author: req.user.id, 
      parentThread: parentThread || null,
      hashtags: hashtags.map(h => h.toLowerCase().substring(1)), // store without #
      mentions: mentionedUserIds
    };

    
   
    if (req.file) {
    if (req.file.mimetype.startsWith("image")) {
    threadData.media = {
      type: "image",
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
    } else if (req.file.mimetype.startsWith("video")) {
    // handle video externally
   }
  } else {
  threadData.media = null;
  }



    
    const thread = await Thread.create(threadData);

    // Populate author details for the response
    const populatedThread = await Thread.findById(thread._id)
      .populate('author', 'username name avatar avatarType')
      .lean();

    // Verify notifications for mentions
    if (mentionedUserIds.length > 0) {
      mentionedUserIds.forEach(async (mentionedId) => {
          if (mentionedId.toString() !== req.user.id) {
             const notification = await Notification.create({
                type: 'NEW_THREAD', // Or MENTION type if supported
                receiver: mentionedId,
                sender: req.user.id,
                thread: thread._id,
                isRead: false
             });
             emitToUser(mentionedId, 'notification:new', notification);
          }
      });
    }

    return responseHandler.success(
      res,
      populatedThread,
      "Thread created successfully",
      statusCodes.CREATED
    );
  } catch (error) {
    console.error("Create thread error:", error);

    return responseHandler.error(
      res,
      null,
      statusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
const getUserThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.pagination; // from middleware
    const skip = (page - 1) * limit;

    const totalThreads = await Thread.countDocuments({ author: userId,isArchived: false });
        if (totalThreads === 0) {
      return responseHandler.success(
        res,
        { threads: [], pagination: null },
        "You haven't created any threads yet. Start by creating your first thread!",
        statusCodes.SUCCESS
      );
    }

    const threads = await Thread.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar avatarType')
      .lean();

    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(res, {
      threads,
      pagination: {
        totalThreads,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    }, 'User threads fetched successfully', statusCodes.SUCCESS);

  } catch (error) {
    console.error('Get user threads error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};
const getThreadById = async (req, res) => {
  try {
    const userId = req.user.id;          
    const { threadId } = req.params;   
    const thread = await Thread.findOne({ _id: threadId, author: userId,isArchived: false })
      .populate('author', 'username name avatar avatarType') 
      .populate('parentThread', 'content') 
      .lean();

    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }

    return responseHandler.success(
      res,
      thread,
      'Thread fetched successfully',
      statusCodes.SUCCESS
    );

  } catch (error) {
    console.error('Get thread by ID error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};
const updateThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    // Find the thread by ID and author
    const thread = await Thread.findOne({ _id: threadId, author: userId,isArchived: false });
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }
    if (req.body.content !== undefined) {
      thread.content = req.body.content.trim();
    }
    if (req.file) {
      if (req.file.mimetype.startsWith("image")) {
        thread.media = {
          type: "image",
          data: req.file.buffer,
          contentType: req.file.mimetype
        };
      } else if (req.file.mimetype.startsWith("video")) {
        // You can handle video externally (URL)
        thread.media = {
          type: "video",
          url: req.body.mediaUrl || null, // client must send video URL
        };
      }
    } else if (req.body.media === null) {
      // Allow removing media
      thread.media = null;
    }

    await thread.save();

    // Populate author username for response
    const updatedThread = await Thread.findById(thread._id)
      .populate('author', 'username name avatar avatarType')
      .lean();

    return responseHandler.success(
      res,
      updatedThread,
      'Thread updated successfully',
      statusCodes.UPDATED
    );

  } catch (error) {
    console.error('Update thread error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const archiveThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    const thread = await Thread.findOne({ _id: threadId, author: userId });
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }

    thread.isArchived = true;
    await thread.save();

    return responseHandler.success(
      res,
      thread,
      "Thread archived successfully",
      statusCodes.UPDATED
    );

  } catch (error) {
    console.error("Archive thread error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};
const getFeed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page, limit, mode } = req.query; // Expect mode to be 'following' or 'discover'
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = { isArchived: false, parentThread: null  };

    if (mode === 'following' && userId) {
        // Only followed users + self
        const following = await Follow.find({ follower: userId, status: 'ACCEPTED' }).select('following');
        const followingIds = following.map(f => f.following);
        followingIds.push(userId);
        filter.author = { $in: followingIds };
    } else {
        // Discovery/Public mode: All posts from all users (not archived, not comments)
        // We simplified this to show ALL posts as requested.
        // No additional filter needed beyond { isArchived: false, parentThread: null }
    }

    const threads = await Thread.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar avatarType')
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: 'username name avatar avatarType' }
      })
      .lean();

    const threadsWithLikes = await Promise.all(
      threads.map(async (thread) => {
        // Format top-level author avatar
        if (thread.author && thread.author.avatar) {
            thread.author.avatar = `data:${thread.author.avatarType};base64,${thread.author.avatar.toString('base64')}`;
        }
        
        // Format top-level media
        if (thread.media && thread.media.data) {
            thread.media.url = `data:${thread.media.contentType};base64,${thread.media.data.toString('base64')}`;
        }

        // Handle repostOf formatting
        if (thread.repostOf) {
            if (thread.repostOf.author && thread.repostOf.author.avatar) {
                thread.repostOf.author.avatar = `data:${thread.repostOf.author.avatarType};base64,${thread.repostOf.author.avatar.toString('base64')}`;
            }
            if (thread.repostOf.media && thread.repostOf.media.data) {
                thread.repostOf.media.url = `data:${thread.repostOf.media.contentType};base64,${thread.repostOf.media.data.toString('base64')}`;
            }
        }

        const likeCount = await Like.countDocuments({ thread: thread._id });
        const repostCount = await Thread.countDocuments({ repostOf: thread._id });
        const commentCount = await Thread.countDocuments({ parentThread: thread._id });
        
        let isLiked = false;
        let isReposted = false;
        if(userId) {
             isLiked = !!await Like.findOne({ user: userId, thread: thread._id });
             isReposted = !!await Thread.findOne({ author: userId, repostOf: thread._id });
        }

        return { ...thread, likeCount, repostCount, commentCount, isLiked, isReposted };
      })
    );

    const totalThreads = await Thread.countDocuments(filter);
    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(
      res,
      {
        threads: threadsWithLikes,
        pagination: {
          totalThreads,
          totalPages,
          currentPage: page,
          pageSize: limit
        }
      },
      "Feed fetched successfully",
      statusCodes.SUCCESS
    );

  } catch (error) {
    console.error("Get feed error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const repostThread = async (req, res) => {
    try {
        const userId = req.user.id;
        const { threadId } = req.params;

        const originalThread = await Thread.findById(threadId);
        if(!originalThread) return responseHandler.notFound(res, "Thread");

        const existingRepost = await Thread.findOne({ author: userId, repostOf: threadId });
        if(existingRepost) return responseHandler.error(res, "Already reposted", statusCodes.CONFLICT);

        const repost = await Thread.create({
            content: "Repost", // Placeholder or fetch
            author: userId,
            repostOf: threadId,
            media: null
        });

        // Notification
        if (originalThread.author.toString() !== userId) {
            const notif = await Notification.create({
                type: 'NEW_THREAD', // Or REPOST
                receiver: originalThread.author,
                sender: userId,
                thread: repost._id,
                isRead: false
            });
             emitToUser(originalThread.author, 'notification:new', notif);
        }

        return responseHandler.success(res, repost, "Reposted successfully", statusCodes.CREATED);
    } catch (error) {
        console.error("Repost error:", error);
        return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
    }
}

const unrepostThread = async (req, res) => {
    try {
        const userId = req.user.id;
        const { threadId } = req.params;

        // Find the repost document where author is me and repostOf is the target thread
        const repost = await Thread.findOneAndDelete({ author: userId, repostOf: threadId });
        
        if(!repost) return responseHandler.notFound(res, "Repost");

        return responseHandler.success(res, null, "Unreposted successfully", statusCodes.SUCCESS);
    } catch (error) {
         console.error("Unrepost error:", error);
        return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
    }
}


const bookmarkThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return responseHandler.notFound(res, "User");

    const thread = await Thread.findById(threadId);
    if (!thread) return responseHandler.notFound(res, "Thread");

    const bookmarkIndex = user.bookmarks.indexOf(threadId);
    let isBookmarked = false;

    if (bookmarkIndex > -1) {
      // Unbookmark
      user.bookmarks.splice(bookmarkIndex, 1);
      isBookmarked = false;
    } else {
      // Bookmark
      user.bookmarks.push(threadId);
      isBookmarked = true;
    }

    await user.save();

    return responseHandler.success(res, { isBookmarked }, isBookmarked ? "Thread bookmarked" : "Thread unbookmarked", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Bookmark error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getBookmarkedThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    
    // Total count of bookmarks
    const totalThreads = user.bookmarks.length;
    const totalPages = Math.ceil(totalThreads / limit);

    // Get recently bookmarked first
    const reversedBookmarks = [...user.bookmarks].reverse();
    const pagedBookmarkIds = reversedBookmarks.slice(skip, skip + limit);

    const threads = await Thread.find({ _id: { $in: pagedBookmarkIds } })
      .populate('author', 'username name avatar avatarType')
      .lean();

    // Preserve order of pagedBookmarkIds
    const orderedThreads = pagedBookmarkIds.map(id => threads.find(t => t._id.toString() === id.toString())).filter(Boolean);

    // Add like/bookmark status
    const threadsWithStatus = await Promise.all(orderedThreads.map(async (thread) => {
        const likeCount = await Like.countDocuments({ thread: thread._id });
        const commentCount = await Thread.countDocuments({ parentThread: thread._id, isArchived: false });
        const isLiked = !!await Like.findOne({ user: userId, thread: thread._id });
        return { ...thread, likeCount, commentCount, isLiked, isBookmarked: true };
    }));

    return responseHandler.success(res, {
        threads: threadsWithStatus,
        pagination: {
            totalThreads,
            totalPages,
            currentPage: page,
            pageSize: limit
        }
    }, "Bookmarked threads fetched", statusCodes.SUCCESS);

  } catch (error) {
    console.error("Get bookmarks error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  createThread,
  getUserThreads,
  getThreadById,
  updateThread,
  archiveThread,
  getFeed,
  repostThread,
  unrepostThread,
  bookmarkThread,
  getBookmarkedThreads
};
