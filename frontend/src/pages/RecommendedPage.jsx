import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SocialCard } from '@/components/ui/social-card';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchRecommendedPosts, createPost, likePost, unlikePost, addComment, bookmarkPost, deletePost, archivePost, clearPosts } from '@/store/slices/postSlice';
import { followerService } from '@/services/follower.service';
import { postService } from '@/services/post.service';
import { Sparkles, MessageSquare } from 'lucide-react';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { cn, formatRelativeTime } from '@/lib/utils';
import { PostComments } from '@/components/feed/PostComments';
import { EditPostModal } from '@/components/modals/EditPostModal';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';

export function RecommendedPage() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { posts, loading, error, hasMore, currentPage } = useSelector(state => state.posts);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  const [recentComments, setRecentComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [justDeletedCommentId, setJustDeletedCommentId] = useState(null);
  const [replying, setReplying] = useState(false);

  // Fetch recommended posts on mount and when auth status changes
  useEffect(() => {
    dispatch(clearPosts());
    if (isAuthenticated) {
      dispatch(fetchRecommendedPosts({ page: 1, limit: 20 }));
    }
  }, [dispatch, isAuthenticated]);

  const handleNewPost = (data) => {
    return requireAuth(() => {
      return dispatch(createPost(data));
    }, 'login');
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

  const handleAction = async (id, action, payload) => {
    requireAuth(async () => {
      if (action === 'commented') {
         if (typeof payload === 'object' && payload.thread) {
             setReplyingTo({ 
                 id: id, 
                 type: 'comment', 
                 threadId: payload.thread,
                 mentionName: `${payload.author?.firstName || ''} ${payload.author?.lastName || ''}`.trim()
             });
         } else {
             setReplyingTo({ id: id, type: 'post', threadId: id });
         }
      } else if (action === 'bookmarked') {
         dispatch(bookmarkPost(id));
      } else if (action === 'delete') {
         setDeletingPostId(id);
      } else if (action === 'edit') {
         const post = posts.find(p => (p._id || p.id) === id);
         setEditingPost(post);
      } else if (action === 'archive') {
         dispatch(archivePost(id));
      } else if (action === 'follow') {
         await followerService.followUser(payload);
         dispatch(fetchRecommendedPosts({ page: 1, limit: 20 }));
      } else if (action === 'unfollow') {
         await followerService.unfollowUser(payload);
         dispatch(fetchRecommendedPosts({ page: 1, limit: 20 }));
      }
    }, 'login');
  };

  const handleReplySubmit = async (content) => {
      if (!replyingTo) return;
      setReplying(true);
      try {
          const { id, type, threadId } = replyingTo;
          const parentCommentId = type === 'comment' ? id : null;
          
          const resultAction = await dispatch(addComment({ 
              postId: threadId, 
              content,
              parentCommentId 
          }));

          if (addComment.fulfilled.match(resultAction)) {
             const { comment } = resultAction.payload;
             setRecentComments(prev => ({
                 ...prev,
                 [threadId]: comment
             }));
          }
          setReplyingTo(null);
      } catch (error) {
          console.error("Failed to reply", error);
      } finally {
          setReplying(false);
      }
  };

  const handleLoadMore = () => {
    dispatch(fetchRecommendedPosts({ page: currentPage + 1, limit: 20 }));
  };

  if (!isAuthenticated || !user?.interests || user.interests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <Sparkles className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Interests Selected</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Select your interests in settings to see personalized recommendations based on hashtags.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0 mt-0">
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
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-16 h-16" />}
            title="No Recommended Posts Yet"
            description="We couldn't find posts matching your interests. Try following more users or check back later!"
          />
        ) : (
          <>
            {posts.map(post => {
              const isRepost = !!post.repostOf;
              const displayPost = isRepost ? post.repostOf : post;
              const authorAvatar = displayPost.author?.avatar?.url || displayPost.author?.avatar || 'https://github.com/shadcn.png';
              
              return (
                <SocialCard
                  key={post._id || post.id}
                  id={post._id || post.id}
                  repostedBy={isRepost ? {
                    name: `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Unknown'
                  } : null}
                  author={{
                    _id: displayPost.author?._id || displayPost.author?.id,
                    name: `${displayPost.author?.firstName || ''} ${displayPost.author?.lastName || ''}`.trim() || 'Unknown',
                    avatar: authorAvatar,
                    timeAgo: displayPost.createdAt ? formatRelativeTime(displayPost.createdAt) : 'Just now',
                    handle: displayPost.author?.handle,
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
                        onReply={(comment) => handleAction(comment._id, 'commented', comment)}
                     />
                </SocialCard>
              );
            })}
            {loading && <PostSkeleton />}
            
            {hasMore && !loading && (
              <div className="flex justify-center py-8">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CommentDialog 
        open={!!replyingTo} 
        onOpenChange={(open) => !open && setReplyingTo(null)}
        onSubmit={handleReplySubmit}
        loading={replying}
        title={replyingTo?.type === 'comment' ? "Reply to comment" : "Reply to post"}
        initialContent={replyingTo?.mentionName ? `@${replyingTo.mentionName} ` : ""}
      />

      <EditPostModal 
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onSuccess={() => {
            dispatch(fetchRecommendedPosts({ page: 1, limit: 20 }));
        }}
      />

      <DeleteAlertModal 
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        onConfirm={async () => {
             await dispatch(deletePost(deletingPostId));
             setDeletingPostId(null);
        }}
        loading={loading}
      />
    </div>
  );
}
