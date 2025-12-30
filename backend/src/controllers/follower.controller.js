const Follow = require('../models/follower.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const { emitToUser } = require('../socket');

/**
 * SEND FOLLOW REQUEST
 */
const sendFollowRequest = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { followingId } = req.body;

    if (!followingId) {
      return responseHandler.error(
        res,
        "Following user ID is required",
        statusCodes.BAD_REQUEST
      );
    }

    if (followerId === followingId) {
      return responseHandler.error(
        res,
        "You cannot follow yourself",
        statusCodes.BAD_REQUEST
      );
    }

    const followingUser = await User.findById(followingId);
    if (!followingUser) {
      return responseHandler.notFound(res, "User to follow");
    }

    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId
    });

    if (existingFollow) {
      return responseHandler.error(
        res,
        `Follow request already ${existingFollow.status.toLowerCase()}`,
        statusCodes.CONFLICT
      );
    }

    const followRequest = await Follow.create({
      follower: followerId,
      following: followingId,
      status: "ACCEPTED" // Auto-accept for public profiles (MVP requirement inferred)
    });

    // Atomic increment counts
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

    const notification = await Notification.create({
      type: "FOLLOW_REQUEST", // Keeping type for frontend compat, effectively "NEW_FOLLOWER"
      receiver: followingId,
      sender: followerId,
      thread: null,
      isRead: false
    });

    emitToUser(followingId, "notification:new", notification);

    return responseHandler.success(
      res,
      followRequest,
      "Followed successfully",
      statusCodes.CREATED
    );

  } catch (error) {
    console.error("Send follow request error:", error);
    return responseHandler.error(
      res,
      null,
      statusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * ACCEPT FOLLOW REQUEST
 */
const acceptFollowRequest = async (req, res) => {
  try {
    const followingId = req.user.id;
    const { followerId } = req.body;

    if (!followerId) {
      return responseHandler.error(
        res,
        "Follower ID is required",
        statusCodes.BAD_REQUEST
      );
    }

    const followRequest = await Follow.findOne({
      follower: followerId,
      following: followingId,
      status: "PENDING"
    });

    if (!followRequest) {
      return responseHandler.notFound(res, "Follow request");
    }

    followRequest.status = "ACCEPTED";
    await followRequest.save();

    const notification = await Notification.create({
      type: "FOLLOW_ACCEPTED",
      receiver: followerId,
      sender: followingId,
      thread: null,
      isRead: false
    });

    emitToUser(followerId, "notification:new", notification);

    return responseHandler.success(
      res,
      followRequest,
      "Follow request accepted",
      statusCodes.UPDATED
    );

  } catch (error) {
    console.error("Accept follow request error:", error);
    return responseHandler.error(
      res,
      null,
      statusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params; // The user to unfollow

    const result = await Follow.findOneAndDelete({
      follower: followerId,
      following: userId
    });

    if (!result) {
      return responseHandler.error(res, "You are not following this user", statusCodes.BAD_REQUEST);
    }

    // Atomic decrement counts
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });

    return responseHandler.success(res, null, "Unfollowed successfully", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Unfollow error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  sendFollowRequest,
  acceptFollowRequest,
  unfollowUser
};
