import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SocialCard } from '@/components/ui/social-card';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchPosts, createPost, likePost, unlikePost, addComment, bookmarkPost } from '@/store/slices/postSlice';
import { MessageSquare, LayoutGrid, Users } from 'lucide-react';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { postService } from '@/services/post.service';
import { setFeedMode } from '@/store/slices/uiSlice';
import { cn } from '@/lib/utils';
import { PostComments } from '@/components/feed/PostComments';

export function Feed() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { feedMode } = useSelector(state => state.ui);
  const { posts, loading, error } = useSelector(state => state.posts);
  const { user } = useSelector(state => state.auth);

  // Fetch posts on mount
  useEffect(() => {
    dispatch(fetchPosts({ page: 1, limit: 20 }));
  }, [dispatch]);

  const [recentComments, setRecentComments] = React.useState({});

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

  const [replyingTo, setReplyingTo] = React.useState(null);
  const [replying, setReplying] = React.useState(false);

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
      console.log('Submitting reply to:', replyingTo, 'Content:', content);
      try {
          // Dispatch comment action
          const resultAction = await dispatch(addComment({ postId: replyingTo, content }));
          if (addComment.fulfilled.match(resultAction)) {
             // resultAction.payload is { postId, comment }
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

  // Filter posts based on feed mode
  const filteredPosts = feedMode === 'following'
    ? posts.filter(post => post.author?.isFollowing)
    : posts;

  // Main render
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

        {/* Conditional Content */}
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
            {filteredPosts.map(post => (
              <SocialCard
                key={post._id || post.id}
                id={post._id || post.id}
                author={{
                  name: post.author?.name || post.author?.username || 'Unknown',
                  username: post.author?.username || 'unknown',
                  avatar: post.author?.avatar || 'https://github.com/shadcn.png',
                  timeAgo: post.createdAt ? getTimeAgo(post.createdAt) : 'Just now',
                }}
                content={{
                  text: post.content || post.text || '',
                  media: post.media || [],
                  link: post.link,
                }}
                engagement={{
                  likes: post.likeCount || 0,
                  comments: post.commentCount || 0,
                  shares: post.shares || 0,
                  isLiked: post.isLiked || false,
                  isBookmarked: post.isBookmarked || false,
                }}
                onLike={() => handleLike(post._id || post.id, post.isLiked)}
                onComment={() => handleAction(post._id || post.id, 'commented')}
                onShare={() => handleAction(post._id || post.id, 'shared')}
                onBookmark={() => handleAction(post._id || post.id, 'bookmarked')}
                onMore={() => handleAction(post._id || post.id, 'more')}
              >
                   <PostComments 
                      postId={post._id || post.id} 
                      newComment={recentComments[post._id || post.id]}
                   />
              </SocialCard>
            ))}
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
