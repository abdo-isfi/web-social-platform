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

    // Get following list for "Follow Back" check
    const following = await Follow.find({ follower: userId }).select('following');
    const followingIds = new Set(following.map(f => f.following.toString()));

    const formattedNotifications = unreadNotifications.map(notification => {
        // Compute isFollowing
        let isFollowing = false;
        if (notification.sender) {
            isFollowing = followingIds.has(notification.sender._id.toString());
            
            // Format avatar
            if (notification.sender.avatar) {
                notification.sender.avatar = `data:${notification.sender.avatarType};base64,${notification.sender.avatar.toString('base64')}`;
            }
        }
        return { ...notification, isFollowing };
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
