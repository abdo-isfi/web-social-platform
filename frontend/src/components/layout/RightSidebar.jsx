import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { fetchSuggestions, followUser } from '@/store/slices/userSlice';
import { Link } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function RightSidebar() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { suggestions, loading } = useSelector(state => state.user);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated && suggestions.length === 0) {
      dispatch(fetchSuggestions());
    }
  }, [isAuthenticated, dispatch, suggestions.length]);

  const handleFollow = (userId) => {
    requireAuth(() => {
      dispatch(followUser(userId));
    }, 'login');
  };

  const trends = [
    { id: 1, topic: "Technology", posts: "125K posts" },
    { id: 2, topic: "#ReactJS", posts: "85K posts" },
    { id: 3, topic: "Artificial Intelligence", posts: "50K posts" },
  ];

  return (
    <div className="flex flex-col w-[290px] shrink-0 pt-0 pb-8 px-4 gap-8">
      
      {/* Search */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full bg-white/10 dark:bg-black/20 border-white/5 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary backdrop-blur-sm transition-all focus:bg-white/20 dark:focus:bg-black/30 placeholder:text-muted-foreground"
        />
      </div>

      {/* Suggested Users - Real Data */}
      <div className="bg-card rounded-[2rem] p-6 border border-border/50 shadow-sm">
        <h3 className="font-bold text-lg mb-5 text-foreground leading-none">
          Who to follow
        </h3>
        <div className="flex flex-col gap-5">
          {loading ? (
             <p className="text-sm text-muted-foreground animate-pulse">Loading suggestions...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map(user => (
              <div key={user._id} className="flex items-center justify-between gap-3 group/item">
                <Link 
                  to={`/profile/${user._id || user.id}`} 
                  className="flex items-center gap-3 hover:opacity-80 transition-all flex-1 min-w-0"
                >
                  <UserAvatar 
                    user={user} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-sm" 
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] text-foreground truncate">{user.name || user.username}</p>
                    <p className="text-muted-foreground text-xs truncate">@{user.username}</p>
                  </div>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-full h-8 px-4 font-bold text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shrink-0"
                  onClick={() => handleFollow(user._id || user.id)}
                >
                  Follow
                </Button>
              </div>
            ))
          ) : (
             <p className="text-sm text-muted-foreground italic">No suggestions available.</p>
          )}
        </div>
      </div>

      {/* Trending (Static for now as no backend support) */}
      <div className="bg-card rounded-[2rem] p-6 border border-border/50 shadow-sm">
        <h3 className="font-bold text-lg mb-5 text-foreground">Trending</h3>
        <div className="flex flex-col gap-2">
          {trends.map(trend => (
            <div key={trend.id} className="cursor-pointer hover:bg-muted/50 p-3 -mx-2 rounded-2xl transition-all duration-200 group">
              <p className="text-xs text-muted-foreground font-medium mb-1">Trending in {trend.topic}</p>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{trend.topic}</p>
              <p className="text-xs text-muted-foreground mt-1">{trend.posts}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground px-2">
        © 2025 Social App. All rights reserved.
      </div>
    </div>
  );
}

