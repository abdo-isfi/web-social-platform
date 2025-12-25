import React from 'react';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { Switch } from '@/components/ui/switch'; // Will need to check if Switch exists or just mock UI

export function SettingsPage() {
  const { user } = useSelector(state => state.auth);

  return (
      <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>

          <div className="p-4 space-y-8">
              {/* Account Section */}
              <section className="space-y-4">
                  <h2 className="text-lg font-semibold">Account Information</h2>
                  <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                      <div className="grid gap-2">
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <div className="text-sm font-medium">{user?.email || 'user@example.com'}</div>
                      </div>
                      <div className="grid gap-2">
                          <label className="text-sm font-medium text-muted-foreground">Username</label>
                          <div className="text-sm font-medium">@{user?.username || 'username'}</div>
                      </div>
                  </div>
              </section>

              {/* Preferences Section - UI Only for now */}
              <section className="space-y-4">
                  <h2 className="text-lg font-semibold">Preferences</h2>
                  <div className="rounded-xl border border-border bg-card divide-y divide-border">
                      <div className="p-4 flex items-center justify-between">
                          <div className="space-y-0.5">
                              <div className="text-sm font-medium">Dark Mode</div>
                              <div className="text-xs text-muted-foreground">Toggle dark/light theme</div>
                          </div>
                          <Switch />
                      </div>
                      <div className="p-4 flex items-center justify-between">
                          <div className="space-y-0.5">
                              <div className="text-sm font-medium">Notifications</div>
                              <div className="text-xs text-muted-foreground">Receive email updates</div>
                          </div>
                          <Switch defaultChecked />
                      </div>
                      <div className="p-4 flex items-center justify-between">
                          <div className="space-y-0.5">
                              <div className="text-sm font-medium">Private Account</div>
                              <div className="text-xs text-muted-foreground">Only followers can see your posts</div>
                          </div>
                          <Switch />
                      </div>
                  </div>
              </section>

              <section className="pt-4">
                  <Button variant="destructive" className="w-full sm:w-auto">
                      Delete Account
                  </Button>
              </section>
          </div>
      </div>
  );
}
