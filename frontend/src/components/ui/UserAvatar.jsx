import React from 'react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';

/**
 * UserAvatar component that automatically uses the latest current user avatar
 * from Redux if the provided user object matches the current user.
 */
export function UserAvatar({ user, className, ...props }) {
  const { user: currentUser } = useSelector(state => state.auth);
  
  // Normalize IDs to handle both _id and id fields
  const getUserId = (u) => u?._id || u?.id;
  
  const currentUserId = getUserId(currentUser);
  const targetUserId = getUserId(user);
  
  const isCurrentUser = currentUserId && targetUserId && currentUserId === targetUserId;
  
  // If it's the current user, prefer the avatar from the auth state (latest)
  // Otherwise use the avatar provided in the user object
  const avatarUrl = isCurrentUser ? (currentUser.avatar || user?.avatar) : user?.avatar;
  const finalSrc = (typeof avatarUrl === 'object' ? avatarUrl?.url : avatarUrl) || "https://github.com/shadcn.png";

  return (
    <img
      src={finalSrc}
      alt={user?.name || user?.username || 'User'}
      className={cn("rounded-full object-cover", className)}
      loading="lazy"
      {...props}
    />
  );
}
