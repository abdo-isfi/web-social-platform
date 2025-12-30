const Thread = require("../models/thread.model");
const Like = require("../models/like.model");
const Notification = require('../models/notification.model');
const { emitToUser } = require('../socket');
const responseHandler = require("../utils/responseHandler");
const { statusCodes } = require("../utils/statusCodes");

const getComments = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page, limit } = req.pagination;
    const { cursor } = req.query; // Expecting ISO string for cursor

    let query = { parentThread: threadId, isArchived: false };

    // Cursor-based pagination logic (Prioritize cursor if present)
    if (cursor) {
       query.createdAt = { $gt: new Date(cursor) };
    }

    // Improve query performance
    let queryBuilder = Thread.find(query)
      .sort({ createdAt: 1 }) // Chronological
      .populate('author', 'username name avatar avatarType')
      .lean();

    // Apply limit
    // If using cursor, we just take limit + 1 to check if there's more, or just limit
    // Actually standard is taking limit.
    // If using offset (page > 1 and no cursor), use skip.
    // But mixed usage is weird. Let's stick to: if cursor, no skip. if no cursor, use skip.
    
    if (!cursor && page > 1) {
        const skip = (page - 1) * limit;
        queryBuilder = queryBuilder.skip(skip);
    }
    
    // We fetch limit + 0 here, but defining nextCursor requires knowing if there are more.
    // A common trick is fetching limit + 1.
    // Or we can just return the last item's date as cursor.
    // Client knows to stop if returned list < limit.
    queryBuilder = queryBuilder.limit(limit);

    const comments = await queryBuilder;

    const commentsWithLikes = await Promise.all(
        comments.map(async (comment) => {
             const likeCount = await Like.countDocuments({ thread: comment._id });
             let isLiked = false;
             if(req.user) {
                 isLiked = !!await Like.findOne({ user: req.user.id, thread: comment._id });
             }
             return { ...comment, likeCount, isLiked };
        })
    );

    // Calculate next cursor
    const nextCursor = commentsWithLikes.length > 0 ? commentsWithLikes[commentsWithLikes.length - 1].createdAt : null;
    const hasMore = commentsWithLikes.length === limit; // Approximate check

    // We can interpret "hasMore" by just assuming if we got full limit, there might be more.
    // Or do a count. Let's keep the existing total count for metadata if needed, 
    // but for "load more" button visibility, client usually checks if returned count < limit.

    const totalComments = await Thread.countDocuments({ parentThread: threadId, isArchived: false });
    const totalPages = Math.ceil(totalComments / limit);

    return responseHandler.success(res, {
        comments: commentsWithLikes,
        pagination: {
          totalComments,
          totalPages,
          currentPage: page,
          pageSize: limit,
          nextCursor,
          hasMore
        }
    }, "Comments fetched", statusCodes.SUCCESS);

  } catch (error) {
    console.error("Get comments error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const createComment = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const parentThread = await Thread.findById(threadId);
    if (!parentThread) return responseHandler.notFound(res, "Thread");

    const comment = await Thread.create({
      content,
      author: userId,
      parentThread: threadId,
      media: null // Simple comments for now
    });

    const populatedComment = await Thread.findById(comment._id)
      .populate('author', 'username name avatar avatarType')
      .lean();

    // Notification
    if (parentThread.author.toString() !== userId) {
        const notif = await Notification.create({
            type: 'COMMENT',
            receiver: parentThread.author,
            sender: userId,
            thread: comment._id,
            isRead: false
        });
        emitToUser(parentThread.author, 'notification:new', notif);
    }

    return responseHandler.success(res, populatedComment, "Comment added", statusCodes.CREATED);
  } catch (error) {
    console.error("Create comment error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  getComments,
  createComment
};
