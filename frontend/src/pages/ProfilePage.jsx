import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { cn } from '@/lib/utils';
import { MapPin, Link as LinkIcon, Calendar } from 'lucide-react';
import { SocialCard } from '@/components/ui/social-card';

const MOCK_POSTS = [
  {
    id: 1,
    author: {
      name: "John Doe",
      username: "johndoe",
      avatar: "https://github.com/shadcn.png",
      timeAgo: "2h"
    },
    content: {
      text: "Just updated my profile with this awesome new banner! 🎨 loving the new features."
    },
    engagement: {
      likes: 42,
      comments: 12,
      shares: 5,
      isLiked: true
    }
  },
  {
    id: 2,
    author: {
      name: "John Doe",
      username: "johndoe",
      avatar: "https://github.com/shadcn.png",
      timeAgo: "5h"
    },
    content: {
      text: "Working on some cool React components today. Tailwind CSS makes styling so much faster! 🚀 #coding #webdev"
    },
    engagement: {
      likes: 128,
      comments: 34,
      shares: 15,
      isLiked: false
    }
  }
];

export function ProfilePage() {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Use real user data if logged in, otherwise mock/guest data
  const profile = isAuthenticated && user ? user : {
    id: 'guest',
    name: "Guest User",
    username: "guest",
    bio: "Please log in to see your full profile.",
    followers: 0,
    following: 0,
    avatar: "https://github.com/shadcn.png" {isOwnProfile && (
                 <div
  };

  const isOwnProfile = isAuthenticated && user?.id; // Simplified check for /profile/me context

  return (
    <>
      <div className="space-y-6">
        {/* Profile Header Layout */}
        <div className="relative flex flex-col">
          {/* Banner */}
          <div className="h-48 sm:h-52 md:h-60 w-full overflow-hidden shrink-0 relative">
             {profile.banner ? (
               <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500" />
             )}
          </div>
          
          {/* Info Section */}
          <div className="px-4 pb-4">
             {/* Top Row: Avatar and Edit Button */}
             <div className="flex justify-between items-start -mt-[4rem] sm:-mt-[5rem] mb-3">
               {/* Avatar Container */}
               <div className="p-1 bg-background rounded-full relative z-10 w-32 h-32 sm:w-40 sm:h-40">
                  <img 
                    src={profile.avatar} 
                    alt={profile.name} 
                    className="w-full h-full rounded-full object-cover border-4 border-background" 
                  />
               </div>
               
               {/* Action Button - Right Aligned */}
               {isOwnProfile && (
                 <div className="mt-[4.5rem] sm:mt-[5.5rem]">
                   <Button 
                     variant="outline" 
                     className="rounded-full font-bold border px-5 py-2 hover:bg-muted/50 transition-colors"
                     onClick={() => setIsEditModalOpen(true)}
                   >
                     Edit profile
                   </Button>
                 </div>
               )}
             </div>

             {/* Text Info - Left Aligned */}
             <div className="flex flex-col items-start space-y-3 mt-2">
               <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-2xl font-black leading-tight tracking-tight">{profile.name}</h1>
                  </div>
                  <p className="text-muted-foreground">@{profile.username || 'username'}</p>
               </div>
               
               {profile.bio && (
                  <p className="text-base leading-relaxed max-w-2xl whitespace-pre-wrap">{profile.bio}</p>
               )}
               
               <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground text-sm items-center">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{profile.website.replace(/^https?:\/\//, '')}</a>
                    </div>
                  )}
                  {profile.birthday && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Born {new Date(profile.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                    </div>
                  )}
                   <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined September 2023</span>
                   </div>
               </div>
               
               <div className="flex gap-4 mt-2 text-sm">
                 <span className="hover:underline cursor-pointer flex gap-1 items-center"><strong className="text-foreground">{profile.following || 0}</strong> <span className="text-muted-foreground">Following</span></span>
                 <span className="hover:underline cursor-pointer flex gap-1 items-center"><strong className="text-foreground">{profile.followers || 0}</strong> <span className="text-muted-foreground">Followers</span></span>
               </div>
             </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex border-b border-border mt-2">
           <div className="px-6 py-3 border-b-2 border-primary font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors">Posts</div>
           <div className="px-6 py-3 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">Replies</div>
           <div className="px-6 py-3 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">Likes</div>
        </div>

        <div className="space-y-6 mt-6 pb-20">
          {MOCK_POSTS.map(post => (
            <SocialCard 
              key={post.id}
              author={post.author}
              content={post.content}
              engagement={post.engagement}
              className="max-w-2xl mx-auto"
            />
          ))}
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </>
  );
}
