import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, User, Bell, Bookmark, Settings, LogIn, Menu, Sun, Moon, LayoutGrid, Users } from 'lucide-react';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { openAuthModal, setFeedMode } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  const { feedMode } = useSelector(state => state.ui);
  const requireAuth = useAuthGuard();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };


  const logoElement = (
    <div className="relative w-8 h-8 flex items-center justify-center bg-black dark:bg-white rounded-full cursor-pointer">
       <span className="text-white dark:text-black font-bold text-lg">S</span>
    </div>
  );

  return (
    <>
    <header className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
      <div className="w-full md:w-[95%] lg:w-[85%] xl:w-[70%] pointer-events-auto bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg rounded-full px-6 py-2 h-16 flex items-center justify-between mx-auto transition-all duration-300">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            {logoElement}
            <span className="ml-2 font-bold hidden sm:block text-xl">Social</span>
          </Link>
        </div>

        {/* Center: Feed Filter (Only on Feed Page) */}
        {location.pathname === '/' && (
          <div className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-full border border-border/10 backdrop-blur-md">
            <button 
              onClick={() => dispatch(setFeedMode('public'))}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                feedMode === 'public' 
                  ? "bg-card text-primary shadow-sm ring-1 ring-border/50 translate-z-0 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden lg:inline">Public</span>
            </button>
            <button 
              onClick={() => requireAuth(() => dispatch(setFeedMode('following')))}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                feedMode === 'following' 
                  ? "bg-card text-primary shadow-sm ring-1 ring-border/50 translate-z-0 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">Following</span>
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {isAuthenticated ? (
            <>
              <NotificationsPopover />
              <Link to="/profile/me">
                <UserAvatar 
                  user={user} 
                  className="w-9 h-9 rounded-full border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                />
              </Link>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => dispatch(openAuthModal('login'))}
                className="rounded-full hidden sm:flex font-semibold"
              >
                Log In
              </Button>
              <Button 
                size="sm" 
                onClick={() => dispatch(openAuthModal('signup'))}
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 font-semibold shadow-md"
              >
                Sign Up
              </Button>
            </>
          )}

          <button className="md:hidden p-2 text-foreground/80 hover:text-foreground" onClick={toggleMenu} aria-label="Toggle Menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Content - Positioned absolutely below the floating navbar */}
      <div className={`absolute top-20 w-[90%] md:w-[400px] border border-white/10 rounded-2xl shadow-xl transition-all ease-in-out duration-300 overflow-hidden bg-background/80 backdrop-blur-xl
                       ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="p-4 space-y-4">
          

          <nav className="flex flex-col space-y-1">
            <Link to="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium">
              <Home className="w-5 h-5" /> Home
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/notifications" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-sm font-medium" onClick={toggleMenu}>
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" /> Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile/me" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium" onClick={toggleMenu}>
                  <User className="w-5 h-5" /> Profile
                </Link>
                <Link to="/bookmarks" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium">
                  <Bookmark className="w-5 h-5" /> Bookmarks
                </Link>
                <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium">
                  <Settings className="w-5 h-5" /> Settings
                </Link>
              </>
            )}
             {!isAuthenticated && (
               <button 
                 onClick={() => { dispatch(openAuthModal('login')); toggleMenu(); }}
                 className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium w-full text-left"
               >
                 <LogIn className="w-5 h-5" /> Log In
               </button>
             )}
          </nav>
        </div>
      </div>
    </header>
    </>
  );
}
