'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    X,
    LayoutGrid,
    List as ListIcon,
    Settings,
    LogOut,
    MoreHorizontal,
    ExternalLink,
    Trash2,
    Calendar,
    Tag,
    Clock
} from 'lucide-react';
import { getInspirations, Inspiration, deleteInspiration } from '@/lib/storage';
import { logoutAction } from '../auth/actions';

export default function DashboardPage() {
    const [inspirations, setInspirations] = useState<Inspiration[]>([]);
    const [filtered, setFiltered] = useState<Inspiration[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [selectedItem, setSelectedItem] = useState<Inspiration | null>(null);

    // Load Data
    useEffect(() => {
        const data = getInspirations();
        setInspirations(data);
        setFiltered(data);
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = inspirations;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.tags.some(t => t.toLowerCase().includes(q))
            );
        }
        setFiltered(result);
    }, [search, inspirations]);

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this inspiration?')) {
            deleteInspiration(id);
            setInspirations(prev => prev.filter(i => i.id !== id));
            setSelectedItem(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Desktop Navigation */}
            <header className="hidden md:flex fixed top-0 left-0 w-full h-16 bg-white border-b border-slate-200 items-center justify-between px-6 shadow-sm z-50">
                <div className="flex items-center gap-8">
                    <div className="text-xl font-bold tracking-tight text-indigo-600 flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Plus className="text-white w-5 h-5" />
                        </div>
                        Nexus
                    </div>
                    <nav className="flex items-center gap-6">
                        <Link href="/dashboard" className="text-sm font-medium text-slate-900">Dashboard</Link>
                        <Link href="/capture" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Capture</Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/settings" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <Settings size={20} />
                    </Link>
                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                    </div>
                </div>
            </header>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 max-w-md mx-auto">
                <div className="text-lg font-bold tracking-tight text-indigo-600">Nexus</div>
                <button
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    className="p-2 text-slate-500"
                >
                    {viewMode === 'list' ? <LayoutGrid size={20} /> : <ListIcon size={20} />}
                </button>
            </header>

            {/* Desktop Toolbar */}
            <div className="hidden md:flex max-w-7xl mx-auto mt-24 mb-6 px-6 justify-between items-center">
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="Search inspirations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option>Sort by Date</option>
                        <option>Name A-Z</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    <Link href="/capture" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <Plus size={18} /> Add Inspiration
                    </Link>
                </div>
            </div>

            {/* Mobile Toolbar (Simplified) */}
            <div className="md:hidden pt-20 px-4 mb-4 max-w-md mx-auto">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <main className={`max-w-7xl mx-auto px-4 md:px-6 pb-24 ${viewMode === 'list' ? '' : ''}`}>
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Search size={32} />
                        </div>
                        <p>No inspirations found.</p>
                        <Link href="/capture" className="mt-4 text-indigo-600 font-medium text-sm">Create your first one</Link>
                    </div>
                ) : (
                    <>
                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Info</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</th>
                                            <th className="hidden md:table-cell px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map(item => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/80 active:bg-slate-50 transition-colors group cursor-pointer min-h-[88px]"
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <td className="px-4 py-3 align-top">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                                        {item.mediaContent && item.mediaType === 'url' ? (
                                                            <img src={item.mediaContent} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <LayoutGrid size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3 align-top">
                                                    <div className="font-semibold text-slate-900 line-clamp-1 leading-snug">{item.title}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</div>
                                                </td>
                                                <td className="hidden sm:table-cell px-4 py-3 align-top">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.tags.slice(0, 2).map(tag => (
                                                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">#{tag}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-500 align-top">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-right align-top">
                                                    <button className="p-2 text-slate-400 hover:text-slate-600 md:opacity-0 group-hover:opacity-100 transition-all">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Flow / Grid View */}
                        {viewMode === 'grid' && (
                            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 md:gap-6 space-y-3 md:space-y-6">
                                {filtered.map(item => (
                                    <div
                                        key={item.id}
                                        className="break-inside-avoid bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all relative"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        {item.mediaContent && item.mediaType === 'url' ? (
                                            <div className="aspect-auto overflow-hidden">
                                                <img
                                                    src={item.mediaContent}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center text-slate-200">
                                                <LayoutGrid size={40} />
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-[10px] text-indigo-600 font-medium">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Overlay Hover Effect Desktop */}
                                        <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <ExternalLink size={18} className="text-indigo-600" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Mobile Bottom Navigation Placeholder (Fab) */}
            <div className="md:hidden fixed bottom-6 right-6">
                <Link href="/capture" className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                    <Plus size={24} />
                </Link>
            </div>

            {/* Detail Sheet / Drawer */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
                    <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <header className="flex items-center justify-between p-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedItem(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                                <span className="font-medium text-slate-900">Details</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleDelete(selectedItem.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <form action={logoutAction} className="inline">
                                    <button type="submit" className="p-2 text-slate-400 hover:text-slate-600" title="Logout">
                                        <LogOut size={20} />
                                    </button>
                                </form>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto">
                            {selectedItem.mediaContent && selectedItem.mediaType === 'url' && (
                                <div className="w-full aspect-video bg-slate-100">
                                    <img src={selectedItem.mediaContent} alt="" className="w-full h-full object-contain" />
                                </div>
                            )}

                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedItem.title}</h2>

                                <div className="flex flex-wrap gap-4 mt-6">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Calendar size={16} />
                                        <span>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Clock size={16} />
                                        <span>{new Date(selectedItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedItem.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">#{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Description</h3>
                                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedItem.description}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <a
                                href={selectedItem.mediaContent}
                                target="_blank"
                                className="flex-1 bg-white border border-slate-200 text-slate-700 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-slate-100 transition-colors"
                            >
                                <ExternalLink size={16} /> View Source
                            </a>
                            <button className="flex-1 bg-indigo-600 text-white h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                                Edit Inspiration
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
