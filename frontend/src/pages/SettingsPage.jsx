import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Bell, Shield, User, Trash2, Mail, AtSign, Moon, Lock, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toggleTheme } from '@/store/slices/uiSlice';
import { updateUser, logout } from '@/store/slices/authSlice';
import { userService } from '@/services/user.service';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';

export function SettingsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handlePrivacyToggle = async (checked) => {
    setIsUpdatingPrivacy(true);
    try {
      const response = await userService.updatePrivacy(checked);
      if (response) {
        dispatch(updateUser({ isPrivate: checked }));
      }
    } catch (error) {
      console.error("Failed to update privacy", error);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      dispatch(logout());
    } catch (error) {
      console.error("Failed to delete account", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
      <div className="w-full py-6 px-0 mb-20 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0 shadow-inner">
                      <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black tracking-tight">Settings</h1>
                      <p className="text-[13px] font-medium text-muted-foreground/70">
                          Manage your account and preferences
                      </p>
                  </div>
              </div>
          </div>

          <div className="px-6 space-y-8 max-w-4xl">
              {/* Account Section */}
              <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <User className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Account Information</h2>
                  </div>
                  <div className="p-6 rounded-[2rem] border border-border/40 bg-card/30 space-y-6 mx-2 md:mx-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center justify-between group">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> Email address
                            </label>
                            <div className="text-base font-semibold text-foreground/90">{user?.email || 'user@example.com'}</div>
                          </div>
                      </div>
                      <div className="h-px bg-border/5" />
                      <div className="flex items-center justify-between group">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                <AtSign className="w-3.5 h-3.5" /> Username
                            </label>
                            <div className="text-base font-semibold text-foreground/90">@{user?.username || 'username'}</div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* Preferences Section */}
              <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Preferences</h2>
                  </div>
                  <div className="rounded-[2rem] border border-border/40 bg-card/30 overflow-hidden divide-y divide-border/10 mx-2 md:mx-4 shadow-sm backdrop-blur-sm">
                      <div className="p-6 flex items-center justify-between hover:bg-primary/[0.04] active:bg-primary/[0.06] transition-all cursor-pointer group/item" onClick={handleThemeToggle}>
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2 group-hover/item:text-primary transition-colors">
                                <Moon className="w-4 h-4 text-primary/70" /> Dark Mode
                              </div>
                              <div className="text-sm text-muted-foreground group-hover/item:text-muted-foreground/80 transition-colors">Swap between light and dark aesthetics</div>
                          </div>
                          <Switch 
                            checked={theme === 'dark'} 
                            onCheckedChange={handleThemeToggle}
                          />
                      </div>
                      <div className="p-6 flex items-center justify-between hover:bg-primary/[0.04] transition-all group/item cursor-pointer">
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2 group-hover/item:text-primary transition-colors">
                                <Bell className="w-4 h-4 text-primary/70" /> Notifications
                              </div>
                              <div className="text-sm text-muted-foreground group-hover/item:text-muted-foreground/80 transition-colors">Manage your alert preferences</div>
                          </div>
                          <Switch defaultChecked />
                      </div>
                      <div className="p-6 flex items-center justify-between hover:bg-primary/[0.04] transition-all group/item cursor-pointer" onClick={() => handlePrivacyToggle(!user?.isPrivate)}>
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2 group-hover/item:text-primary transition-colors">
                                <Lock className="w-4 h-4 text-primary/70" /> Private Account
                              </div>
                              <div className="text-sm text-muted-foreground font-medium text-muted-foreground/80 group-hover/item:text-muted-foreground/90 transition-colors">Only approved followers can see your content</div>
                          </div>
                          <Switch 
                            checked={user?.isPrivate || false} 
                            onCheckedChange={handlePrivacyToggle}
                            disabled={isUpdatingPrivacy}
                          />
                      </div>
                  </div>
              </section>

              {/* Danger Zone */}
              <section className="pt-8 px-2">
                  <div className="p-6 rounded-[2rem] border border-red-500/20 bg-red-500/[0.02] flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-left">
                          <h3 className="text-lg font-bold text-red-500/90 mb-1">Delete Account</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                              Permanently remove your account and all associated data. This action is irreversible.
                          </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="w-full sm:w-auto text-red-500 hover:text-white hover:bg-red-500 gap-2 rounded-2xl font-black h-12 px-6 transition-all shadow-sm hover:shadow-red-500/20 shadow-none border border-red-500/10 hover:border-red-500"
                      >
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                      </Button>
                  </div>
              </section>
          </div>

          <DeleteAlertModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteAccount}
            loading={isDeleting}
            title="Delete Account Permanently"
            description="Are you absolutely sure? This will delete your profile, posts, following history, and settings. There is no coming back from this."
          />
      </div>
  );
}
