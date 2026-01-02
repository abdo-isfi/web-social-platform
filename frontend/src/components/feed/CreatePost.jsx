import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Image, Video, X, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTheme } from '@/hooks/useTheme';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function CreatePost({ onPost }) {
  const { user } = useSelector(state => state.auth);
  const { theme } = useTheme();
  const requireAuth = useAuthGuard();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiData) => {
    setContent(prev => prev + emojiData.emoji);
  };

  const handleMediaUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newMedia = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type,
      preview: URL.createObjectURL(file)
    }));

    setMedia(prev => [...prev, ...newMedia]);
    e.target.value = ''; // Reset input
  };

  const removeMedia = (id) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if ((!content.trim() && media.length === 0) || loading) return;

    try {
      setLoading(true);
      // Create FormData to send file properly
      const formData = new FormData();
      formData.append('content', content);
      
      // Add the actual file (only first media item for now, backend expects single file)
      if (media.length > 0) {
        formData.append('media', media[0].file);
      }

      await onPost(formData);

      setContent('');
      setMedia([]);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !content.trim() && media.length === 0;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm transition-all hover:border-primary/20 group mx-2 md:mx-4">
      {/* Post Input Area */}
      <div className="flex gap-5">
         {/* User Avatar */}
         <div className="w-12 h-12 rounded-full ring-2 ring-primary/10 overflow-hidden flex-shrink-0 transition-all group-hover:ring-primary/30">
            <UserAvatar 
              user={user} 
              className="w-full h-full object-cover"
            />
         </div>
        <div className="flex-1">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={(e) => {
              requireAuth(() => {}, 'login');
              // If focused by guest, they will be redirected to login modal, 
              // but we might want to blur it to prevent typing before modal opens if needed.
              // requireAuth doesn't block the action if it's just a focus, but triggers the modal.
            }}
            placeholder="What is happening?!" 
            className="w-full bg-transparent border-none text-lg text-foreground focus:ring-0 focus:outline-none outline-none placeholder:text-muted-foreground resize-none min-h-[60px] p-0"
            rows={Math.max(2, content.split('\n').length)}
            spellCheck="false"
            data-gramm="false"
          />
          
          {/* Media Previews */}
          {media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
              {media.map(item => (
                <div key={item.id} className="relative flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden group border border-border">
                  {item.type === 'image' ? (
                    <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.preview} className="w-full h-full object-cover" />
                  )}
                  <button 
                    onClick={() => removeMedia(item.id)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Actions & Footer */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/10">
        {/* Media & Emoji Icons */}
        <div className="flex gap-1 text-primary">
          <button 
            onClick={() => requireAuth(() => fileInputRef.current?.click())}
            className="p-2.5 hover:bg-primary/10 rounded-full text-primary transition-all duration-200 active:scale-90"
            title="Add Photo"
          >
            <Image className="w-5 h-5" />
          </button>
          <button 
            onClick={() => requireAuth(() => videoInputRef.current?.click())}
            className="p-2.5 hover:bg-primary/10 rounded-full text-primary transition-all duration-200 active:scale-90"
            title="Add Video"
          >
            <Video className="w-5 h-5" />
          </button>
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <button 
                className="p-2.5 hover:bg-primary/10 rounded-full text-primary transition-all duration-200 active:scale-90 outline-none"
                title="Add Emoji"
                onClick={(e) => {
                  e.preventDefault();
                  requireAuth(() => setShowEmojiPicker(!showEmojiPicker));
                }}
              >
                <Smile className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-none bg-transparent shadow-none w-auto" side="top" align="start" sideOffset={10}>
              <div className="rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl animate-in zoom-in-95 duration-200">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  theme={theme}
                  width={320}
                  height={420}
                  searchDisabled={false}
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                  lazyLoadEmojis={true}
                  searchPlaceHolder="Search emojis..."
                />
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Hidden Inputs */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            multiple
            onChange={(e) => handleMediaUpload(e, 'image')}
          />
          <input 
            type="file" 
            ref={videoInputRef} 
            className="hidden" 
            accept="video/*"
            onChange={(e) => handleMediaUpload(e, 'video')}
          />
        </div>
        <div className="flex items-center gap-6">
           {content.length > 0 && (
             <span className={cn(
               "text-xs font-bold",
               content.length > 280 ? "text-destructive" : "text-muted-foreground/60"
             )}>
               {content.length} / 280
             </span>
           )}
           <Button 
             onClick={handleSubmit} 
             disabled={isDisabled || loading}
             className="rounded-full font-black px-8 py-6 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
           >
             {loading ? 'Posting...' : 'Post'}
           </Button>
        </div>
      </div>
    </div>
  );
}
