import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SocialCard } from '@/components/ui/social-card';
import { userService } from '@/services/user.service';
import { followerService } from '@/services/follower.service';
import { postService } from '@/services/post.service';
import { cn } from '@/lib/utils';
import { MapPin, Link as LinkIcon, Calendar, MessageSquare, Lock } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export function ProfilePage() {
  const dispatch = useDispatch();
  const { requireAuth } = useAuthGuard();
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useSelector(state => state.auth);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = isAuthenticated && (id === 'me' || id === (currentUser?._id || currentUser?.id));
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if following
  useEffect(() => {
    if (profile && currentUser && !isOwnProfile) {
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

  const fetchLikedPosts = async () => {
    try {
        setLoadingLikes(true);
        const response = await postService.getLikedThreads(1, 40);
        setLikedPosts(response.threads || response || []);
    } catch (error) {
        console.error("Failed to fetch likes", error);
    } finally {
        setLoadingLikes(false);
    }
  };

  const fetchProfileData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = id === 'me' ? (currentUser?._id || currentUser?.id) : id;
      if (!userId) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const profileData = await userService.getProfile(userId);
      setProfile(profileData);

      const userPosts = await userService.getUserPosts(userId);
      setPosts(userPosts || []);
      
      if (activeTab === 'likes' && (isOwnProfile || !profileData.isPrivate)) {
          fetchLikedPosts();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser, activeTab, isOwnProfile]);

  useEffect(() => {
    if (isAuthenticated || id !== 'me') {
      fetchProfileData();
    } else {
      setLoading(false);
      setError('Please log in to view your profile');
    }
  }, [id, currentUser, isAuthenticated, fetchProfileData]);

  useEffect(() => {
      if (activeTab === 'likes' && likedPosts.length === 0 && profile && !profile.isPrivateView) {
          fetchLikedPosts();
      }
  }, [activeTab, profile]);

  const handleLike = async (postId, currentlyLiked) => {
    requireAuth(async () => {
      try {
        if (currentlyLiked) {
          await postService.unlikePost(postId);
        } else {
          await postService.likePost(postId);
        }
        
        const updateList = (list) => list.map(p => {
          let updatedP = { ...p };
          if (updatedP._id === postId) {
            updatedP.isLiked = !currentlyLiked;
            updatedP.likeCount = currentlyLiked ? Math.max(0, updatedP.likeCount - 1) : (updatedP.likeCount || 0) + 1;
          }
          if (updatedP.repostOf && updatedP.repostOf._id === postId) {
            updatedP.repostOf.isLiked = !currentlyLiked;
            updatedP.repostOf.likeCount = currentlyLiked ? Math.max(0, updatedP.repostOf.likeCount - 1) : (updatedP.repostOf.likeCount || 0) + 1;
          }
          return updatedP;
        });

        setPosts(prev => updateList(prev));
        setLikedPosts(prev => updateList(prev));
      } catch (error) {
        console.error("Like failed", error);
      }
    });
  };

  const handleAction = async (postId, action, authorId) => {
    requireAuth(async () => {
        if (action === 'bookmarked') {
            const response = await postService.bookmarkPost(postId);
            const updateList = (list) => list.map(p => {
                let updatedP = { ...p };
                if (updatedP._id === postId) updatedP.isBookmarked = response.isBookmarked;
                if (updatedP.repostOf && updatedP.repostOf._id === postId) updatedP.repostOf.isBookmarked = response.isBookmarked;
                return updatedP;
            });
            setPosts(prev => updateList(prev));
            setLikedPosts(prev => updateList(prev));
        } else if (action === 'delete' || action === 'archive') {
            if (action === 'delete') await postService.deletePost(postId);
            else await postService.archivePost(postId);
            
            setPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
            setLikedPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
            if (isOwnProfile) {
              setProfile(prev => ({ ...prev, postsCount: Math.max(0, (prev.postsCount || 0) - 1) }));
            }
        } else if (action === 'follow' || action === 'unfollow') {
            if (action === 'follow') await followerService.followUser(authorId);
            else await followerService.unfollowUser(authorId);
            fetchProfileData();
        }
    });
  };

  const filteredPosts = posts.filter(post => {
    const isReply = !!(post.repostOf ? post.repostOf.parentThread : post.parentThread);
    if (activeTab === 'posts') return !isReply;
    if (activeTab === 'replies') return isReply;
    return false;
  });

  const displayList = activeTab === 'likes' ? likedPosts : filteredPosts;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-60 bg-muted rounded-t-3xl" />
          <div className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        </div>
        <PostSkeleton />
      </div>
    );
  }

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
        <div className="relative flex flex-col">
          <div className="h-48 sm:h-52 md:h-60 w-full relative">
            {profile.banner ? (
              <img src={profile.banner} alt="Banner" className="w-full h-full object-cover rounded-t-3xl" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-3xl" />
            )}
          </div>
          
          <div className="px-4 pb-4">
            <div className="flex justify-between items-start -mt-[4rem] sm:-mt-[5rem] mb-3">
              <div className="p-1 bg-background rounded-full relative z-10 w-32 h-32 sm:w-40 sm:h-40">
                <img 
                  src={profile.avatar || 'https://github.com/shadcn.png'} 
                  alt={profile.name} 
                  className="w-full h-full rounded-full object-cover border-4 border-background" 
                />
              </div>
              
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
                        ? "bg-transparent border border-border text-foreground hover:border-red-500 hover:text-red-500" 
                        : "bg-primary text-primary-foreground"
                    )}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? 'Unfollow' : profile.followStatus === 'PENDING' ? 'Requested' : 'Follow'}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start space-y-3 mt-2">
              <div>
                <h1 className="text-2xl font-black">{profile.name || profile.username}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
              
              {profile.bio && <p className="text-base max-w-2xl">{profile.bio}</p>}
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground text-sm">
                {profile.location && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span>{profile.location}</span></div>}
                {profile.createdAt && <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span></div>}
              </div>
              
              <div className="flex gap-4 mt-2 text-sm">
                <span><strong className="text-foreground">{profile.followingCount || 0}</strong> Following</span>
                <span><strong className="text-foreground">{profile.followersCount || 0}</strong> Followers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-border mt-2">
          {['posts', 'replies', 'likes'].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-4 font-medium transition-all relative cursor-pointer hover:bg-muted/30 capitalize",
                activeTab === tab ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full mx-4" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6 mt-6 pb-20 px-4">
          {profile.isPrivateView ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed text-center">
               <Lock className="w-12 h-12 text-muted-foreground mb-4" />
               <h3 className="text-xl font-bold">These posts are protected</h3>
               <p className="text-muted-foreground">Only approved followers can see @{profile.username}'s posts.</p>
            </div>
          ) : (loadingLikes && activeTab === 'likes') ? (
            <PostSkeleton />
          ) : displayList.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12" />}
              title={`No ${activeTab} yet`}
              description={isOwnProfile ? "Nothing to show here." : "This user hasn't content here yet."}
            />
          ) : (
            displayList.map(post => {
              const isRepost = !!post.repostOf;
              const displayPost = isRepost ? post.repostOf : post;
              return (
                <SocialCard 
                  key={post._id || post.id}
                  id={isOwnProfile ? (post._id || post.id) : (displayPost._id || displayPost.id)}
                  author={{
                    name: displayPost.author?.name || displayPost.author?.username || 'Unknown',
                    username: displayPost.author?.username || 'unknown',
                    avatar: displayPost.author?.avatar || 'https://github.com/shadcn.png',
                    timeAgo: displayPost.createdAt ? getTimeAgo(displayPost.createdAt) : 'Just now',
                  }}
                  content={{
                    text: displayPost.content || displayPost.text || '',
                    media: displayPost.media ? (Array.isArray(displayPost.media) ? displayPost.media : [displayPost.media]) : [],
                  }}
                  engagement={{
                    likes: displayPost.likeCount || 0,
                    comments: displayPost.commentCount || 0,
                    shares: displayPost.repostCount || 0,
                    isLiked: displayPost.isLiked || false,
                    isBookmarked: displayPost.isBookmarked || false,
                  }}
                  repostedBy={isRepost ? post.author : null}
                  permissions={isOwnProfile ? post.permissions : displayPost.permissions}
                  onLike={() => handleLike(displayPost._id || displayPost.id, displayPost.isLiked)}
                  onComment={() => handleAction(displayPost._id || displayPost.id, 'commented')}
                  onShare={() => handleAction(displayPost._id || displayPost.id, 'shared')}
                  onBookmark={() => handleAction(displayPost._id || displayPost.id, 'bookmarked')}
                  onMore={(action) => handleAction(
                    isOwnProfile ? (post._id || post.id) : (displayPost._id || displayPost.id), 
                    action, 
                    isOwnProfile ? (post.author?._id || post.author) : (displayPost.author?._id || displayPost.author)
                  )}
                  className="max-w-2xl mx-auto"
                />
              );
            })
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

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) return `${interval}${unit[0]}`;
  }
  return 'Just now';
}
