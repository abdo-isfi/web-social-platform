const Notification = require('../models/notification.model');

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

    // Format avatar if exists
    if (notification.sender && notification.sender.avatar) {
      notification.sender.avatar = `data:${notification.sender.avatarType};base64,${notification.sender.avatar.toString('base64')}`;
    }

    return notification;
  } catch (error) {
    console.error('Error populating notification:', error);
    return null;
  }
};

module.exports = {
  populateNotification
};
