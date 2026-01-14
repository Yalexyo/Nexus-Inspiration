'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { USERS, login, getCurrentUser } from '@/lib/auth';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState(USERS[0].username);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (getCurrentUser()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
      const user = login(selectedUser);
      if (user) {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Nexus</h1>
          <p className="text-indigo-100 text-sm font-medium mt-1">Your Inspiration Library</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Select User</label>
              <div className="grid gap-3">
                {USERS.map(user => (
                  <label
                    key={user.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${selectedUser === user.username ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <input
                      type="radio"
                      name="user"
                      value={user.username}
                      checked={selectedUser === user.username}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="hidden"
                    />
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                      <div className="text-xs text-slate-500">@{user.username}</div>
                    </div>
                    {selectedUser === user.username && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-sm" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Accessing Vault...' : (
                <>
                  Enter Workspace <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
