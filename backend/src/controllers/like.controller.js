const Like = require('../models/like.model');
const Thread = require('../models/thread.model');
const Comment = require('../models/comment.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');

const Notification = require('../models/notification.model');
const { emitToUser } = require('../socket');

const likeThread = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { threadId } = req.params; // this can be threadId or commentId

    let targetType = 'thread';
    let target = await Thread.findOne({ _id: threadId, isArchived: false });
    
    if (!target) {
        target = await Comment.findById(threadId);
        if (target) {
            targetType = 'comment';
        } else {
            return responseHandler.notFound(res, "Thread or Comment");
        }
    }

    const likeQuery = { user: userId };
    if (targetType === 'thread') likeQuery.thread = threadId;
    else likeQuery.comment = threadId;

    const existingLike = await Like.findOne(likeQuery);
    if (existingLike) {
         return responseHandler.error(res, "You have already liked this", statusCodes.CONFLICT);
    }

    const like = new Like({
      user: userId,
      thread: targetType === 'thread' ? threadId : null,
      comment: targetType === 'comment' ? threadId : null
    });

    await like.save();

    // Notification
    if (target.author.toString() !== userId) {
        const notifData = {
            type: 'LIKE',
            receiver: target.author,
            sender: userId,
            isRead: false
        };
        if (targetType === 'thread') notifData.thread = threadId;
        else {
             notifData.comment = threadId;
             notifData.thread = target.thread; // Link to parent thread for comment like context
        }

        const notif = await Notification.create(notifData);
        emitToUser(target.author, 'notification:new', notif);
    }

    return responseHandler.success(
      res,
      like,
      "Liked successfully",
      statusCodes.CREATED
    );

  } catch (error) {
    if (error.code === 11000) {
      return responseHandler.error(
        res,
        "You have already liked this",
        statusCodes.CONFLICT
      );
    }

    console.error("Like error:", error);
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

    // We try to find match for thread or comment
    // Since we don't know type, we can populate query for both or check target
    // Simplest: Check existence of target to know type, then delete like.
    
    // Actually, we can just try to delete where (thread=id OR comment=id) AND user=userId
    // But we need to be precise.
    
    const like = await Like.findOneAndDelete({
        user: userId,
        $or: [{ thread: threadId }, { comment: threadId }]
    });

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
    console.error("Unlike error:", error);
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
    // Only fetching liked THREADS for now, as profile usually shows that.
    const likes = await Like.find({ user: userId, thread: { $ne: null } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'thread',
        match: { isArchived: false }, 
        populate: { path: 'author', select: 'username name avatar avatarType' } 
      })
      .lean();

    const likedThreads = likes
      .filter(like => like.thread !== null)
      .map(like => ({
        ...like.thread,
        likedAt: like.createdAt 
      }));

    const totalLikes = await Like.countDocuments({ user: userId, thread: { $ne: null } });

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
