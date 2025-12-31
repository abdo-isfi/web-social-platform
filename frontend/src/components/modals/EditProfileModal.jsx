import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppInput } from '@/components/ui/app-input';
import { updateUser } from '@/store/slices/authSlice';
import { Camera, Eye, Trash2, Upload } from 'lucide-react';

export function EditProfileModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    birthday: '',
    avatar: '',
    banner: '',
    isPrivate: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        birthday: user.birthday || '',
        avatar: user.avatar || '',
        banner: user.banner || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop',
        isPrivate: user.isPrivate || false
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Photo Action Logic
  const fileInputRef = useRef(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // Banner Action Logic
  const bannerInputRef = useRef(null);
  const [showBannerMenu, setShowBannerMenu] = useState(false);

  // Profile Photo Handlers
  // Check if we have new files
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [newBannerFile, setNewBannerFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setNewAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, avatar: reader.result }));
            setShowPhotoMenu(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setNewBannerFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, banner: reader.result }));
            setShowBannerMenu(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    setNewAvatarFile(null); // Assuming delete means revert or empty? currently implementation sets string url. 
    // Backend doesn't support deleting yet, just replacing. 
    // But setting avatar to default string won't persist if backend expects file or string url in body.
    setFormData(prev => ({ ...prev, avatar: "https://github.com/shadcn.png" }));
    setShowPhotoMenu(false);
  };

  const handleDeleteBanner = () => {
    setNewBannerFile(null);
    setFormData(prev => ({ ...prev, banner: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop" }));
    setShowBannerMenu(false);
  };

  const handleSave = async () => {
    // Determine if we need FormData (files present)
    const isFormData = !!newAvatarFile || !!newBannerFile;
    let dataToSubmit;

    if (isFormData) {
        dataToSubmit = new FormData();
        // Append text fields
        Object.keys(formData).forEach(key => {
            if (key !== 'avatar' && key !== 'banner') {
                dataToSubmit.append(key, formData[key]);
            }
        });
        // Append files
        if (newAvatarFile) {
            dataToSubmit.append('avatar', newAvatarFile);
        }
        if (newBannerFile) {
            dataToSubmit.append('banner', newBannerFile);
        }
    } else {
        // Send JSON minus the base64 previews if they are just previews (or send them if they are text links)
        // Actually, existing avatar/banner are URLs. We can send them.
        dataToSubmit = { ...formData };
        // Clean up base64 if we are not sending file? No, if we didn't change file, avatar is URL.
        // If we changed file, we have newAvatarFile.
    }

    const { updateUserProfile } = await import('@/store/slices/authSlice');
    await dispatch(updateUserProfile(user.id, dataToSubmit, isFormData));
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information, including name, bio, and privacy settings.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-[200px] w-full bg-muted group/banner">
           <img 
              src={formData.banner} 
              alt="Banner" 
              className="w-full h-full object-cover opacity-80"
           />
           <div 
              onClick={() => setShowBannerMenu(!showBannerMenu)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/banner:opacity-100 transition-opacity cursor-pointer z-10"
           >
              <Camera className="w-8 h-8 text-white/80" />
           </div>

           {/* Hidden Banner Input */}
           <input 
              type="file" 
              ref={bannerInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleBannerChange}
           />

           {/* Banner Action Menu */}
           {showBannerMenu && (
             <>
               <div 
                 className="fixed inset-0 z-40" 
                 onClick={() => setShowBannerMenu(false)}
               />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 w-48 bg-popover text-popover-foreground border border-border shadow-md rounded-xl overflow-hidden z-50 flex flex-col py-1">
                 <button 
                    onClick={() => window.open(formData.banner, '_blank')}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-sm font-medium text-left transition-colors"
                 >
                    <Eye className="w-4 h-4" /> See it
                 </button>
                 <button 
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-sm font-medium text-left transition-colors"
                 >
                    <Upload className="w-4 h-4" /> Upload new one
                 </button>
                 <button 
                    onClick={handleDeleteBanner}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium text-left transition-colors"
                 >
                    <Trash2 className="w-4 h-4" /> Delete it
                 </button>
               </div>
             </>
           )}
        </div>

        <div className="px-6 relative">
           <div className="absolute -top-[50px] left-6">
              <div className="relative group">
                <img 
                  src={formData.avatar || "https://github.com/shadcn.png"} 
                  alt="Profile" 
                  className="w-[100px] h-[100px] rounded-full object-cover border-4 border-background"
                />
                <div 
                    onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent z-20"
                >
                   <Camera className="w-6 h-6 text-white/80" />
                </div>

                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {/* Action Menu */}
                {showPhotoMenu && (
                    <>
                    <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setShowPhotoMenu(false)}
                    />
                    <div className="absolute top-[110%] left-0 w-48 bg-popover text-popover-foreground border border-border shadow-md rounded-xl overflow-hidden z-40 flex flex-col py-1">
                        <button 
                            onClick={() => window.open(formData.avatar, '_blank')}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-sm font-medium text-left transition-colors"
                        >
                            <Eye className="w-4 h-4" /> See it
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-sm font-medium text-left transition-colors"
                        >
                            <Upload className="w-4 h-4" /> Upload new one
                        </button>
                        <button 
                            onClick={handleDeletePhoto}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium text-left transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete it
                        </button>
                    </div>
                    </>
                )}
              </div>
           </div>
           
           <div className="pt-[60px] pb-6 space-y-4">
              <AppInput
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
              />
              
              <div className="space-y-2">
                 <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bio</label>
                 <textarea 
                   className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                   name="bio"
                   value={formData.bio}
                   onChange={handleChange}
                   placeholder="Bio"
                 />
              </div>

               <AppInput
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Location"
              />

              <AppInput
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Website"
              />

              <div className="grid gap-2">
                  <label className="text-sm font-medium">Birth date</label>
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                  />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div className="space-y-0.5">
                      <label className="text-sm font-semibold">Private Profile</label>
                      <p className="text-xs text-muted-foreground">Only your followers can see your posts.</p>
                  </div>
                  <input
                    type="checkbox"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleChange}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
              </div>
           </div>
        </div>

        <div className="p-6 pt-0 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={handleSave} className="rounded-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
