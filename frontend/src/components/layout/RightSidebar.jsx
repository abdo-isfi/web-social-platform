import React from 'react';
import { Button } from '@/components/ui/button';

export function RightSidebar() {
  const suggestions = [
    { id: 1, name: "Sarah Connor", username: "sarahc", avatar: "https://i.pravatar.cc/150?u=4" },
    { id: 2, name: "John Smith", username: "jsmith", avatar: "https://i.pravatar.cc/150?u=5" },
    { id: 3, name: "Alice Wonderland", username: "alice_w", avatar: "https://i.pravatar.cc/150?u=6" },
  ];

  const trends = [
    { id: 1, topic: "Technology", posts: "125K posts" },
    { id: 2, topic: "#ReactJS", posts: "85K posts" },
    { id: 3, topic: "Artificial Intelligence", posts: "50K posts" },
  ];

  return (
    <div className="hidden xl:flex flex-col h-[calc(100vh-64px)] sticky top-16 w-[290px] shrink-0 pt-6 pb-8 px-4 border-l border-border/40 gap-8 overflow-y-auto scrollbar-hide">
      
      {/* Search (Optional placeholder) */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Suggested Users */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-border/50">
        <h3 className="font-bold text-lg mb-4">Who to follow</h3>
        <div className="flex flex-col gap-4">
          {suggestions.map(user => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                <div className="text-sm">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-full h-8">Follow</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
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

