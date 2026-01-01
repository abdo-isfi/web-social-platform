import React, { useState, useEffect } from 'react';
import { postService } from '@/services/post.service';
import { Button } from '@/components/ui/button'; // Assuming Button component exists or use standard button
import { Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from "@/lib/utils";

export function PostComments({ postId, newComment }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Handle new incoming comment (optimistic or actual from parent)
  useEffect(() => {
    if (newComment && String(newComment.thread) === String(postId)) {
      setComments(prev => {
        // Avoid duplicates if necessary, though simple append is usually fine for "new"
        if (prev.find(c => c._id === newComment._id)) return prev;
        return [...prev, newComment];
      });
      setIsExpanded(true); // Automatically expand when a new comment is added
    }
  }, [newComment, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await postService.getComments(postId, { limit: 10 }); // Fetch more initially but show few
      const { comments: data, pagination } = response;
      
      setComments(data);
      setNextCursor(pagination.nextCursor);
      setHasMore(pagination.hasMore);
      setError(null);
    } catch (err) {
      console.error("Failed to load comments", err);
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  const handeLoadMore = async () => {
    if (!nextCursor) {
        setIsExpanded(true);
        return;
    }
    try {
      setLoadingMore(true);
      const response = await postService.getComments(postId, { 
        limit: 10, 
        cursor: nextCursor 
      });
      const { comments: newData, pagination } = response;

      setComments(prev => [...prev, ...newData]);
      setNextCursor(pagination.nextCursor);
      setHasMore(pagination.hasMore);
      setIsExpanded(true);
      
    } catch (err) {
      console.error("Failed to load more comments", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-4 w-4 text-muted-foreground" /></div>;
  }

  if (comments.length === 0 && !error) {
      return null;
  }

  const displayedComments = isExpanded ? comments : comments.slice(0, 3);

  return (
    <div className="border-t border-border p-4 space-y-4">
        {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No replies yet</p>
        ) : (
            <div className="space-y-4">
                {displayedComments.map(comment => (
                <div key={comment._id} className="flex gap-3">
                    <img 
                        src={comment.author?.avatar || "https://github.com/shadcn.png"} 
                        alt={comment.author?.username} 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{comment.author?.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(comment.createdAt)}
                            </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                </div>
                ))}
            </div>
        )}

      <div className="flex items-center gap-4">
        {(hasMore || (comments.length > 3 && !isExpanded)) && (
            <button 
                onClick={handeLoadMore} 
                disabled={loadingMore}
                className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
            >
                {loadingMore ? 'Loading...' : 'See more comments'}
            </button>
        )}
        
        {isExpanded && comments.length > 3 && (
            <button 
                onClick={() => setIsExpanded(false)} 
                className="text-sm text-muted-foreground hover:underline font-medium"
            >
                See less
            </button>
        )}
      </div>
    </div>
  );
}
