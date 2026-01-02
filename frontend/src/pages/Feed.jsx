import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SocialCard } from '@/components/ui/social-card';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchPosts, createPost, likePost, unlikePost, addComment, bookmarkPost, deletePost, archivePost } from '@/store/slices/postSlice';
import { followerService } from '@/services/follower.service';
import { MessageSquare, LayoutGrid, Users } from 'lucide-react';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { setFeedMode } from '@/store/slices/uiSlice';
import { cn } from '@/lib/utils';
import { PostComments } from '@/components/feed/PostComments';
import { EditPostModal } from '@/components/modals/EditPostModal';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';

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
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
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
    return requireAuth(() => {
      return dispatch(createPost(data));
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
         setDeletingPostId(id);
      } else if (action === 'edit') {
         // Find the post object to pass to modal
         const post = posts.find(p => (p._id || p.id) === id);
         setEditingPost(post);
      } else if (action === 'archive') {
         dispatch(archivePost(id));
      } else if (action === 'follow') {
         await followerService.followUser(authorId);
         dispatch(fetchPosts({ page: 1, limit: 10, mode: feedMode === 'public' ? 'discover' : 'following' }));
      } else if (action === 'unfollow') {
         await followerService.unfollowUser(authorId);
         dispatch(fetchPosts({ page: 1, limit: 10, mode: feedMode === 'public' ? 'discover' : 'following' }));
      }
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

  return (
    <div className="space-y-0 mt-0">
      {/* Feed Container */}
      <div className="flex flex-col gap-[2px]">
        <div className="px-0 py-6">
          <CreatePost onPost={handleNewPost} />
        </div>

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
                    _id: displayPost.author?._id || displayPost.author?.id,
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

      <EditPostModal 
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onSuccess={(updatedPost) => {
            // Refresh feed or update local state
            // fetchPosts will refresh everything, or we can assume redux handles it if we dipatch an action? 
            // postService.updatePost returns updated data. We probably want to update Redux store.
            // Ideally we should dispatch an action 'postUpdated'.
            // For now, re-fetching current page or updating list in Redux is needed.
            // Since we don't have updatePost action in slice that takes payload directly to update state (we have async thunk but we called service directly in modal),
            // we can trigger a fetch or just let it be if user refreshes. 
            // Better: Dispatch fetchPosts or make updatePost an async thunk in slice that handles update.
            // But modal handles service call.
            // Let's just refresh feed for simplicity or maybe dispatch an action if available.
            // Actually, we can dispatch fetchPosts to refresh.
            dispatch(fetchPosts({ page: 1, limit: 20, mode: feedMode === 'public' ? 'discover' : 'following' }));
        }}
      />

      <DeleteAlertModal 
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        onConfirm={async () => {
             await dispatch(deletePost(deletingPostId));
             setDeletingPostId(null);
        }}
        loading={status === 'loading'}
      />
    </div>
  );
}
