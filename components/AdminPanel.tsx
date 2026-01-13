'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, ShieldOff } from 'lucide-react';

export default function AdminPanel() {
  const [adminKey, setAdminKey] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('adminKey');
    if (savedKey) {
      setAdminKey(savedKey);
      setIsAdmin(true);
    }
  }, []);

  const handleSetAdminKey = () => {
    if (adminKey.trim()) {
      localStorage.setItem('adminKey', adminKey);
      setIsAdmin(true);
      alert('Admin mode enabled! You can now delete any thread or post.');
    }
  };

  const handleRemoveAdminKey = () => {
    localStorage.removeItem('adminKey');
    setAdminKey('');
    setIsAdmin(false);
    alert('Admin mode disabled.');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-cyan-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Admin Panel
        </h2>
      </div>

      {isAdmin ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Admin mode is active</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have admin privileges and can delete any thread or post in the forum.
          </p>
          <Button
            variant="outline"
            onClick={handleRemoveAdminKey}
            className="text-red-600 hover:text-red-700"
          >
            <ShieldOff className="w-4 h-4 mr-2" />
            Disable Admin Mode
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enter the admin key to enable moderation capabilities. This allows you to delete
            any thread or post in the forum.
          </p>
          <div>
            <Label htmlFor="admin-key">Admin Key</Label>
            <Input
              id="admin-key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key..."
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Contact the site administrator to get the admin key.
            </p>
          </div>
          <Button onClick={handleSetAdminKey}>
            <Shield className="w-4 h-4 mr-2" />
            Enable Admin Mode
          </Button>
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
          Setting up the admin key
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
          To set up admin authentication, add this to your <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">.env.local</code> file:
        </p>
        <code className="block text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono">
          ADMIN_KEY="your-secret-admin-key-here"
        </code>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          Generate a strong random key and keep it secret. Anyone with this key can moderate the forum.
        </p>
      </div>
    </Card>
  );
}
