import React from 'react';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { AuthModal } from '@/components/modals/AuthModal';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex justify-center pt-16">
        <LeftSidebar />
        
        <main className="flex-1 w-full max-w-[600px] min-h-screen border-r border-l border-border/40 pt-6 pb-20 md:pb-8 px-0 sm:px-4">
          {children}
        </main>
        
        <RightSidebar />
      </div>

      {/* Global Modals */}
      <AuthModal />
    </div>
  );
}
