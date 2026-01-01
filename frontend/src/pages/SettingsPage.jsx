import React from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Bell, Bookmark, Settings, Shield, User, Trash2, Mail, AtSign, Moon, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function SettingsPage() {
  const { user } = useSelector(state => state.auth);

  return (
      <div className="w-full py-6 px-0 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0">
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

          <div className="px-6 space-y-8">
              {/* Account Section */}
              <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Account Information</h2>
                  </div>
                  <div className="p-6 rounded-3xl border border-border/40 bg-card/30 space-y-6 mx-2 md:mx-4">
                      <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <label className="text-[13px] font-bold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> Email
                            </label>
                            <div className="text-base font-medium">{user?.email || 'user@example.com'}</div>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <label className="text-[13px] font-bold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                                <AtSign className="w-3.5 h-3.5" /> Username
                            </label>
                            <div className="text-base font-medium">@{user?.username || 'username'}</div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* Preferences Section - UI Only for now */}
              <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Preferences</h2>
                  </div>
                  <div className="rounded-3xl border border-border/40 bg-card/30 overflow-hidden divide-y divide-border/10 mx-2 md:mx-4">
                      <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2">
                                <Moon className="w-4 h-4 text-primary/70" /> Dark Mode
                              </div>
                              <div className="text-sm text-muted-foreground">Toggle dark/light theme</div>
                          </div>
                          <Switch />
                      </div>
                      <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary/70" /> Notifications
                              </div>
                              <div className="text-sm text-muted-foreground">Receive email updates</div>
                          </div>
                          <Switch defaultChecked />
                      </div>
                      <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary/70" /> Private Account
                              </div>
                              <div className="text-sm text-muted-foreground">Only followers can see your posts</div>
                          </div>
                          <Switch />
                      </div>
                  </div>
              </section>

              <section className="pt-4 px-2">
                  <Button variant="ghost" className="w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2 rounded-full font-bold">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                  </Button>
              </section>
          </div>
      </div>
  );
}
