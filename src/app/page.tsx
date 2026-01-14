'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { USERS, login, logout, getCurrentUser } from '@/lib/auth';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState(USERS[0].username);
  const [isLoading, setIsLoading] = useState(false);

  // Ensure fresh session on entry
  useEffect(() => {
    logout();
  }, []);

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
    <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-purple-200/30 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] bg-indigo-200/30 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-indigo-500/10 border border-white/50 relative overflow-hidden transition-all hover:shadow-indigo-500/20 duration-500">

        {/* Header Section */}
        <div className="pt-12 pb-8 px-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 rotate-3 hover:rotate-6 transition-transform duration-300">
            <Sparkles className="text-white drop-shadow-md" size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Nexus</h1>
          <p className="text-slate-500 font-medium text-lg">Your Inspiration Library</p>
        </div>

        <div className="p-8 pt-0">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1">Select Identity</label>
              <div className="grid gap-3">
                {USERS.map(user => (
                  <label
                    key={user.id}
                    className={`flex items-center gap-4 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${selectedUser === user.username
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-transparent bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm'
                      }`}
                  >
                    <input
                      type="radio"
                      name="user"
                      value={user.username}
                      checked={selectedUser === user.username}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="hidden"
                    />
                    <div className={`relative p-0.5 rounded-full transition-all ${selectedUser === user.username ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-white object-cover shadow-sm" />
                    </div>

                    <div className="flex-1">
                      <div className={`font-bold text-sm transition-colors ${selectedUser === user.username ? 'text-indigo-900' : 'text-slate-700'}`}>{user.name}</div>
                      <div className="text-xs text-slate-400 font-medium group-hover:text-indigo-400 transition-colors">@{user.username}</div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedUser === user.username
                      ? 'border-indigo-600 bg-indigo-600 text-white scale-100'
                      : 'border-slate-300 bg-transparent text-transparent scale-90 opacity-0 group-hover:opacity-50'
                      }`}>
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  Entering Vault...
                </span>
              ) : (
                <>
                  Enter Workspace <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
