const Like = require("../models/like.model");
const Follow = require("../models/follower.model");
const Thread = require("../models/thread.model");

/**
 * Formats a thread object with permissions, counts, and base64 media.
 */
const formatThreadResponse = async (thread, userId) => {
    // Format avatars
    if (thread.author && thread.author.avatar && !thread.author.avatar.toString().startsWith('data:')) {
        thread.author.avatar = `data:${thread.author.avatarType};base64,${thread.author.avatar.toString('base64')}`;
    }

    // Format media
    if (thread.media) {
        // For MinIO-stored media, refresh the presigned URL
        if (thread.media.key) {
            try {
                const { refreshPresignedUrl } = require('./minioHelper');
                thread.media.url = await refreshPresignedUrl(thread.media.key);
            } catch (error) {
                console.warn(`⚠ Failed to refresh presigned URL for ${thread.media.key}:`, error.message);
                // Keep existing URL if refresh fails
            }
        }
        // For legacy embedded media, convert to base64
        else if (thread.media.data) {
            thread.media.url = `data:${thread.media.contentType};base64,${thread.media.data.toString('base64')}`;
        }
    }

    // Handle repostOf formatting
    if (thread.repostOf) {
        if (thread.repostOf.author && thread.repostOf.author.avatar && !thread.repostOf.author.avatar.toString().startsWith('data:')) {
            thread.repostOf.author.avatar = `data:${thread.repostOf.author.avatarType};base64,${thread.repostOf.author.avatar.toString('base64')}`;
        }
        if (thread.repostOf.media) {
            // For MinIO-stored media, refresh the presigned URL
            if (thread.repostOf.media.key) {
                try {
                    const { refreshPresignedUrl } = require('./minioHelper');
                    thread.repostOf.media.url = await refreshPresignedUrl(thread.repostOf.media.key);
                } catch (error) {
                    console.warn(`⚠ Failed to refresh presigned URL for repost ${thread.repostOf.media.key}:`, error.message);
                }
            }
            // For legacy embedded media
            else if (thread.repostOf.media.data) {
                thread.repostOf.media.url = `data:${thread.repostOf.media.contentType};base64,${thread.repostOf.media.data.toString('base64')}`;
            }
        }
    }

    const likeCount = await Like.countDocuments({ thread: thread._id });
    const repostCount = await Thread.countDocuments({ repostOf: thread._id });
    const commentCount = await Thread.countDocuments({ parentThread: thread._id, isArchived: false });
    
    let isLiked = false;
    let isReposted = false;
    let isBookmarked = false;
    let isOwner = false;
    let isFollowingAuthor = false;
    let followStatus = null;

    if (userId) {
        const User = require("../models/user.model");
        const user = await User.findById(userId).select('bookmarks');
        
        isLiked = !!await Like.findOne({ user: userId, thread: thread._id });
        isReposted = !!await Thread.findOne({ author: userId, repostOf: thread._id });
        isBookmarked = user?.bookmarks?.some(b => b.toString() === thread._id.toString());
        
        const authorId = thread.author._id || thread.author;
        isOwner = authorId.toString() === userId.toString();
        
        if (!isOwner) {
            const follow = await Follow.findOne({ follower: userId, following: authorId });
            if (follow) {
                isFollowingAuthor = follow.status === 'ACCEPTED';
                followStatus = follow.status;
            }
        }
    }

    return { 
        ...thread, 
        likeCount, 
        repostCount, 
        commentCount, 
        isLiked, 
        isReposted,
        isBookmarked,
        permissions: {
            isOwner,
            isFollowing: isFollowingAuthor,
            followStatus,
            canFollow: !isOwner && !isFollowingAuthor,
            canReport: !isOwner,
            canEdit: isOwner,
            canDelete: isOwner,
            canRepost: !isReposted
        }
    };
};

module.exports = { formatThreadResponse };
