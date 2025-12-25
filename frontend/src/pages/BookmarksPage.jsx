import React from 'react';
import { Bookmark } from 'lucide-react';

export function BookmarksPage() {
  // Static content for now as requested
  return (
      <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
              <h1 className="text-xl font-bold">Bookmarks</h1>
              <p className="text-sm text-muted-foreground">Saved posts</p>
          </div>

          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground mt-10">
              <div className="bg-muted/50 p-6 rounded-full mb-4">
                  <Bookmark className="w-12 h-12 stroke-1" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Save posts for later</h2>
              <p className="max-w-sm">Bookmark posts to easily find them again in the future.</p>
          </div>
      </div>
  );
}
