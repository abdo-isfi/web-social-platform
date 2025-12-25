import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markAsRead, markAllAsRead } from "@/store/slices/notificationsSlice";

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

export function NotificationsPopover() {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleNotificationClick = (id) => {
    dispatch(markAsRead(id));
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
            <div
              key={notification.id}
              className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent cursor-pointer"
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="relative flex items-start gap-3 pe-3">
                <img
                  className="size-9 rounded-full object-cover"
                  src={notification.user.avatar}
                  width={32}
                  height={32}
                  alt={notification.user.name}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-left text-foreground/80 leading-snug">
                    <span className="font-medium text-foreground hover:underline">
                      {notification.user.name}
                    </span>{" "}
                    {notification.action}{" "}
                    <span className="font-medium text-foreground hover:underline">
                      {notification.target}
                    </span>
                    .
                  </p>
                  <div className="text-xs text-muted-foreground">{notification.timestamp}</div>
                </div>
                {!notification.isRead && (
                  <div className="absolute end-0 self-center">
                    <Dot />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
