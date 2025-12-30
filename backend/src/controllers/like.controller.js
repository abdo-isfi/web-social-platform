const Like = require('../models/like.model');
const Thread = require('../models/thread.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');

const Notification = require('../models/notification.model');
const { emitToUser } = require('../socket');

const likeThread = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { threadId } = req.params;
    const thread = await Thread.findOne({ _id: threadId, isArchived: false });
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }
    const like = new Like({
      user: userId,
      thread: threadId
    });

    await like.save();

    // Notification
    if (thread.author.toString() !== userId) {
        const notif = await Notification.create({
            type: 'LIKE',
            receiver: thread.author,
            sender: userId,
            thread: thread._id,
            isRead: false
        });
        emitToUser(thread.author, 'notification:new', notif);
    }

    return responseHandler.success(
      res,
      like,
      "Thread liked successfully",
      statusCodes.CREATED
    );

  } catch (error) {
    if (error.code === 11000) {
      return responseHandler.error(
        res,
        "You have already liked this thread",
        statusCodes.CONFLICT
      );
    }

    console.error("Like thread error:", error);
    return responseHandler.error(
      res,
      null,
      statusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
const unlikeThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    // Check if the thread exists
    const thread = await Thread.findOne({ _id: threadId, isArchived: false });
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }

    // Delete the like directly
    const like = await Like.findOneAndDelete({ user: userId, thread: threadId });
    if (!like) {
      return responseHandler.notFound(res, "Like");
    }

    return responseHandler.success(
      res,
      null,
      "Like removed successfully",
      statusCodes.DELETED
    );

  } catch (error) {
    console.error("Unlike thread error:", error);
    return responseHandler.error(
      res,
      null,
      statusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
const getUserLikedThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page ,limit  } = req.pagination;
    const skip = (page - 1) * limit;

    // Get likes by user and paginate
    const likes = await Like.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'thread',
        match: { isArchived: false }, // only threads not archived
        populate: { path: 'author', select: 'username' } // populate thread author
      })
      .lean();

    // Filter out likes whose thread was archived (populate returns null)
    const likedThreads = likes
      .filter(like => like.thread !== null)
      .map(like => ({
        ...like.thread,
        likedAt: like.createdAt // optional: when user liked this thread
      }));

    // Count total likes for pagination
    const totalLikes = await Like.countDocuments({ user: userId });

    const totalPages = Math.ceil(totalLikes / limit);

    return responseHandler.success(
      res,
      {
        threads: likedThreads,
        pagination: {
          totalLikes,
          totalPages,
          currentPage: page,
          pageSize: limit
        }
      },
      "Threads liked by you fetched successfully",
      statusCodes.SUCCESS
    );

  } catch (error) {
    console.error("Get user liked threads error:", error);
    return responseHandler.error(
      res,
      null,
      statusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = { unlikeThread , likeThread , getUserLikedThreads };
