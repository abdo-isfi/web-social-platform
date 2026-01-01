const User = require('../models/user.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const hashPassword = require('../utils/hashPassword'); 
const createUser = async (req, res) => {
  try {
    const { name, username, email, password, isPrivate } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return responseHandler.error(
        res,
        `${field} already exists`,
        statusCodes.CONFLICT
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const userData = {
      name: name || '',
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      isPrivate: isPrivate || false
    };

    if (req.file) {
      userData.avatar = req.file.buffer;
      userData.avatarType = req.file.mimetype;
    }

    const user = new User(userData);
    await user.save();

    // Prepare response
    const userResponse = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      avatar: user.avatar ? `data:${user.avatarType};base64,${user.avatar.toString('base64')}` : null
    };

    return responseHandler.success(
      res,
      userResponse,
      'User created successfully',
      statusCodes.CREATED
    );

  } catch (error) {
    return responseHandler.error(
      res,
      'Failed to create user',
      statusCodes.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notFound(res, 'User');
    }

    const {
      username,
      email,
      password,
      isPrivate,
      name,
      bio,
      location,
      website,
      birthday
    } = req.body;

    // Check username uniqueness
    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) {
        return responseHandler.error(
          res,
          'Username already exists',
          statusCodes.CONFLICT
        );
      }
      user.username = username;
    }

    // Check email uniqueness
    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return responseHandler.error(
          res,
          'Email already exists',
          statusCodes.CONFLICT
        );
      }
      user.email = email.toLowerCase();
    }

    // Update password
    if (password) {
      user.password = await hashPassword(password);
    }

    // Update privacy
    if (isPrivate !== undefined) {
      user.isPrivate = isPrivate === true || isPrivate === 'true';
    }

    if (name) {
      user.name = name;
      const parts = name.split(' ');
      if (parts.length > 0) user.firstName = parts[0];
      if (parts.length > 1) user.lastName = parts.slice(1).join(' ');
    }
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (birthday !== undefined) user.birthday = birthday;

    // Update banner
    if (req.files?.banner) {
      user.banner = req.files.banner[0].buffer;
      user.bannerType = req.files.banner[0].mimetype;
    }

    // Update avatar
    if (req.files?.avatar) {
      user.avatar = req.files.avatar[0].buffer;
      user.avatarType = req.files.avatar[0].mimetype;
    }

    await user.save();

    const userResponse = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      avatar: user.avatar
        ? `data:${user.avatarType};base64,${user.avatar.toString('base64')}`
        : null,
      banner: user.banner
        ? `data:${user.bannerType};base64,${user.banner.toString('base64')}`
        : null,
      bio: user.bio,
      location: user.location,
      website: user.website,
      birthday: user.birthday
    };

    return responseHandler.success(
      res,
      userResponse,
      'Profile updated successfully',
      statusCodes.UPDATED
    );

  } catch (error) {
    console.error('Update profile error:', error);
    return responseHandler.error(
      res,
      'Failed to update profile',
      statusCodes.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return responseHandler.notFound(res, 'User');
    }

    let isFollowing = false;
    let followStatus = null;
    // Check if current user follows this profile
    if (req.user) {
        const Follow = require('../models/follower.model');
        const follow = await Follow.findOne({ follower: req.user.id, following: userId });
        if (follow) {
          isFollowing = follow.status === 'ACCEPTED';
          followStatus = follow.status;
        }
    }

    const isAuthorized = req.user && (req.user.id === userId || isFollowing);

    const userResponse = {
        _id: user._id,
        name: user.name,
        username: user.username,
        isPrivate: user.isPrivate,
        isFollowing,
        followStatus,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        createdAt: user.createdAt,
        avatar: user.avatar ? `data:${user.avatarType};base64,${user.avatar.toString('base64')}` : null,
        banner: user.banner ? `data:${user.bannerType};base64,${user.banner.toString('base64')}` : null,
        bio: user.bio,
        location: user.location,
        website: user.website,
        birthday: user.birthday,
    };

    if (user.isPrivate && !isAuthorized) {
        userResponse.isPrivateView = true;
        // Optionally omit more data if needed for strictly private views
    }

    return responseHandler.success(
      res,
      userResponse,
      'User fetched successfully',
      statusCodes.SUCCESS
    );
  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};
const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user?.id;
    
    // Check privacy
    const targetUser = await User.findById(userId);
    if (!targetUser) return responseHandler.notFound(res, 'User');

    let isFollowing = false;
    if (currentUserId) {
        const Follow = require('../models/follower.model');
        const follow = await Follow.findOne({ follower: currentUserId, following: userId, status: 'ACCEPTED' });
        isFollowing = !!follow;
    }

    const isAuthorized = currentUserId && (currentUserId === userId || isFollowing);

    if (targetUser.isPrivate && !isAuthorized) {
        return responseHandler.success(res, [], 'Profile is private', statusCodes.SUCCESS);
    }

    const Thread = require('../models/thread.model');
    
    const posts = await Thread.find({ author: userId, isArchived: false })
      .sort({ createdAt: -1 })
      .populate('author', '_id username name avatar avatarType')
      .populate('parentThread', 'content author')
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: 'username name avatar avatarType' }
      })
      .lean();

    const { formatThreadResponse } = require('../utils/threadFormatter');
    const formattedPosts = await Promise.all(
        posts.map(post => formatThreadResponse(post, currentUserId))
    );

    return responseHandler.success(
      res,
      formattedPosts,
      'User posts fetched successfully',
      statusCodes.SUCCESS
    );
  } catch (error) {
    console.error('Get user posts error:', error);
    return responseHandler.error(res, 'Failed to fetch user posts', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const Follow = require('../models/follower.model');

    // Get list of users already followed (or pending)
    const following = await Follow.find({ follower: userId }).select('following');
    const followingIds = following.map(f => f.following);
    
    // Add current user to exclusion list
    followingIds.push(userId);

    // Find users not in the exclusion list
    // Use aggregation to get random sample or just find with limit for now
    const suggestions = await User.find({ _id: { $nin: followingIds } })
      .select('_id name username avatar avatarType')
      .limit(5)
      .lean();

     // Format avatar
    const formattedSuggestions = suggestions.map(user => {
      if (user.avatar) {
        user.avatar = `data:${user.avatarType};base64,${user.avatar.toString('base64')}`;
      }
      return user;
    });

    return responseHandler.success(
      res,
      formattedSuggestions,
      'Suggestions fetched successfully',
      statusCodes.SUCCESS
    );

  } catch (error) {
    console.error('Get suggestions error:', error);
    return responseHandler.error(res, 'Failed to fetch suggestions', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const updatePrivacy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isPrivate } = req.body;

    if (typeof isPrivate !== 'boolean') {
      return responseHandler.error(res, 'isPrivate must be a boolean', statusCodes.BAD_REQUEST);
    }

    const user = await User.findByIdAndUpdate(userId, { isPrivate }, { new: true });
    if (!user) return responseHandler.notFound(res, 'User');

    return responseHandler.success(res, { isPrivate: user.isPrivate }, 'Privacy updated successfully', statusCodes.SUCCESS);
  } catch (error) {
    console.error('Update privacy error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  createUser,
  updateProfile,
  getUserById,
  getUserPosts,
  getSuggestions,
  updatePrivacy
};
