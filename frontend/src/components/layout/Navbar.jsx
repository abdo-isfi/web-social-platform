import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Home, User, Bookmark, Settings, LogIn, Menu, Sun, Moon, LayoutGrid, Users } from 'lucide-react';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { openAuthModal, setFeedMode } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function Navbar() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { feedMode } = useSelector(state => state.ui);
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleFeedModeChange = (mode) => {
    dispatch(setFeedMode(mode));
  };

  const logoElement = (
    <div className="relative w-8 h-8 flex items-center justify-center bg-black dark:bg-white rounded-full cursor-pointer">
       <span className="text-white dark:text-black font-bold text-lg">S</span>
    </div>
  );

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center bg-background/80 backdrop-blur-md border-b border-border shadow-sm">

      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-3 h-16">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
            {logoElement}
            <span className="ml-2 font-bold hidden sm:block text-xl">Social</span>
          </a>
        </div>

        {/* Center: Feed Toggle (Desktop) */}
        <div className="hidden md:flex items-center bg-muted/50 p-1 rounded-full border border-border/50">
           <button 
             onClick={() => handleFeedModeChange('public')}
             className={cn(
               "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
               feedMode === 'public' 
                 ? "bg-background text-foreground shadow-sm" 
                 : "text-muted-foreground hover:text-foreground"
             )}
           >
             <LayoutGrid className="w-4 h-4" />
             Public
           </button>
           <button 
             onClick={() => handleFeedModeChange('following')}
             className={cn(
               "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
               feedMode === 'following' 
                 ? "bg-background text-foreground shadow-sm" 
                 : "text-muted-foreground hover:text-foreground"
             )}
           >
             <Users className="w-4 h-4" />
             Following
           </button>
        </div>

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
              <a href="/profile/me">
                <img 
                  src={user?.avatar || "https://github.com/shadcn.png"} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                />
              </a>
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

      {/* Mobile Menu Content */}
      <div className={`md:hidden flex flex-col w-full border-t border-border transition-all ease-in-out duration-300 overflow-hidden bg-background
                       ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 space-y-4">
          
          {/* Mobile Feed Toggle */}
          <div className="flex items-center justify-center p-1 bg-muted/50 rounded-xl mb-4">
             <button 
               onClick={() => { handleFeedModeChange('public'); toggleMenu(); }}
               className={cn(
                 "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                 feedMode === 'public' ? "bg-background shadow-sm" : "text-muted-foreground"
               )}
             >
               Public
             </button>
             <button 
               onClick={() => { handleFeedModeChange('following'); toggleMenu(); }}
               className={cn(
                 "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                 feedMode === 'following' ? "bg-background shadow-sm" : "text-muted-foreground"
               )}
             >
               Following
             </button>
          </div>

          <nav className="flex flex-col space-y-1">
            <a href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent text-sm font-medium">
              <Home className="w-5 h-5" /> Home
            </a>
            {isAuthenticated && (
              <>
                <a href="/profile/me" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent text-sm font-medium">
                  <User className="w-5 h-5" /> Profile
                </a>
                <a href="/bookmarks" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent text-sm font-medium">
                  <Bookmark className="w-5 h-5" /> Bookmarks
                </a>
                <a href="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent text-sm font-medium">
                  <Settings className="w-5 h-5" /> Settings
                </a>
              </>
            )}
             {!isAuthenticated && (
               <button 
                 onClick={() => { dispatch(openAuthModal('login')); toggleMenu(); }}
                 className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent text-sm font-medium w-full text-left"
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
