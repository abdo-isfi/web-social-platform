import React, { useState } from 'react';
import { SocialCard } from '@/components/ui/social-card';
import { CreatePost } from '@/components/feed/CreatePost';
import { Link as LinkIcon } from "lucide-react";
import { useAuthGuard } from '@/hooks/useAuthGuard';

import { useSelector } from 'react-redux';

export function Feed() {
  const requireAuth = useAuthGuard();
  const { feedMode } = useSelector(state => state.ui);

  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: "Dorian Baffier",
        username: "dorian_baffier",
        avatar: "https://github.com/shadcn.png",
        timeAgo: "2h ago",
      },
      content: {
        text: "Just launched Kokonut UI! Check out the documentation and let me know what you think 🎨. Built with React and Tailwind CSS.",
        link: {
          title: "Kokonut UI Documentation",
          description: "A comprehensive guide to Kokonut UI",
          icon: <LinkIcon className="w-5 h-5 text-blue-500" />,
        },
      },
      engagement: {
        likes: 128,
        comments: 32,
        shares: 24,
        isLiked: false,
        isBookmarked: false,
      },
    },
    {
      id: 2,
      author: {
        name: "Sarah Connor",
        username: "sarahc",
        avatar: "https://i.pravatar.cc/150?u=4",
        timeAgo: "4h ago",
      },
      content: {
        text: "The future is not set. There is no fate but what we make for ourselves. Also, loving the new React 19 features! 🤖 #coding #reactjs",
      },
      engagement: {
        likes: 842,
        comments: 156,
        shares: 92,
        isLiked: true,
        isBookmarked: true,
      },
    },
     {
      id: 3,
      author: {
        name: "Alex Chen",
        username: "alexc",
        avatar: "https://i.pravatar.cc/150?u=8",
        timeAgo: "6h ago",
      },
      content: {
        text: "Just pushed the new authentication flow to production. Modal-based auth is definitely the way to go for better UX context retention. 🔐",
      },
      engagement: {
        likes: 45,
        comments: 12,
        shares: 5,
        isLiked: false,
        isBookmarked: false,
      },
    }
  ]);

  const handleAction = (id, action) => {
    requireAuth(() => {
      console.log(`Card ${id}: ${action}`);
      if (action === 'liked') {
         setPosts(current => current.map(post => {
           if (post.id === id) {
             const newIsLiked = !post.engagement.isLiked;
             return {
               ...post,
               engagement: {
                 ...post.engagement,
                 isLiked: newIsLiked,
                 likes: newIsLiked ? post.engagement.likes + 1 : post.engagement.likes - 1
               }
             };
           }
           return post;
         }));
      }
    }, 'login');
  };

  const handleNewPost = (data) => {
    requireAuth(() => {
        const newPost = {
            id: Date.now(),
            author: {
                name: "Current User", // In real app, get from Redux
                username: "currentuser",
                avatar: "https://github.com/shadcn.png",
                timeAgo: "Just now"
            },
            content: {
                text: data.content,
                media: data.media // Pass media if needed by SocialCard (not supported yet, but robust)
            },
            engagement: {
                likes: 0,
                comments: 0,
                shares: 0,
                isLiked: false,
                isBookmarked: false
            }
        };
        setPosts(prev => [newPost, ...prev]);
    }, 'login');
  };

  return (
    <div className="space-y-6">
      {/* Create Post Input (Placeholder) */}
      <CreatePost onPost={handleNewPost} />

      {posts
        .filter(post => {
          if (feedMode === 'following') {
            // Mock logic: Show only even IDs for restricted feel
            return post.id % 2 === 0;
          }
          return true;
        })
        .map(post => (
        <SocialCard
          key={post.id}
          {...post}
          onLike={() => handleAction(post.id, 'liked')}
          onComment={() => handleAction(post.id, 'commented')}
          onShare={() => handleAction(post.id, 'shared')}
          onBookmark={() => handleAction(post.id, 'bookmarked')}
          onMore={() => handleAction(post.id, 'more')} 
        />
      ))}
      
      {feedMode === 'following' && posts.filter(p => p.id % 2 === 0).length === 0 && (
         <div className="text-center py-12 text-muted-foreground">
           <p>You aren't following anyone yet.</p>
         </div>
      )}
      
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>You've reached the end of the demo feed.</p>
      </div>
    </div>
  );
}
