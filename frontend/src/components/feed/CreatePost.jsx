import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Image, Video, X, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CreatePost({ onPost }) {
  const { user } = useSelector(state => state.auth);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

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

  const handleSubmit = () => {
    if ((!content.trim() && media.length === 0)) return;

    // Create FormData to send file properly
    const formData = new FormData();
    formData.append('content', content);
    
    // Add the actual file (only first media item for now, backend expects single file)
    if (media.length > 0) {
      formData.append('media', media[0].file);
    }

    onPost(formData);

    setContent('');
    setMedia([]);
  };

  const isDisabled = !content.trim() && media.length === 0;

  return (
    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl p-4 shadow-sm mb-6 transition-all hover:border-white/20">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
           <img 
             src={user?.avatar || "https://github.com/shadcn.png"} 
             alt="User" 
             className="w-full h-full object-cover"
           />
        </div>
        <div className="flex-1">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is happening?!" 
            className="w-full bg-transparent border-none text-lg text-foreground focus:ring-0 placeholder:text-muted-foreground resize-none min-h-[60px] p-0"
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

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
        <div className="flex gap-2 text-primary">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-muted rounded-full text-primary transition-colors"
            title="Add Photo"
          >
            <Image className="w-5 h-5" />
          </button>
          <button 
            onClick={() => videoInputRef.current?.click()}
            className="p-2 hover:bg-muted rounded-full text-primary transition-colors"
            title="Add Video"
          >
            <Video className="w-5 h-5" />
          </button>
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
        <div className="flex items-center gap-4">
           {content.length > 0 && (
             <span className={cn(
               "text-xs font-medium",
               content.length > 280 ? "text-red-500" : "text-muted-foreground"
             )}>
               {content.length} / 280
             </span>
           )}
           <Button 
             onClick={handleSubmit} 
             disabled={isDisabled}
             className="rounded-full font-bold px-6"
           >
             Post
           </Button>
        </div>
      </div>
    </div>
  );
}
