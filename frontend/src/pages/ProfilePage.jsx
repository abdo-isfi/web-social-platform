import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SocialCard } from '@/components/ui/social-card';
import { userService } from '@/services/user.service';
import { followerService } from '@/services/follower.service';
import { cn } from '@/lib/utils';
import { MapPin, Link as LinkIcon, Calendar, MessageSquare, Lock } from 'lucide-react';

export function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useSelector(state => state.auth);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = isAuthenticated && (id === 'me' || id === (currentUser?._id || currentUser?.id));
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if following
  useEffect(() => {
    if (profile && currentUser && !isOwnProfile) {
       // Ideally the profile endpoint should return "isFollowing" boolean
       // If not, we might need to check the "following" list or followers list of the user
       // For now, let's assume we can rely on a field or fetch status.
       // Let's assume profile has isFollowing property populated by backend logic if authenticated
       // OR we fetch our following list and check.
       // Simplest: Check if our ID is in profile.followers list if available, or just use a boolean from backend.
       // For MVP, defaulting to false or checking generic field.
       setIsFollowing(profile.isFollowing || false);
    }
  }, [profile, currentUser, isOwnProfile]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing || profile.followStatus === 'PENDING') {
        await followerService.unfollowUser(profile._id);
        setIsFollowing(false);
        setProfile(prev => ({ 
            ...prev, 
            followersCount: Math.max(0, (isFollowing ? prev.followersCount - 1 : prev.followersCount)),
            isFollowing: false,
            followStatus: null
        }));
      } else {
        const response = await followerService.followUser(profile._id);
        const status = response.data?.status || (profile.isPrivate ? 'PENDING' : 'ACCEPTED');
        
        if (status === 'ACCEPTED') {
            setIsFollowing(true);
            setProfile(prev => ({ 
                ...prev, 
                followersCount: (prev.followersCount || 0) + 1,
                isFollowing: true,
                followStatus: 'ACCEPTED'
            }));
        } else {
            setProfile(prev => ({ 
                ...prev, 
                followStatus: 'PENDING'
            }));
        }
      }
    } catch (error) {
      console.error("Follow toggle failed", error);
    }
  };
  const fetchProfileData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const userId = id === 'me' ? (currentUser?._id || currentUser?.id) : id;
      if (!userId) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const profileData = await userService.getProfile(userId);
      setProfile(profileData);

      // Fetch user posts
      const userPosts = await userService.getUserPosts(userId);
      setPosts(userPosts || []);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    if (isAuthenticated || id !== 'me') {
      fetchProfileData();
    } else {
      setLoading(false);
      setError('Please log in to view your profile');
    }
  }, [id, currentUser, isAuthenticated, fetchProfileData]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-60 bg-muted rounded-t-3xl" />
          <div className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        </div>
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-16 h-16" />}
        title="Unable to load profile"
        description={error || "This profile could not be found."}
      />
    );
  }

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
                  src={profile.avatar || 'https://github.com/shadcn.png'} 
                  alt={profile.name} 
                  className="w-full h-full rounded-full object-cover border-4 border-background" 
                />
              </div>
              
              {/* Action Button - Right Aligned */}
              <div className="mt-[4.5rem] sm:mt-[5.5rem]">
                {isOwnProfile ? (
                  <Button 
                    variant="outline" 
                    className="rounded-full font-bold border px-5 py-2 hover:bg-muted/50 transition-colors"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Edit profile
                  </Button>
                ) : (
                  <Button 
                    className={cn(
                      "rounded-full font-bold px-5 py-2 transition-colors",
                      isFollowing || profile.followStatus === 'PENDING'
                        ? "bg-transparent border border-border text-foreground hover:border-red-500 hover:text-red-500 hover:bg-red-500/10" 
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? 'Unfollow' : profile.followStatus === 'PENDING' ? 'Requested' : 'Follow'}
                  </Button>
                )}
              </div>
            </div>

            {/* Text Info - Left Aligned */}
            <div className="flex flex-col items-start space-y-3 mt-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-2xl font-black leading-tight tracking-tight">{profile.name || profile.username}</h1>
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
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {profile.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 mt-2 text-sm">
                <span className="hover:underline cursor-pointer flex gap-1 items-center">
                  <strong className="text-foreground">{profile.followingCount || 0}</strong> 
                  <span className="text-muted-foreground">Following</span>
                </span>
                <span className="hover:underline cursor-pointer flex gap-1 items-center">
                  <strong className="text-foreground">{profile.followersCount || 0}</strong> 
                  <span className="text-muted-foreground">Followers</span>
                </span>
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

        {/* Posts Section */}
        <div className="space-y-6 mt-6 pb-20 px-4">
          {profile.isPrivateView ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/60 max-w-2xl mx-auto">
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-muted-foreground" />
               </div>
               <h3 className="text-xl font-bold mb-2">These posts are protected</h3>
               <p className="text-muted-foreground text-center max-w-xs">
                  Only approved followers can see @{profile.username}'s posts. Click Follow to send a request.
               </p>
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12" />}
              title="No posts yet"
              description={isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
            />
          ) : (
            posts.map(post => (
              <SocialCard 
                key={post._id || post.id}
                id={post._id || post.id}
                author={{
                  name: profile.name || profile.username,
                  username: profile.username,
                  avatar: profile.avatar || 'https://github.com/shadcn.png',
                  timeAgo: post.createdAt ? getTimeAgo(post.createdAt) : 'Just now',
                }}
                content={{
                  text: post.content || post.text || '',
                  media: post.media || [],
                }}
                engagement={{
                  likes: post.likeCount || 0,
                  comments: post.commentCount || 0,
                  shares: post.shares || 0,
                  isLiked: post.isLiked || false,
                  isBookmarked: post.isBookmarked || false,
                }}
                className="max-w-2xl mx-auto"
              />
            ))
          )}
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={fetchProfileData}
      />
    </>
  );
}

// Helper function
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
