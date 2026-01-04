const Like = require('../models/like.model');
const Thread = require('../models/thread.model');
const Comment = require('../models/comment.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');

const Notification = require('../models/notification.model');
const { emitToUser, broadcast } = require('../socket');
const { populateNotification } = require('../utils/notificationHelper');

const updateLikeCount = async (targetId, type) => {
    try {
        const count = await Like.countDocuments({ 
            [type]: targetId 
        });
        
        if (type === 'thread') {
            broadcast('post_updated', { 
                postId: targetId, 
                likeCount: count 
            });
        } else {
            broadcast('comment_updated', { 
                commentId: targetId, 
                likeCount: count 
            });
        }
    } catch (error) {
        console.error("Error broadcasting like count:", error);
    }
};

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
        // Consolidate notification: find existing like notif from this sender for this target
        const notifQuery = {
          type: 'LIKE',
          receiver: target.author,
          sender: userId
        };
        if (targetType === 'thread') notifQuery.thread = threadId;
        else notifQuery.comment = threadId;

        const existingNotif = await Notification.findOne(notifQuery);

        let notif;
        if (existingNotif) {
          existingNotif.isRead = false;
          existingNotif.updatedAt = new Date();
          notif = await existingNotif.save();
        } else {
          const notifData = {
            ...notifQuery,
            isRead: false
          };
          if (targetType === 'comment') {
            notifData.thread = target.thread; // Context
          }
          notif = await Notification.create(notifData);
        }

        const populatedNotif = await populateNotification(notif._id);
        emitToUser(target.author, 'notification:new', populatedNotif || notif);
    }

    return responseHandler.success(
      res,
      like,
      "Liked successfully",
      statusCodes.CREATED
    );
    
    // Real-time update (fire and forget)
    updateLikeCount(threadId, targetType);

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

    // Clean up notification
    await Notification.deleteMany({
      sender: userId,
      $or: [{ thread: threadId }, { comment: threadId }],
      type: 'LIKE'
    });

    return responseHandler.success(
      res,
      null,
      "Like removed successfully",
      statusCodes.DELETED
    );

    // Real-time update
    // We need to know the type. Based on previous logic, we don't know distinctively unless we query.
    // But updateLikeCount queries by count. 
    // Optimization: check if 'target.author' was populated implies we fetched 'target'. 
    // Note: unlikeThread doesn't fetch 'target' in my code previously shown, it does findOneAndDelete.
    // I need to check what findOneAndDelete returns. It returns the deleted document.
    // The deleted document has 'thread' or 'comment' fields set.
    if (like.thread) {
        updateLikeCount(like.thread, 'thread');
    } else if (like.comment) {
        updateLikeCount(like.comment, 'comment');
    }

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
