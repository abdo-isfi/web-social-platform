import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SocialCard } from '@/components/ui/social-card';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchPosts, createPost, likePost, unlikePost, addComment, bookmarkPost } from '@/store/slices/postSlice';
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
      dispatch(createPost({
        content: data.content,
        media: data.media,
      }));
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

  const handleAction = (id, action) => {
    requireAuth(() => {
      if (action === 'commented') {
         setReplyingTo(id);
      } else if (action === 'bookmarked') {
         dispatch(bookmarkPost(id));
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

  return (
    <div className="space-y-0 -mt-6">
      {/* Feed Filter Mini Navbar */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 flex items-center justify-center py-3 px-4 shadow-sm">
        <div className="flex items-center bg-muted/50 p-1 rounded-full border border-border/50 w-full max-w-[320px]">
           <button 
             onClick={() => handleFeedModeChange('public')}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-sm font-semibold transition-all",
               feedMode === 'public' 
                 ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                 : "text-muted-foreground hover:text-foreground"
             )}
           >
             <LayoutGrid className="w-4 h-4" />
             Public
           </button>
           <button 
             onClick={() => handleFeedModeChange('following')}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-sm font-semibold transition-all",
               feedMode === 'following' 
                 ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                 : "text-muted-foreground hover:text-foreground"
             )}
           >
             <Users className="w-4 h-4" />
             Following
           </button>
        </div>
      </div>

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
                  onLike={() => handleLike(displayPost._id || displayPost.id, displayPost.isLiked)}
                  onComment={() => handleAction(displayPost._id || displayPost.id, 'commented')}
                  onShare={() => handleAction(displayPost._id || displayPost.id, 'shared')}
                  onBookmark={() => handleAction(displayPost._id || displayPost.id, 'bookmarked')}
                  onMore={() => handleAction(displayPost._id || displayPost.id, 'more')}
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
