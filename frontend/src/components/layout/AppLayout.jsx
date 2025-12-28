import React from 'react';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { AuthModal } from '@/components/modals/AuthModal';
import { PageMarginBackground } from '@/components/ui/PageMarginBackground';
import { AnimatedShaderBackground } from '@/components/ui/animated-shader-background';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary/20 overflow-x-hidden relative">
      {/* Three.js animated shader background - behind everything */}
      <AnimatedShaderBackground />
      
      {/* Futuristic page margin backgrounds */}
      <PageMarginBackground position="left" />
      <PageMarginBackground position="right" />
      
      <Navbar />
      
      
      <div className="w-full md:w-[80vw] lg:w-[65vw] mx-auto flex justify-center items-start gap-0 md:gap-4 lg:gap-8 pt-16 relative z-10 px-0 sm:px-4">
        <LeftSidebar />
        
        <main className="flex-1 min-w-0 w-full max-w-[640px] min-h-screen border-r border-l border-border/40 pt-6 pb-20 md:pb-8 px-0 sm:px-0 bg-background/70 backdrop-blur-sm">
          {children}
        </main>
        
        <RightSidebar />
      </div>

      {/* Global Modals */}
      <AuthModal />
    </div>
  );
}
