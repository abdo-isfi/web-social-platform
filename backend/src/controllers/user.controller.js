const User = require('../models/user.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const hashPassword = require('../utils/hashPassword'); 
const { uploadBufferToMinIO, generateUniqueFileName } = require('../utils/minioHelper');

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
      const fileName = generateUniqueFileName(req.file.originalname);
      const { url, key } = await uploadBufferToMinIO(req.file.buffer, fileName, req.file.mimetype);
      userData.avatar = { url, key };
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
      avatar: user.avatar?.url || null,
      banner: user.banner?.url || null,
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
      birthday,
      showBirthday
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
    if (showBirthday !== undefined) {
      user.showBirthday = showBirthday === true || showBirthday === 'true';
    }

    // Update banner
    if (req.files?.banner) {
      const fileName = generateUniqueFileName(req.files.banner[0].originalname);
      const { url, key } = await uploadBufferToMinIO(req.files.banner[0].buffer, fileName, req.files.banner[0].mimetype);
      user.banner = { url, key };
      user.bannerType = req.files.banner[0].mimetype;
    }

    // Update avatar
    if (req.files?.avatar) {
      const fileName = generateUniqueFileName(req.files.avatar[0].originalname);
      const { url, key } = await uploadBufferToMinIO(req.files.avatar[0].buffer, fileName, req.files.avatar[0].mimetype);
      user.avatar = { url, key };
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
      avatar: user.avatar?.url || null,
      banner: user.banner?.url || null,
      bio: user.bio,
      location: user.location,
      website: user.website,
      birthday: user.birthday,
      showBirthday: user.showBirthday
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
    let followsMe = false;

    // Check relationship if user is authenticated
    if (req.user) {
        const Follow = require('../models/follower.model');
        const follow = await Follow.findOne({ follower: req.user.id, following: userId });
        if (follow) {
          isFollowing = follow.status === 'ACCEPTED';
          followStatus = follow.status;
        }

        const followingMe = await Follow.findOne({ follower: userId, following: req.user.id, status: 'ACCEPTED' });
        followsMe = !!followingMe;
    }

    const isAuthorized = req.user && (req.user.id === userId || isFollowing);

    const { refreshPresignedUrl } = require('../utils/minioHelper');
    if (user.avatar?.key) {
        try {
            user.avatar.url = await refreshPresignedUrl(user.avatar.key);
        } catch (e) {
            console.error('Failed to refresh avatar URL:', e);
        }
    }
    if (user.banner?.key) {
        try {
            user.banner.url = await refreshPresignedUrl(user.banner.key);
        } catch (e) {
            console.error('Failed to refresh banner URL:', e);
        }
    }

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
        avatar: user.avatar?.url || null,
        banner: user.banner?.url || null,
        bio: user.bio,
        location: user.location,
        website: user.website,
        birthday: (user.showBirthday || (req.user && req.user.id === userId)) ? user.birthday : null,
        showBirthday: user.showBirthday,
        followsMe: followsMe,
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

    // Get list of users already followed (ACCEPTED)
    const following = await Follow.find({ 
        follower: userId,
        status: 'ACCEPTED'
    }).select('following');
    const followingIds = following.map(f => f.following);
    
    // Add current user to exclusion list
    followingIds.push(userId);

    // Find users not followed (ACCEPTED)
    const suggestions = await User.find({ _id: { $nin: followingIds } })
      .select('_id name username avatar avatarType')
      .limit(5)
      .lean();

    // Map through suggestions and check for PENDING status
    const formattedSuggestions = await Promise.all(suggestions.map(async (user) => {
      const follow = await Follow.findOne({ follower: userId, following: user._id });
      
      const { refreshPresignedUrl } = require('../utils/minioHelper');
      if (user.avatar?.key) {
        try {
            user.avatar.url = await refreshPresignedUrl(user.avatar.key);
        } catch (e) {
            console.error('Failed to refresh suggestion avatar URL:', e);
        }
      }
      // Check if suggested user follows the current user
      const followingMe = await Follow.findOne({ follower: user._id, following: userId, status: 'ACCEPTED' });

      return {
          ...user,
          avatar: user.avatar?.url || null,
          followStatus: follow?.status || null,
          followsMe: !!followingMe
      };
    }));

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

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete associated data first or handle orphans
    // For now, let's just delete the user.
    // In a real app, you'd delete their threads, comments, likes, etc.
    const user = await User.findByIdAndDelete(userId);
    if (!user) return responseHandler.notFound(res, 'User');

    // Clean up MinIO if needed (avatar, banner)
    // const { deleteFromMinIO } = require('../utils/minioHelper');
    // if (user.avatar?.key) await deleteFromMinIO(user.avatar.key);
    // if (user.banner?.key) await deleteFromMinIO(user.banner.key);

    return responseHandler.success(res, null, 'Account deleted successfully', statusCodes.SUCCESS);
  } catch (error) {
    console.error('Delete account error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  createUser,
  updateProfile,
  getUserById,
  getUserPosts,
  getSuggestions,
  updatePrivacy,
  deleteAccount
};
