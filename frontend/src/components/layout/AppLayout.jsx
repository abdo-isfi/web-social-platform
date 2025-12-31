import React from 'react';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { AuthModal } from '@/components/modals/AuthModal';
import { AnimatedBackground } from './AnimatedBackground';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary/20 relative">
      <AnimatedBackground />

      <Navbar />
      
      
      <div className="w-full md:w-[95%] lg:w-[85%] xl:w-[70%] mx-auto flex justify-between items-start gap-6 pt-24 relative z-10 px-6 min-h-screen bg-background/40 backdrop-blur-3xl border-x border-white/10 shadow-2xl rounded-t-[40px] mt-4">
        <div className="shrink-0 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
          <LeftSidebar />
        </div>
        
        <main className="flex-1 min-w-0 max-w-[640px] mx-auto pb-10">
          {children}
        </main>
        
        <div className="shrink-0 hidden xl:block sticky top-24 h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
          <RightSidebar />
        </div>
      </div>

      {/* Global Modals */}
      <AuthModal />
    </div>
  );
}
