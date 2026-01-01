import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bookmark, MessageSquare } from 'lucide-react';
import { SocialCard } from '@/components/ui/social-card';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchBookmarkedPosts, likePost, unlikePost, bookmarkPost, addComment, deletePost, archivePost } from '@/store/slices/postSlice';
import { followerService } from '@/services/follower.service';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { PostComments } from '@/components/feed/PostComments';

export function BookmarksPage() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { posts, loading, error } = useSelector(state => state.posts);
  
  // State for comments
  const [activeCommentId, setActiveCommentId] = React.useState(null);
  const [replying, setReplying] = React.useState(false);
  const [recentComments, setRecentComments] = React.useState({});

  useEffect(() => {
    dispatch(fetchBookmarkedPosts({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleLike = (postId, isLiked) => {
    requireAuth(() => {
      if (isLiked) {
        dispatch(unlikePost(postId));
      } else {
        dispatch(likePost(postId));
      }
    }, 'login');
  };

  const handleAction = (id, action, authorId) => {
    requireAuth(async () => {
      if (action === 'commented') {
         setActiveCommentId(id);
      } else if (action === 'bookmarked') {
         dispatch(bookmarkPost(id));
      } else if (action === 'delete') {
         dispatch(deletePost(id));
      } else if (action === 'archive') {
         dispatch(archivePost(id));
      } else if (action === 'follow') {
         await followerService.followUser(authorId);
         dispatch(fetchBookmarkedPosts({ page: 1, limit: 20 }));
      } else if (action === 'unfollow') {
         await followerService.unfollowUser(authorId);
         dispatch(fetchBookmarkedPosts({ page: 1, limit: 20 }));
      } else if (action === 'report') {
         // console.log(`Reported post ${id}`);
      }
      // console.log(`Post ${id}: ${action}`);
    }, 'login');
  };

  const handleReplySubmit = async (content) => {
      if (!activeCommentId) return;
      setReplying(true);
      try {
          const resultAction = await dispatch(addComment({ postId: activeCommentId, content }));
          if (addComment.fulfilled.match(resultAction)) {
             const { comment } = resultAction.payload;
             setRecentComments(prev => ({
                 ...prev,
                 [activeCommentId]: comment
             }));
          }
          setActiveCommentId(null);
      } catch (error) {
          console.error("Failed to reply", error);
      } finally {
          setReplying(false);
      }
  };


  if (loading && posts.length === 0) {
    return (
      <div className="w-full flex flex-col gap-[2px]">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
            <h1 className="text-xl font-bold">Bookmarks</h1>
            <p className="text-sm text-muted-foreground">Saved posts</p>
        </div>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (error) {
      return (
        <div className="w-full">
             <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4 mb-6">
                <h1 className="text-xl font-bold">Bookmarks</h1>
                <p className="text-sm text-muted-foreground">Saved posts</p>
            </div>
            <EmptyState
              icon={<Bookmark className="w-16 h-16" />}
              title="Unable to load bookmarks"
              description={error || "Please try again later."}
            />
        </div>
      )
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="w-full">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
              <h1 className="text-xl font-bold">Bookmarks</h1>
              <p className="text-sm text-muted-foreground">Saved posts</p>
          </div>

          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground mt-10">
              <div className="bg-muted/50 p-6 rounded-full mb-4">
                  <Bookmark className="w-12 h-12 stroke-1" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Save posts for later</h2>
              <p className="max-w-sm">Bookmark posts to easily find them again in the future.</p>
          </div>
      </div>
    );
  }

  return (
      <div className="w-full py-6 px-0 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0">
                      <Bookmark className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black tracking-tight">Bookmarks</h1>
                      <p className="text-[13px] font-medium text-muted-foreground/70">
                          {posts.length} saved posts
                      </p>
                  </div>
              </div>
          </div>

          <div className="flex flex-col gap-[2px]">

          {posts.map(post => (
            <SocialCard
              key={post._id || post.id}
              id={post._id || post.id}
              author={{
                name: post.author?.name || post.author?.username || 'Unknown',
                username: post.author?.username || 'unknown',
                avatar: post.author?.avatar || 'https://github.com/shadcn.png',
                timeAgo: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now',
              }}
              content={{
                text: post.content || '',
                media: post.media ? (Array.isArray(post.media) ? post.media : [post.media]) : [],
                link: post.link,
              }}
              engagement={{
                likes: post.likeCount || 0,
                comments: post.commentCount || 0,
                shares: post.repostCount || 0,
                isLiked: post.isLiked || false,
                isBookmarked: post.isBookmarked ?? true,
              }}
              permissions={post.permissions}
              onLike={() => handleLike(post._id || post.id, post.isLiked)}
              onComment={() => handleAction(post._id || post.id, 'commented')}
              onShare={() => handleAction(post._id || post.id, 'shared')}
              onBookmark={() => handleAction(post._id || post.id, 'bookmarked')}
              onMore={(action) => handleAction(post._id || post.id, action, post.author?._id)}
            >
                 <PostComments 
                    postId={post._id || post.id} 
                    newComment={recentComments[post._id || post.id]}
                 />
            </SocialCard>
          ))}
          </div>

        <CommentDialog 
            open={!!activeCommentId} 
            onOpenChange={(open) => !open && setActiveCommentId(null)}
            onSubmit={handleReplySubmit}
            loading={replying}
        />
      </div>
  );
}
