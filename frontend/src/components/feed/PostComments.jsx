import React, { useState, useEffect } from 'react';
import { postService } from '@/services/post.service';
import { Button } from '@/components/ui/button'; // Assuming Button component exists or use standard button
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export function PostComments({ postId, newComment }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Handle new incoming comment (optimistic or actual from parent)
  useEffect(() => {
    if (newComment && String(newComment.parentThread) === String(postId)) {
      setComments(prev => {
        // Avoid duplicates if necessary, though simple append is usually fine for "new"
        if (prev.find(c => c._id === newComment._id)) return prev;
        return [...prev, newComment];
      });
    }
  }, [newComment, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await postService.getComments(postId, { limit: 3 });
      const { comments: data, pagination } = response; // Adjust based on API response structure
      
      setComments(data);
      setNextCursor(pagination.nextCursor);
      setHasMore(pagination.hasMore || (pagination.totalComments > data.length)); // Fallback logic
      setError(null);
    } catch (err) {
      console.error("Failed to load comments", err);
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  const handeLoadMore = async () => {
    if (!nextCursor) return;
    try {
      setLoadingMore(true);
      const response = await postService.getComments(postId, { 
        limit: 5, 
        cursor: nextCursor 
      });
      const { comments: newData, pagination } = response;

      setComments(prev => [...prev, ...newData]);
      setNextCursor(pagination.nextCursor);
      // Update hasMore. If we received fewer than limit, or backend says so.
      // Backend pagination object now has 'hasMore' from my previous edit?
      // Yes, I added 'hasMore' to backend response.
      setHasMore(pagination.hasMore);
      
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
     return null; // Or show "No comments yet" if desired, but user said "No comments -> show 'No replies yet'?" 
     // Prompt: "No comments -> show 'No replies yet'"
     // But usually we hide the section if empty to save space, or show a placeholder.
     // Let's return a small text.
  }

  return (
    <div className="border-t border-border p-4 space-y-4">
        {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No replies yet</p>
        ) : (
            <div className="space-y-4">
                {comments.map(comment => (
                <div key={comment._id} className="flex gap-3">
                    <img 
                        src={comment.author?.avatar || "https://github.com/shadcn.png"} 
                        alt={comment.author?.username} 
                        className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{comment.author?.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                </div>
                ))}
            </div>
        )}

      {hasMore && (
        <button 
          onClick={handeLoadMore} 
          disabled={loadingMore}
          className="text-sm text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
        >
          {loadingMore ? 'Loading...' : 'See more comments'}
        </button>
      )}
    </div>
  );
}
