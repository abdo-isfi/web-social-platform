const Notification = require('../models/notification.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const Follow = require('../models/follower.model');

    const unreadNotifications = await Notification.find({ receiver: userId, isRead: false })
      .sort({ createdAt: -1 })
      .populate('sender', 'name username avatar avatarType')
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

    const formattedNotifications = unreadNotifications.map(notification => {
        const senderId = notification.sender?._id?.toString() || notification.sender?.toString();
        
        let isFollowingSender = false;
        let followRequestStatus = null;

        if (senderId) {
            isFollowingSender = followingSet.has(senderId);
            followRequestStatus = incomingRequestsMap.get(senderId);

            // Format avatar
            if (notification.sender && notification.sender.avatar) {
                notification.sender.avatar = `data:${notification.sender.avatarType};base64,${notification.sender.avatar.toString('base64')}`;
            }
        }
        
        return { 
            ...notification.toObject ? notification.toObject() : notification, 
            isFollowingSender,
            followRequestStatus 
        };
    });

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

module.exports = {
  getUnreadNotifications,
  markAsRead,
  markAllAsRead
};
