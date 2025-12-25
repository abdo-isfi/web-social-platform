import React from 'react';
import { Home, User, Bell, Bookmark, Settings, Hash, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { openAuthModal } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
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
    <div className="hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16 pt-6 pb-8 px-4 w-[250px] lg:w-[300px] border-r border-border/40 overflow-y-auto">
       <nav className="flex flex-col gap-4 space-y-2">
         {navItems.map((item, index) => {
           if (item.auth && !isAuthenticated) return null;

           return (
             <a 
               key={index} 
               href={item.href}
               className="flex items-center gap-4 p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-fit"
             >
               {item.icon}
               <span className="text-xl font-medium hidden lg:block">{item.label}</span>
             </a>
           );
         })}
       </nav>

       {!isAuthenticated && (
         <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-border">
           <h3 className="font-bold mb-2">Join the conversation</h3>
           <p className="text-sm text-muted-foreground mb-4">Sign up now to share your thoughts.</p>
           <Button className="w-full rounded-full" onClick={() => dispatch(openAuthModal('signup'))}>
             Create Account
           </Button>
         </div>
       )}

       {isAuthenticated && (
         <div className="mt-auto pt-4 border-t border-border">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 p-3 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors w-full"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-xl font-medium hidden lg:block">Logout</span>
            </button>
         </div>
       )}
    </div>
  );
}
