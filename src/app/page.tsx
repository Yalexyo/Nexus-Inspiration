'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUsers, login, logout, addUser } from '@/lib/auth';
import { ArrowRight, Plus, UserPlus } from 'lucide-react';
import MushroomCardIcon from '@/components/MushroomCardIcon';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<{ id: string; username: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    logout();
    const allUsers = getUsers();
    setUsers(allUsers);
    if (allUsers.length > 0) setSelectedUser(allUsers[0].username);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter password');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const user = login(selectedUser, password);
      if (user) {
        router.push('/dashboard');
      } else {
        setError('Incorrect password');
        setIsLoading(false);
      }
    }, 600);
  };

  const handleAddUser = () => {
    const trimmed = newUsername.trim();
    if (!trimmed) return;

    const exists = users.some(u => u.username.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError('User already exists');
      return;
    }

    const newUser = addUser(trimmed);
    const updated = [...users, newUser];
    setUsers(updated);
    setSelectedUser(newUser.username);
    setNewUsername('');
    setShowAddUser(false);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-indigo-200/30 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] bg-indigo-200/30 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-500/10 border border-white/50 relative overflow-hidden transition-all hover:shadow-indigo-500/20 duration-500">

        {/* Header Section */}
        <div className="pt-8 pb-4 px-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 rotate-3 hover:rotate-6 transition-transform duration-300 text-indigo-600">
            <MushroomCardIcon size={36} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">灵感卡片</h1>
          <p className="text-slate-500 font-medium text-sm">团队灵感收集平台</p>
        </div>

        <div className="p-8 pt-2">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 block">User</label>
              <div className="flex gap-2">
                <select
                  value={selectedUser}
                  onChange={(e) => { setSelectedUser(e.target.value); setError(''); }}
                  className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.username}>{user.username}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="h-12 w-12 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shrink-0"
                  title="Add New User"
                >
                  <UserPlus size={18} />
                </button>
              </div>
            </div>

            {/* Add New User (expandable) */}
            {showAddUser && (
              <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                <input
                  type="text"
                  placeholder="Enter new username..."
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUser())}
                  className="flex-1 h-11 px-4 bg-white border border-indigo-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={!newUsername.trim()}
                  className="h-11 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter password..."
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-xs font-bold text-center animate-in fade-in duration-200">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group text-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">Entering...</span>
              ) : (
                <>
                  Enter Workspace <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
