import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SocialCard } from '@/components/ui/social-card';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchPosts, createPost, likePost, unlikePost, addComment, bookmarkPost, deletePost } from '@/store/slices/postSlice';
import { followerService } from '@/services/follower.service';
import { MessageSquare, LayoutGrid, Users } from 'lucide-react';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { setFeedMode } from '@/store/slices/uiSlice';
import { cn } from '@/lib/utils';
import { PostComments } from '@/components/feed/PostComments';

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval}${unit[0]}`;
    }
  }

  return 'Just now';
}

export default function Feed() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { feedMode } = useSelector(state => state.ui);
  const { posts, loading, error } = useSelector(state => state.posts);
  
  const [recentComments, setRecentComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replying, setReplying] = useState(false);

  // Fetch posts on mount and when feedMode changes
  useEffect(() => {
    dispatch(fetchPosts({ 
      page: 1, 
      limit: 20, 
      mode: feedMode === 'public' ? 'discover' : 'following' 
    }));
  }, [dispatch, feedMode]);

  const handleNewPost = (data) => {
    requireAuth(() => {
      dispatch(createPost(data));
    }, 'login');
  };

  const handleFeedModeChange = (mode) => {
    dispatch(setFeedMode(mode));
  };

  const handleLike = (postId, isLiked) => {
    requireAuth(() => {
      if (isLiked) {
        dispatch(unlikePost(postId));
      } else {
        dispatch(likePost(postId));
      }
    }, 'login');
  };

  const handleAction = async (id, action, authorId) => {
    requireAuth(async () => {
      if (action === 'commented') {
         setReplyingTo(id);
      } else if (action === 'bookmarked') {
         dispatch(bookmarkPost(id));
      } else if (action === 'delete') {
         dispatch(deletePost(id));
      } else if (action === 'archive') {
         dispatch(archivePost(id));
      } else if (action === 'follow') {
         await followerService.followUser(authorId);
         dispatch(fetchPosts({ page: 1, limit: 10, mode: feedMode === 'public' ? 'discover' : 'following' }));
      } else if (action === 'unfollow') {
         await followerService.unfollowUser(authorId);
         dispatch(fetchPosts({ page: 1, limit: 10, mode: feedMode === 'public' ? 'discover' : 'following' }));
      } else if (action === 'report') {
         // Placeholder for reporting logic
         console.log(`Reported post ${id}`);
      }
      console.log(`Post ${id}: ${action}`);
    }, 'login');
  };

  const handleReplySubmit = async (content) => {
      if (!replyingTo) return;
      setReplying(true);
      try {
          const resultAction = await dispatch(addComment({ postId: replyingTo, content }));
          if (addComment.fulfilled.match(resultAction)) {
             const { comment } = resultAction.payload;
             setRecentComments(prev => ({
                 ...prev,
                 [replyingTo]: comment
             }));
          }
          setReplyingTo(null);
      } catch (error) {
          console.error("Failed to reply", error);
      } finally {
          setReplying(false);
      }
  };

  const filteredPosts = posts;
  console.log("Feed posts:", filteredPosts);

  return (
    <div className="space-y-0 -mt-6">
      {/* Feed Filter Mini Navbar */}
      <div className="px-4 py-6 space-y-6">
        <CreatePost onPost={handleNewPost} />

        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : error && posts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-16 h-16" />}
            title="Unable to load posts"
            description={error || "There was an error loading the feed. Please try again later."}
          />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-16 h-16" />}
            title={feedMode === 'following' ? "No posts from people you follow" : "No posts yet"}
            description={
              feedMode === 'following'
                ? "Follow some users to see their posts here."
                : "Be the first to create a post!"
            }
          />
        ) : (
          <>
            {filteredPosts.map(post => {
              const isRepost = !!post.repostOf;
              const displayPost = isRepost ? post.repostOf : post;
              
              // Formatting author avatar for displayPost if it was populated but not formatted
              const authorAvatar = displayPost.author?.avatar || 'https://github.com/shadcn.png';
              
              return (
                <SocialCard
                  key={post._id || post.id}
                  id={post._id || post.id}
                  repostedBy={isRepost ? {
                    name: post.author?.name || post.author?.username,
                    username: post.author?.username
                  } : null}
                  author={{
                    name: displayPost.author?.name || displayPost.author?.username || 'Unknown',
                    username: displayPost.author?.username || 'unknown',
                    avatar: authorAvatar,
                    timeAgo: displayPost.createdAt ? getTimeAgo(displayPost.createdAt) : 'Just now',
                  }}
                  content={{
                    text: displayPost.content || displayPost.text || '',
                    media: displayPost.media ? (Array.isArray(displayPost.media) ? displayPost.media : [displayPost.media]) : [],
                    link: displayPost.link,
                  }}
                  engagement={{
                    likes: displayPost.likeCount || 0,
                    comments: displayPost.commentCount || 0,
                    shares: displayPost.repostCount || 0,
                    isLiked: displayPost.isLiked || false,
                    isBookmarked: displayPost.isBookmarked || false,
                  }}
                  permissions={displayPost.permissions}
                  onLike={() => handleLike(displayPost._id || displayPost.id, displayPost.isLiked)}
                  onComment={() => handleAction(displayPost._id || displayPost.id, 'commented')}
                  onShare={() => handleAction(displayPost._id || displayPost.id, 'shared')}
                  onBookmark={() => handleAction(displayPost._id || displayPost.id, 'bookmarked')}
                  onMore={(action) => handleAction(displayPost._id || displayPost.id, action, displayPost.author?._id)}
                >
                     <PostComments 
                        postId={displayPost._id || displayPost.id} 
                        newComment={recentComments[displayPost._id || displayPost.id]}
                     />
                </SocialCard>
              );
            })}
            {loading && <PostSkeleton />}
          </>
        )}
      </div>

      <CommentDialog 
        open={!!replyingTo} 
        onOpenChange={(open) => !open && setReplyingTo(null)}
        onSubmit={handleReplySubmit}
        loading={replying}
      />
    </div>
  );
}
