const Comment = require("../models/comment.model");
const Thread = require("../models/thread.model");
const Like = require("../models/like.model");
const Notification = require('../models/notification.model');
const { emitToUser } = require('../socket');
const { populateNotification } = require('../utils/notificationHelper');
const responseHandler = require("../utils/responseHandler");
const { statusCodes } = require("../utils/statusCodes");

const getComments = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page, limit } = req.pagination;
    const { cursor } = req.query;

    let query = { thread: threadId };

    if (cursor) {
       query.createdAt = { $gt: new Date(cursor) };
    }

    let queryBuilder = Comment.find(query)
      .sort({ createdAt: 1 })
      .populate('author', '_id username name avatar avatarType')
      .lean();

    if (!cursor && page > 1) {
        const skip = (page - 1) * limit;
        queryBuilder = queryBuilder.skip(skip);
    }
    
    queryBuilder = queryBuilder.limit(limit);

    const comments = await queryBuilder;

    const commentsWithLikes = await Promise.all(
        comments.map(async (comment) => {
             const likeCount = await Like.countDocuments({ comment: comment._id });
             let isLiked = false;
             if(req.user) {
                 isLiked = !!await Like.findOne({ user: req.user.id, comment: comment._id });
             }
             return { ...comment, likeCount, isLiked };
        })
    );

    const nextCursor = commentsWithLikes.length > 0 ? commentsWithLikes[commentsWithLikes.length - 1].createdAt : null;
    const hasMore = commentsWithLikes.length === limit;

    const totalComments = await Comment.countDocuments({ thread: threadId });
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

    const comment = await Comment.create({
      content,
      author: userId,
      thread: threadId,
      media: null
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', '_id username name avatar avatarType')
      .lean();

    // Notification
    if (parentThread.author.toString() !== userId) {
        const notif = await Notification.create({
            type: 'COMMENT',
            receiver: parentThread.author,
            sender: userId,
            thread: threadId,
            comment: comment._id,
            isRead: false
        });
        const populatedNotif = await populateNotification(notif._id);
        emitToUser(parentThread.author, 'notification:new', populatedNotif || notif);
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
