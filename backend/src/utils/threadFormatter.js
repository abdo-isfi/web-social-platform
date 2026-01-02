const Like = require("../models/like.model");
const Follow = require("../models/follower.model");
const Comment = require("../models/comment.model");
const Thread = require("../models/thread.model");

/**
 * Formats a thread object with permissions, counts, and base64 media.
 */
const formatThreadResponse = async (thread, userId) => {
    // Handle orphaned threads (author deleted)
    if (!thread.author) {
        console.warn(`⚠ Thread ${thread._id} has no author (deleted user)`);
        return null; // Skip this thread
    }

    // Format avatars
    if (thread.author && thread.author.avatar) {
        // If it's a MinIO object { url, key }
        if (typeof thread.author.avatar === 'object' && thread.author.avatar.url) {
            // Need to refresh presigned URL if it has a key
            if (thread.author.avatar.key) {
                try {
                    const { refreshPresignedUrl } = require('./minioHelper');
                    thread.author.avatar = await refreshPresignedUrl(thread.author.avatar.key);
                } catch (error) {
                    console.warn(`⚠ Failed to refresh avatar URL for user ${thread.author._id}:`, error.message);
                    thread.author.avatar = thread.author.avatar.url; // Fallback to existing URL
                }
            } else {
                thread.author.avatar = thread.author.avatar.url;
            }
        } 
        // If it's legacy Buffer data
        else if (Buffer.isBuffer(thread.author.avatar)) {
             thread.author.avatar = `data:${thread.author.avatarType};base64,${thread.author.avatar.toString('base64')}`;
        }
        // If it's a Mongoose lean Buffer object { type: 'Buffer', data: [...] }
        else if (thread.author.avatar.type === 'Buffer' && Array.isArray(thread.author.avatar.data)) {
             const buffer = Buffer.from(thread.author.avatar.data);
             thread.author.avatar = `data:${thread.author.avatarType};base64,${buffer.toString('base64')}`;
        }
        // If it's already a string, do nothing
    }

    // Format media
    if (thread.media) {
        // Ensure mediaType is set if it was old 'type'
        if (!thread.media.mediaType && thread.media.type && typeof thread.media.type === 'string') {
            thread.media.mediaType = thread.media.type;
        }

        // For MinIO-stored media, refresh the presigned URL
        if (thread.media.key) {
            try {
                const { refreshPresignedUrl } = require('./minioHelper');
                thread.media.url = await refreshPresignedUrl(thread.media.key);
            } catch (error) {
                console.warn(`⚠ Failed to refresh presigned URL for ${thread.media.key}:`, error.message);
            }
        }
        // For legacy embedded media, convert to base64
        else if (thread.media.data) {
            let buffer;
            if (Buffer.isBuffer(thread.media.data)) {
                buffer = thread.media.data;
            } else if (thread.media.data.type === 'Buffer' && Array.isArray(thread.media.data.data)) {
                buffer = Buffer.from(thread.media.data.data);
            }

            if (buffer) {
                thread.media.url = `data:${thread.media.contentType};base64,${buffer.toString('base64')}`;
            }
        }
        
        // Ensure we always have a type for the frontend
        if (!thread.media.mediaType && thread.media.contentType) {
            thread.media.mediaType = thread.media.contentType.startsWith('video/') ? 'video' : 'image';
        }
    }

    // Handle repostOf formatting
    if (thread.repostOf) {
        if (thread.repostOf.author && thread.repostOf.author.avatar) {
             const author = thread.repostOf.author;
             if (typeof author.avatar === 'object' && author.avatar.url) {
                author.avatar = author.avatar.url;
             } else if (Buffer.isBuffer(author.avatar)) {
                author.avatar = `data:${author.avatarType};base64,${author.avatar.toString('base64')}`;
             } else if (author.avatar && author.avatar.type === 'Buffer') {
                author.avatar = `data:${author.avatarType};base64,${Buffer.from(author.avatar.data).toString('base64')}`;
             }
        }
        if (thread.repostOf.media) {
            const media = thread.repostOf.media;
            if (!media.mediaType && media.type && typeof media.type === 'string') {
                media.mediaType = media.type;
            }

            if (media.key) {
                try {
                    const { refreshPresignedUrl } = require('./minioHelper');
                    media.url = await refreshPresignedUrl(media.key);
                } catch (error) {
                    console.warn(`⚠ Failed to refresh presigned URL for repost ${media.key}:`, error.message);
                }
            } else if (media.data) {
                let buffer;
                if (Buffer.isBuffer(media.data)) buffer = media.data;
                else if (media.data && media.data.type === 'Buffer') buffer = Buffer.from(media.data.data);
                
                if (buffer) {
                    media.url = `data:${media.contentType};base64,${buffer.toString('base64')}`;
                }
            }

            if (!media.mediaType && media.contentType) {
                media.mediaType = media.contentType.startsWith('video/') ? 'video' : 'image';
            }
        }
    }

    const likeCount = await Like.countDocuments({ thread: thread._id });
    const repostCount = await Thread.countDocuments({ repostOf: thread._id });
    const commentCount = await Comment.countDocuments({ thread: thread._id });
    
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
        isBookmarked = user?.bookmarks?.some(b => b.toString() === (thread._id?.toString() || thread._id));
        
        const authorId = thread.author?._id || thread.author;
        if (authorId && userId) {
            isOwner = authorId.toString() === userId.toString();
        }
        
        if (!isOwner && authorId && userId) {
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
