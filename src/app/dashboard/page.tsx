'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import {
    Plus,
    Search,
    X,
    LayoutGrid,
    List as ListIcon,
    Settings,
    MoreHorizontal,
    ExternalLink,
    Trash2,
    Calendar,
    Tag,
    Clock,
    Play,
    Film,
    LogOut
} from 'lucide-react';
import { getInspirations, Inspiration, deleteInspiration, MediaAsset } from '@/lib/storage';

export default function DashboardPage() {
    const router = useRouter();
    const [inspirations, setInspirations] = useState<Inspiration[]>([]);
    const [filtered, setFiltered] = useState<Inspiration[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [selectedItem, setSelectedItem] = useState<Inspiration | null>(null);

    // Load Data
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            router.replace('/');
            return;
        }

        const load = async () => {
            const data = await getInspirations();
            setInspirations(data);
            setFiltered(data);
        };
        load();
    }, [router]);

    // Filter Logic
    useEffect(() => {
        let result = inspirations;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.tags?.some(t => t.toLowerCase().includes(q))
            );
        }
        setFiltered(result);
    }, [search, inspirations]);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this inspiration?')) {
            await deleteInspiration(id);
            setInspirations(prev => prev.filter(i => i.id !== id));
            setSelectedItem(null);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col">
            {/* Desktop Navigation */}
            <header className="hidden md:flex shrink-0 w-full h-16 bg-white border-b border-slate-200 z-50 justify-center shadow-sm">
                <div className="w-full max-w-7xl px-6 flex items-center justify-between h-full">
                    <div className="flex items-center gap-8">
                        <div className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                <Plus size={20} strokeWidth={3} />
                            </div>
                            NEXUS
                        </div>
                        <nav className="flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-bold text-slate-900 border-b-2 border-indigo-600 pb-4 mt-4">Dashboard</Link>
                            <Link href="/capture" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors pb-4 mt-4">Capture</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                const { logout } = require('@/lib/auth'); // Lazy import to avoid cycle if any
                                logout();
                                router.replace('/');
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Log Out"
                        >
                            <LogOut size={20} />
                        </button>
                        <div className="w-9 h-9 bg-indigo-100 rounded-full border-2 border-white shadow-sm overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Header - Sticky Top */}
            <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <header className="h-14 flex items-center justify-between px-4">
                    <div className="text-lg font-black tracking-tight text-slate-900">Nexus</div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            className="text-slate-500 hover:bg-slate-100 rounded-full"
                        >
                            {viewMode === 'list' ? <LayoutGrid size={20} /> : <ListIcon size={20} />}
                        </Button>
                        <Link href="/settings">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-full">
                                <Settings size={20} />
                            </Button>
                        </Link>
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex-1 flex flex-col">

                {/* Visual Toolbar (Unified) */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400"
                            placeholder="Search inspirations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* View Toggle (Desktop) */}
                        <div className="hidden md:flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ListIcon size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>

                        {/* Add New Button - Primary Action */}
                        <Link href="/capture" className="flex-1 md:flex-none">
                            <button className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                <Plus size={18} strokeWidth={2.5} />
                                <span>Add New</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Content Grid/List */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-slate-500">No inspirations found</p>
                        <p className="text-sm text-slate-400 mt-1">Try a different search term or add a new entry.</p>
                    </div>
                ) : (
                    <>
                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="grid gap-3">
                                {filtered.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className="group bg-white border border-slate-200 rounded-xl p-3 flex gap-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer items-center"
                                    >
                                        <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-100 shadow-sm">
                                            {item.assets && item.assets.length > 0 ? (
                                                <>
                                                    {item.assets[0].type === 'video' ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                                            <Play size={12} className="text-white fill-white" />
                                                        </div>
                                                    ) : (
                                                        <img src={item.assets[0].content} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <LayoutGrid size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                            <p className="text-sm text-slate-500 truncate">{item.description}</p>
                                        </div>
                                        <div className="hidden md:flex gap-2">
                                            {item.tags?.slice(0, 3).map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-md border border-slate-100">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="px-4 text-slate-300 group-hover:text-indigo-400">
                                            <ExternalLink size={18} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Grid View (Soft Modern) */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
                                {filtered.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col"
                                    >
                                        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                            {item.assets && item.assets.length > 0 ? (
                                                <>
                                                    {item.assets[0].type === 'video' ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-900 group-hover:scale-105 transition-transform duration-500">
                                                            <Play size={32} className="text-white fill-white opacity-80" />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={item.assets[0].content}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <LayoutGrid size={32} className="text-slate-300" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-5 flex flex-col gap-3 flex-1">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                                                {item.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className="px-2.5 py-1 bg-slate-50 text-indigo-900/70 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Detail Sheet (Soft Modern) */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedItem(null)} />
                    <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Inspiration Details</h2>
                            <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto">
                            {selectedItem.assets && selectedItem.assets.length > 0 && (
                                <div className="w-full bg-slate-50 border-b border-slate-100">
                                    {/* Primary Media */}
                                    <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                                        {selectedItem.assets[0].type === 'video' ? (
                                            <video src={selectedItem.assets[0].content} className="max-h-full max-w-full" controls />
                                        ) : (
                                            <img src={selectedItem.assets[0].content} alt="" className="max-h-full max-w-full object-contain" />
                                        )}
                                    </div>

                                    {/* Gallery Thumbnails (if more than 1) */}
                                    {selectedItem.assets.length > 1 && (
                                        <div className="p-4 flex gap-3 overflow-x-auto bg-white border-t border-slate-100 scrollbar-hide">
                                            {selectedItem.assets.map((asset, idx) => (
                                                <div key={idx} className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group">
                                                    {asset.type === 'video' ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                                            <Play size={16} className="text-white fill-white" />
                                                        </div>
                                                    ) : (
                                                        <img src={asset.content} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                    {/* Clicking a thumb could change the primary, but for now we'll just show them */}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-8">
                                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500">#{selectedItem.id.substring(0, 6)}</span>
                                    <span>•</span>
                                    <span>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                                </div>

                                <h1 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
                                    {selectedItem.title}
                                </h1>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tags & Classifiers</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.tags?.map(tag => (
                                                <span key={tag} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="prose prose-slate">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
                                        <p className="text-slate-600 leading-relaxed text-lg">
                                            {selectedItem.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer className="p-4 border-t border-slate-100 bg-slate-50 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleDelete(selectedItem.id)}
                                className="h-12 flex items-center justify-center gap-2 font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <Trash2 size={18} /> Delete
                            </button>
                            <a
                                href={selectedItem.assets?.[0]?.type === 'website' ? selectedItem.assets[0].content as string : '#'}
                                target="_blank"
                                className={`h-12 text-white flex items-center justify-center gap-2 font-bold rounded-xl shadow-lg transition-all ${selectedItem.assets?.[0]?.type === 'website' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-300 cursor-not-allowed shadow-none'}`}
                            >
                                <ExternalLink size={18} /> Open Source
                            </a>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
