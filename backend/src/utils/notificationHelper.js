const Notification = require('../models/notification.model');
const Follow = require('../models/follower.model');

/**
 * Populates a notification with sender and thread details and formats avatars.
 * @param {string} notificationId - The ID of the notification to populate.
 * @returns {Promise<Object>} The populated and formatted notification object.
 */
const populateNotification = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId)
      .populate('sender', '_id name username avatar avatarType')
      .populate('thread', 'content')
      .lean();

    if (!notification) return null;

    // Check relationship statuses
    // 1. Does the receiver of the notification follow the sender back?
    const followBack = await Follow.findOne({
      follower: notification.receiver,
      following: notification.sender?._id
    });
    
    // 2. What is the status of the sender following the receiver?
    const senderFollow = await Follow.findOne({
      follower: notification.sender?._id,
      following: notification.receiver
    });

    notification.isFollowingSender = followBack?.status === 'ACCEPTED';
    notification.followRequestStatus = senderFollow?.status || null;

    return notification;
  } catch (error) {
    console.error('Error populating notification:', error);
    return null;
  }
};

module.exports = {
  populateNotification
};
