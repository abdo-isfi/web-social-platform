const Thread = require("../models/thread.model");
const User = require('../models/user.model');
const Like=require("../models/like.model");
const Follow = require('../models/follower.model'); // Added Follow model
const Notification = require('../models/notification.model'); // Added Notification model
const { emitToUser } = require('../socket'); // Added socket
const responseHandler = require("../utils/responseHandler");
const { statusCodes } = require("../utils/statusCodes");

const { formatThreadResponse } = require("../utils/threadFormatter");

const createThread = async (req, res) => {
  try {
    const { content, parentThread } = req.body;
    
    // Check if either content or media is present
    const hasMedia = !!req.file;
    const hasContent = content && content.trim() !== "";

    if (!hasContent && !hasMedia) {
      return responseHandler.error(
        res,
        "Thread must contain either text or media",
        statusCodes.BAD_REQUEST
      );
    }

    if (parentThread) {
      const parent = await Thread.findById(parentThread);
      if (!parent) {
        return responseHandler.notFound(res, "Parent thread");
      }
    }

    const safeContent = content ? content : "";
    const hashtags = safeContent.match(/#[a-z0-9_]+/gi) || []; // Extract hashtags
    const mentions = safeContent.match(/@[a-z0-9_]+/gi) || []; // Extract mentions raw strings (need to look up users)

    // Lookup mentioned users
    const mentionedUserIds = [];
    if (mentions.length > 0) {
        const usernames = mentions.map(m => m.substring(1)); // remove @
        const users = await User.find({ username: { $in: usernames } }).select('_id');
        users.forEach(u => mentionedUserIds.push(u._id));
    }

    const threadData = {
      content: safeContent.trim(),
      author: req.user.id, 
      parentThread: parentThread || null,
      hashtags: hashtags.map(h => h.toLowerCase().substring(1)), // store without #
      mentions: mentionedUserIds
    };

    // Handle media upload to MinIO
    if (req.file) {
      try {
        const { uploadToMinIO, generateUniqueFileName } = require('../utils/minioHelper');
        
        // Determine media type
        const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
        
        // Generate unique filename to avoid collisions
        const uniqueFileName = generateUniqueFileName(req.file.originalname);
        
        console.log(`Uploading ${mediaType} to MinIO: ${uniqueFileName}`);
        
        // Upload to MinIO (this also deletes the temporary file)
        const { key, url } = await uploadToMinIO(
          req.file.path,
          uniqueFileName,
          req.file.mimetype
        );
        
        // Store only metadata and URL in MongoDB (not binary data)
        threadData.media = {
          type: mediaType,
          url: url,
          key: key,
          contentType: req.file.mimetype,
        };
        
        console.log(`✓ Media uploaded successfully: ${key}`);
      } catch (uploadError) {
        console.error("MinIO upload error:", uploadError);
        
        // Clean up temporary file if it still exists
        const fs = require('fs').promises;
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        
        return responseHandler.error(
          res,
          "Failed to upload media file",
          statusCodes.INTERNAL_SERVER_ERROR
        );
      }
    }

    const thread = await Thread.create(threadData);

    // Populate author details for the response
    const populatedThread = await Thread.findById(thread._id)
      .populate('author', 'username name avatar avatarType')
      .lean();

    const formattedThread = await formatThreadResponse(populatedThread, req.user.id);

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
      formattedThread,
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

    const totalThreads = await Thread.countDocuments({ author: userId, isArchived: false });
    
    const threads = await Thread.find({ author: userId, isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar avatarType')
      .lean();

    const formattedThreads = (await Promise.all(
        threads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null);

    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(res, {
      threads: formattedThreads,
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

const getArchivedThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    const totalThreads = await Thread.countDocuments({ author: userId, isArchived: true });
    
    const threads = await Thread.find({ author: userId, isArchived: true })
      .sort({ updatedAt: -1 }) // Sort by when they were archived
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar avatarType')
      .lean();

    const formattedThreads = (await Promise.all(
        threads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null);

    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(res, {
      threads: formattedThreads,
      pagination: {
        totalThreads,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    }, 'Archived threads fetched successfully', statusCodes.SUCCESS);

  } catch (error) {
    console.error('Get archived threads error:', error);
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
    
    // Handle media update
    if (req.file) {
      try {
        const { uploadToMinIO, generateUniqueFileName, deleteFromMinIO } = require('../utils/minioHelper');
        
        // Delete old media from MinIO if it exists
        if (thread.media && thread.media.key) {
          try {
            await deleteFromMinIO(thread.media.key);
            console.log(`✓ Old media deleted from MinIO: ${thread.media.key}`);
          } catch (deleteError) {
            console.warn(`⚠ Failed to delete old media: ${deleteError.message}`);
            // Continue with upload even if deletion fails
          }
        }
        
        // Determine media type
        const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
        
        // Generate unique filename
        const uniqueFileName = generateUniqueFileName(req.file.originalname);
        
        console.log(`Uploading ${mediaType} to MinIO: ${uniqueFileName}`);
        
        // Upload to MinIO
        const { key, url } = await uploadToMinIO(
          req.file.path,
          uniqueFileName,
          req.file.mimetype
        );
        
        // Update media with MinIO data
        thread.media = {
          type: mediaType,
          url: url,
          key: key,
          contentType: req.file.mimetype,
        };
        
        console.log(`✓ Media updated successfully: ${key}`);
      } catch (uploadError) {
        console.error("MinIO upload error:", uploadError);
        
        // Clean up temporary file if it still exists
        const fs = require('fs').promises;
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        
        return responseHandler.error(
          res,
          "Failed to upload media file",
          statusCodes.INTERNAL_SERVER_ERROR
        );
      }
    } else if (req.body.media === null) {
      // Allow removing media
      if (thread.media && thread.media.key) {
        try {
          const { deleteFromMinIO } = require('../utils/minioHelper');
          await deleteFromMinIO(thread.media.key);
          console.log(`✓ Media deleted from MinIO: ${thread.media.key}`);
        } catch (deleteError) {
          console.warn(`⚠ Failed to delete media: ${deleteError.message}`);
        }
      }
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
  }
};

const deleteThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    // Find the thread by ID and author (only author can delete)
    // We allow deleting archived threads too
    const thread = await Thread.findOne({ _id: threadId, author: userId });
    
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }

    // Delete media from MinIO if it exists
    if (thread.media && thread.media.key) {
      try {
        const { deleteFromMinIO } = require('../utils/minioHelper');
        await deleteFromMinIO(thread.media.key);
        console.log(`✓ Media deleted from MinIO: ${thread.media.key}`);
      } catch (deleteError) {
        console.warn(`⚠ Failed to delete media: ${deleteError.message}`);
        // Continue with deletion logic
      }
    }

    // Delete the thread
    await Thread.deleteOne({ _id: threadId });

    // Also delete any child threads (comments/replies) could be good, but strict deletion might be safer for now.
    // Or we can rely on cascading delete if implemented in model, but Mongoose middleware isn't always triggered by deleteOne.
    // Ideally we should delete related comments.
    // await Thread.deleteMany({ parentThread: threadId }); // Optional: cleanup comments

    return responseHandler.success(
      res,
      { _id: threadId },
      "Thread deleted successfully",
      statusCodes.SUCCESS
    );

  } catch (error) {
    console.error("Delete thread error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getFeed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mode } = req.query; // Expect mode to be 'following' or 'discover'
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    let filter = { isArchived: false, parentThread: null  };

    if (mode === 'following' && userId) {
        // Just the posts of followed users
        const following = await Follow.find({ follower: userId, status: 'ACCEPTED' }).select('following');
        const followingIds = following.map(f => f.following);
        filter.author = { $in: followingIds };
    } else {
        // Discovery/Public mode: All posts from all users (not archived, not comments)
        // EXCLUDING private users if not followed by current user
        if (userId) {
            const following = await Follow.find({ follower: userId, status: 'ACCEPTED' }).select('following');
            const followingIds = following.map(f => f.following);
            followingIds.push(userId);

            const privateUsers = await User.find({ isPrivate: true, _id: { $nin: followingIds } }).select('_id');
            const privateUserIds = privateUsers.map(u => u._id);
            
            filter.author = { $nin: privateUserIds };
        } else {
            // Unauthenticated: only show public accounts
            const privateUsers = await User.find({ isPrivate: true }).select('_id');
            const privateUserIds = privateUsers.map(u => u._id);
            filter.author = { $nin: privateUserIds };
        }
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

    const formattedThreads = (await Promise.all(
      threads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null); // Filter out orphaned threads

    const totalThreads = await Thread.countDocuments(filter);
    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(
      res,
      {
        threads: formattedThreads,
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

        const populatedRepost = await Thread.findById(repost._id)
          .populate('author', 'username name avatar avatarType')
          .populate({
            path: 'repostOf',
            populate: { path: 'author', select: 'username name avatar avatarType' }
          })
          .lean();

        const formattedRepost = await formatThreadResponse(populatedRepost, userId);

        return responseHandler.success(res, formattedRepost, "Reposted successfully", statusCodes.CREATED);
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
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: 'username name avatar avatarType' }
      })
      .lean();

    // Preserve order of pagedBookmarkIds
    const orderedThreads = pagedBookmarkIds.map(id => threads.find(t => t._id.toString() === id.toString())).filter(Boolean);

    // Add like/bookmark status
    const threadsWithStatus = (await Promise.all(
        orderedThreads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null);

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
  getArchivedThreads,
  getThreadById,
  updateThread,
  archiveThread,
  deleteThread,
  getFeed,
  repostThread,
  unrepostThread,
  bookmarkThread,
  getBookmarkedThreads
};
