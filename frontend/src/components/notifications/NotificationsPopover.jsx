import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/store/slices/notificationsSlice";
import { followerService } from "@/services/follower.service";
import { cn } from "@/lib/utils";

function Dot() {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

function NotificationItem({ notification, onClick }) {
    const [followsBack, setFollowsBack] = React.useState(notification.isFollowingSender);
    const [requestStatus, setRequestStatus] = React.useState(notification.followRequestStatus);
    const [loading, setLoading] = React.useState(false);

    const handleAccept = async (e) => {
        e.stopPropagation();
        try {
            setLoading(true);
            await followerService.acceptFollowRequest(notification.sender._id);
            setRequestStatus("ACCEPTED");
        } catch (error) {
            console.error("Accept error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (e) => {
        e.stopPropagation();
        try {
            setLoading(true);
            await followerService.rejectFollowRequest(notification.sender._id);
            // Hide notification item or similar? For now just log and rely on refresh or local state
            console.log("Rejected");
        } catch (error) {
            console.error("Reject error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowBack = async (e) => {
        e.stopPropagation();
        try {
            setLoading(true);
            if (followsBack) {
                 await followerService.unfollowUser(notification.sender._id);
                 setFollowsBack(false);
            } else {
                 await followerService.followUser(notification.sender._id);
                 setFollowsBack(true);
            }
        } catch (error) {
            console.error("Follow error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            onClick={() => onClick(notification._id || notification.id)}
        >
            <div className="relative flex items-start gap-3 pe-3">
                <img
                    className="size-9 rounded-full object-cover"
                    src={notification.sender?.avatar || "https://github.com/shadcn.png"}
                    width={32}
                    height={32}
                    alt={notification.sender?.username || "User"}
                />
                <div className="flex-1 space-y-1">
                    <p className="text-left text-foreground/80 leading-snug">
                        <span className="font-medium text-foreground hover:underline">
                            {notification.sender?.name || notification.sender?.username || "Someone"}
                        </span>{" "}
                        {notification.type === "FOLLOW_REQUEST" ? "sent you a follow request" : 
                         notification.type === "FOLLOW_ACCEPTED" ? "accepted your follow request" :
                         notification.type === "NEW_FOLLOWER" ? "followed you" :
                         notification.type === "LIKE" ? "liked your post" : "interacted with you"}
                    </p>
                    <div className="text-xs text-muted-foreground">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Just now"}
                    </div>
                    {notification.type === "FOLLOW_REQUEST" && (
                        <div className="pt-2 flex gap-2">
                             <Button 
                                size="sm" 
                                className="h-7 text-xs bg-primary text-primary-foreground"
                                onClick={handleAccept}
                                disabled={loading || requestStatus === "ACCEPTED"}
                             >
                                {requestStatus === "ACCEPTED" ? "Accepted" : "Accept"}
                             </Button>
                             {requestStatus === "PENDING" && (
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={handleReject}
                                    disabled={loading}
                                >
                                    Reject
                                </Button>
                             )}
                        </div>
                    )}
                    {notification.type === "NEW_FOLLOWER" && (
                        <div className="pt-1">
                             <Button 
                                size="sm" 
                                variant={followsBack ? "outline" : "default"}
                                className={cn("h-7 text-xs", followsBack && "text-muted-foreground")}
                                onClick={handleFollowBack}
                                disabled={loading}
                             >
                                {loading ? "..." : followsBack ? "Following" : "Follow Back"}
                             </Button>
                        </div>
                    )}
                </div>
                {!notification.isRead && (
                    <div className="absolute end-0 self-center">
                        <Dot />
                    </div>
                )}
            </div>
        </div>
    );
}

export function NotificationsPopover() {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated]);

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleNotificationClick = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative rounded-full w-10 h-10 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Open notifications">
          <Bell size={20} strokeWidth={2} aria-hidden="true" className="text-zinc-600 dark:text-zinc-300" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center px-1 bg-red-500 hover:bg-red-600 border-none text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1 mr-4" align="end">
        <div className="flex items-baseline justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          {unreadCount > 0 && (
            <button className="text-xs font-medium text-primary hover:underline" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="-mx-1 my-1 h-px bg-border"
        ></div>
        <div className="max-h-[300px] overflow-y-auto">
         {notifications.length === 0 ? (
           <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          notifications.map((notification) => (
             <NotificationItem 
                key={notification._id || notification.id} 
                notification={notification} 
                onClick={handleNotificationClick} 
             />
          ))
        )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
