import React from 'react';
import { Home, User, Bell, Bookmark, Settings, Hash, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { openAuthModal } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover'; // We might re-use popover here or just link

export function LeftSidebar() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const handleAuthAction = (action) => {
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
    } else {
      action();
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    { icon: <Home className="w-6 h-6" />, label: "Home", href: "/" },
    { icon: <User className="w-6 h-6" />, label: "Profile", href: "/profile/me", auth: true },
    { icon: <Bookmark className="w-6 h-6" />, label: "Bookmarks", href: "/bookmarks", auth: true },
    { icon: <Settings className="w-6 h-6" />, label: "Settings", href: "/settings", auth: true },
  ];

  return (
    <div className="hidden md:flex flex-col h-full w-[80px] lg:w-[275px] shrink-0 pt-6 pb-2">
      <nav className="flex flex-col gap-2 px-2">
        {navItems.map((item, index) => {
          if (item.auth && !isAuthenticated) return null;

          return (
            <NavLink 
              key={index} 
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 w-full group",
                isActive 
                  ? "bg-white/20 dark:bg-white/10 font-bold backdrop-blur-md shadow-sm border border-white/10" 
                  : "hover:bg-white/10 dark:hover:bg-white/5 border border-transparent hover:border-white/5 text-muted-foreground hover:text-foreground"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "p-1 rounded-lg transition-colors", 
                    isActive ? "" : "group-hover:bg-white/5"
                  )}>
                    {item.icon}
                  </div>
                  <span className="text-lg hidden lg:block font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {!isAuthenticated && (
        <div className="mt-8 mx-2 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
          <h3 className="font-bold mb-2">Join the conversation</h3>
          <p className="text-sm text-muted-foreground mb-4">Sign up now to share your thoughts.</p>
          <Button className="w-full rounded-full shadow-lg" onClick={() => dispatch(openAuthModal('signup'))}>
            Create Account
          </Button>
        </div>
      )}

      {isAuthenticated && (
        <div className="mt-auto px-2 pt-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-2xl hover:bg-white/10 dark:hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200 group relative overflow-hidden"
          >
             <div className="p-2 rounded-xl bg-white/5 dark:bg-white/5 group-hover:bg-red-500/20 text-muted-foreground group-hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
             </div>
             <span className="text-base font-bold text-muted-foreground group-hover:text-red-500 transition-colors hidden lg:block">Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}

