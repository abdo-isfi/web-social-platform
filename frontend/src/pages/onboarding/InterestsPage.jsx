import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/user.service';
import { updateUser, completeOnboarding } from '@/store/slices/authSlice';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTEREST_OPTIONS = [
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'movies', label: 'Movies', icon: '🎬' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'food', label: 'Food', icon: '🍕' },
  { id: 'fashion', label: 'Fashion', icon: '✨' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'business', label: 'Business', icon: '📈' },
  { id: 'coding', label: 'Coding', icon: '👨‍💻' },
  { id: 'anime', label: 'Anime', icon: '🍥' },
  { id: 'photography', label: 'Photography', icon: '📷' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'memes', label: 'Memes', icon: '🤪' },
  { id: 'cars', label: 'Cars', icon: '🚗' },
  { id: 'design', label: 'Design', icon: '✒️' },
  { id: 'history', label: 'History', icon: '🏛️' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'crypto', label: 'Crypto', icon: '🪙' },
];

export function InterestsPage() {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleInterest = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0 || loading) return;

    try {
      setLoading(true);
      const response = await userService.saveInterests(selected);
      if (response) {
        dispatch(updateUser(response));
        dispatch(completeOnboarding());
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to save interests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] max-w-2xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          What are you interested in?
        </h1>
        <p className="text-muted-foreground text-lg">
          Pick at least one to personalize your feed. You can always change this later.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full mb-12">
        {INTEREST_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleInterest(option.id)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 gap-2 group relative overflow-hidden aspect-square sm:aspect-auto sm:h-32",
                isSelected 
                  ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20 shadow-md transform scale-[0.98]" 
                  : "bg-muted/30 border-transparent hover:bg-muted hover:border-border/50 text-muted-foreground hover:text-foreground hover:scale-[1.02]"
              )}
            >
              <span className="text-4xl sm:text-3xl group-hover:scale-110 transition-transform duration-300">{option.icon}</span>
              <span className="text-sm font-bold tracking-tight text-center leading-tight">{option.label}</span>
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-8 w-full flex justify-center mt-auto">
        <Button 
          size="lg"
          onClick={handleContinue}
          disabled={selected.length === 0 || loading}
          className="rounded-full px-12 py-7 text-lg font-black shadow-xl hover:shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
