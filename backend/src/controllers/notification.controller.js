const Notification = require('../models/notification.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const { refreshPresignedUrl } = require('../utils/minioHelper');
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const Follow = require('../models/follower.model');

    const unreadNotifications = await Notification.find({ receiver: userId, isRead: false })
      .sort({ createdAt: -1 })
      .populate('sender', '_id name username avatar avatarType')
      .populate('thread', 'content')
      .lean();

    // Get follow statuses for all senders to handle "Follow Back" and "Request Status"
    const senderIds = unreadNotifications.map(n => n.sender?._get ? n.sender._id : n.sender).filter(Boolean);
    
    // Statuses where I (receiver) am the follower (for Follow Back)
    const following = await Follow.find({ follower: userId, following: { $in: senderIds } });
    const followingSet = new Set(following.map(f => f.following.toString()));

    // Statuses where I (receiver) am the following (for Accept/Reject)
    const incomingRequests = await Follow.find({ following: userId, follower: { $in: senderIds } });
    const incomingRequestsMap = new Map(incomingRequests.map(f => [f.follower.toString(), f.status]));

    const formattedNotifications = await Promise.all(unreadNotifications.map(async notification => {
        const senderId = notification.sender?._id?.toString() || notification.sender?.toString();
        
        let isFollowingSender = false;
        let followRequestStatus = null;

        if (senderId) {
            isFollowingSender = followingSet.has(senderId);
            followRequestStatus = incomingRequestsMap.get(senderId);

            // Format avatar
            if (notification.sender && notification.sender.avatar && Buffer.isBuffer(notification.sender.avatar)) {
                notification.sender.avatar = `data:${notification.sender.avatarType};base64,${notification.sender.avatar.toString('base64')}`;
            } else if (notification.sender?.avatar?.key) {
                notification.sender.avatar.url = await refreshPresignedUrl(notification.sender.avatar.key);
            }
        }
        
        return { 
            ...notification.toObject ? notification.toObject() : notification, 
            isFollowingSender,
            followRequestStatus 
        };
    }));

    return responseHandler.success(res, formattedNotifications, "Unread notifications fetched successfully", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Get unread notifications error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({ _id: notificationId, receiver: userId });
    
    if (!notification) {
      return responseHandler.notFound(res, 'Notification');
    }

    notification.isRead = true;
    await notification.save();

    return responseHandler.success(
      res,
      notification,
      'Notification marked as read',
      statusCodes.UPDATED
    );
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return responseHandler.success(
      res,
      { modifiedCount: result.modifiedCount },
      'All notifications marked as read',
      statusCodes.UPDATED
    );
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const Follow = require('../models/follower.model');

    const allNotifications = await Notification.find({ receiver: userId })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to 50 for now
      .populate('sender', '_id name username avatar avatarType')
      .populate('thread', 'content')
      .lean();

    // Get follow statuses for all senders
    const senderIds = allNotifications.map(n => n.sender?._get ? n.sender._id : n.sender).filter(Boolean);
    
    // Statuses where I (receiver) am the follower
    const following = await Follow.find({ follower: userId, following: { $in: senderIds } });
    const followingSet = new Set(following.map(f => f.following.toString()));

    // Statuses where I (receiver) am the following
    const incomingRequests = await Follow.find({ following: userId, follower: { $in: senderIds } });
    const incomingRequestsMap = new Map(incomingRequests.map(f => [f.follower.toString(), f.status]));

    const formattedNotifications = await Promise.all(allNotifications.map(async notification => {
        const senderId = notification.sender?._id?.toString() || notification.sender?.toString();
        
        let isFollowingSender = false;
        let followRequestStatus = null;

        if (senderId) {
            isFollowingSender = followingSet.has(senderId);
            followRequestStatus = incomingRequestsMap.get(senderId);

            // Format avatar
            if (notification.sender && notification.sender.avatar && Buffer.isBuffer(notification.sender.avatar)) {
                notification.sender.avatar = `data:${notification.sender.avatarType};base64,${notification.sender.avatar.toString('base64')}`;
            } else if (notification.sender?.avatar?.key) {
                notification.sender.avatar.url = await refreshPresignedUrl(notification.sender.avatar.key);
            }
        }
        
        return { 
            ...notification, 
            isFollowingSender,
            followRequestStatus 
        };
    }));

    return responseHandler.success(res, formattedNotifications, "All notifications fetched successfully", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Get all notifications error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({ receiver: userId });

    return responseHandler.success(
      res,
      { deletedCount: result.deletedCount },
      'All notifications cleared successfully',
      statusCodes.SUCCESS
    );
  } catch (error) {
    console.error('Delete all notifications error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteAllNotifications
};
