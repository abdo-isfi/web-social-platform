import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/user.service';
import { followerService } from '@/services/follower.service';
import { Link } from 'react-router-dom';

export function RightSidebar() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch if user is authenticated
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const data = await userService.getSuggestions();
        // Backend returns array of users directly after interceptor unwraps it
        setSuggestions(Array.isArray(data) ? data : []); 
      } catch (error) {
        console.error("Failed to load suggestions", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [isAuthenticated]);

  const handleFollow = async (userId) => {
    try {
      await followerService.followUser(userId);
      // Optimistically remove from suggestions
      setSuggestions(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error("Failed to follow user", error);
    }
  };

  const trends = [
    { id: 1, topic: "Technology", posts: "125K posts" },
    { id: 2, topic: "#ReactJS", posts: "85K posts" },
    { id: 3, topic: "Artificial Intelligence", posts: "50K posts" },
  ];

  return (
    <div className="hidden xl:flex flex-col h-[calc(100vh-64px)] sticky top-16 w-[290px] shrink-0 pt-6 pb-8 px-4 border-l border-border/40 gap-8 overflow-y-auto scrollbar-hide">
      
      {/* Search */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Suggested Users - Real Data */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-border/50">
        <h3 className="font-bold text-lg mb-4">Who to follow</h3>
        <div className="flex flex-col gap-4">
          {loading ? (
             <p className="text-sm text-muted-foreground">Loading...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map(user => (
              <div key={user._id} className="flex items-center justify-between">
                <Link to={`/profile/${user._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <img 
                    src={user.avatar || "https://github.com/shadcn.png"} 
                    alt={user.username} 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                  <div className="text-sm">
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-muted-foreground">@{user.username}</p>
                  </div>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-full h-8"
                  onClick={() => handleFollow(user._id)}
                >
                  Follow
                </Button>
              </div>
            ))
          ) : (
             <p className="text-sm text-muted-foreground">No suggestions available.</p>
          )}
        </div>
      </div>

      {/* Trending (Static for now as no backend support) */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-border/50">
        <h3 className="font-bold text-lg mb-4">Trending for you</h3>
        <div className="flex flex-col gap-4">
          {trends.map(trend => (
            <div key={trend.id} className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 -mx-2 rounded-xl transition-colors">
              <p className="text-sm text-muted-foreground">Trending in {trend.topic}</p>
              <p className="font-bold">{trend.topic}</p>
              <p className="text-xs text-muted-foreground">{trend.posts}</p>
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

