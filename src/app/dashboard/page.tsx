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
    MoreHorizontal,
    ExternalLink,
    Trash2,
    Calendar,
    Tag,
    Clock
} from 'lucide-react';
import { getInspirations, Inspiration, deleteInspiration } from '@/lib/storage';

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
                i.tags?.some(t => t.toLowerCase().includes(q))
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
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Desktop Navigation */}
            <header className="hidden md:flex sticky top-0 w-full h-20 bg-white border-b-2 border-black z-50 justify-center">
                <div className="w-full max-w-screen-2xl px-8 flex items-center justify-between h-full">
                    <div className="flex items-center gap-12">
                        <div className="text-2xl font-black tracking-tighter text-black flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent flex items-center justify-center">
                                <Plus className="text-white w-6 h-6" />
                            </div>
                            NEXUS
                        </div>
                        <nav className="flex items-center gap-8">
                            <Link href="/dashboard" className="text-sm font-bold text-black uppercase tracking-widest border-b-2 border-black pb-1">Dashboard</Link>
                            <Link href="/capture" className="text-sm font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors">Capture</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/settings" className="text-black hover:text-accent transition-colors">
                            <Settings size={24} strokeWidth={1.5} />
                        </Link>
                        <div className="w-10 h-10 bg-gray-100 border-2 border-black overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="grayscale" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-50 h-16 bg-white border-b-2 border-black flex items-center justify-between px-6">
                <div className="text-xl font-black tracking-tighter text-black uppercase">Modulor</div>
                <button
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    className="p-2 text-black"
                >
                    {viewMode === 'list' ? <LayoutGrid size={24} /> : <ListIcon size={24} />}
                </button>
            </header>

            {/* Desktop Toolbar */}
            <div className="hidden md:flex w-full justify-center border-b border-black">
                <div className="w-full max-w-screen-2xl flex border-x-2 border-black">
                    <div className="relative flex-1 border-r border-black">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black" size={20} />
                        <input
                            className="w-full pl-16 pr-6 py-6 bg-white text-lg font-mono focus:outline-none focus:bg-muted transition-all placeholder:text-gray-400 uppercase"
                            placeholder="SEARCH INSPIRATION_DB..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center px-6 border-r border-black">
                        <select className="bg-transparent text-sm font-bold uppercase outline-none cursor-pointer">
                            <option>SORT: DATE</option>
                            <option>SORT: A-Z</option>
                        </select>
                    </div>
                    <div className="flex items-center px-6 gap-4">
                        <div className="flex items-center border-2 border-black p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'}`}
                            >
                                <ListIcon size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                        <Link href="/capture" className="bg-accent text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-2">
                            <Plus size={18} /> Add New
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Toolbar */}
            <div className="md:hidden mt-4 px-4 mb-8">
                <div className="relative border-b-2 border-black">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-black" size={20} />
                    <input
                        className="w-full pl-10 pr-4 py-3 bg-transparent text-base font-mono focus:outline-none placeholder:text-gray-400 uppercase"
                        placeholder="SEARCH..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <main className="w-full flex-1 flex flex-col items-center">
                <div className="w-full max-w-screen-2xl border-x-2 border-black flex-1">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                            <div className="w-24 h-24 border-2 border-gray-200 flex items-center justify-center mb-6">
                                <Search size={40} className="text-gray-300" />
                            </div>
                            <p className="font-mono text-sm uppercase tracking-widest">Database Empty</p>
                            <Link href="/capture" className="mt-6 text-accent font-bold uppercase border-b-2 border-accent pb-1 hover:text-black hover:border-black transition-all">Initialize Entry</Link>
                        </div>
                    ) : (
                        <>
                            {/* List View */}
                            {viewMode === 'list' && (
                                <div className="w-full border-t border-black md:border-t-0">
                                    {filtered.map((item, index) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className="group border-b border-black flex items-stretch hover:bg-muted cursor-pointer transition-colors"
                                        >
                                            <div className="w-24 md:w-48 border-r border-black shrink-0 relative overflow-hidden bg-gray-100">
                                                {item.mediaContent && item.mediaType === 'url' ? (
                                                    <img src={item.mediaContent} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <LayoutGrid size={24} className="text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 p-4 md:p-6 flex flex-col justify-center">
                                                <div className="flex items-baseline gap-4 mb-2">
                                                    <span className="font-mono text-xs text-black">NO. {String(index + 1).padStart(3, '0')}</span>
                                                    <h3 className="text-xl md:text-2xl font-bold uppercase text-black group-hover:underline decoration-2 underline-offset-4">{item.title}</h3>
                                                </div>
                                                <p className="text-sm md:text-base text-gray-600 line-clamp-1 font-mono">{item.description}</p>
                                            </div>
                                            <div className="border-l border-black p-4 md:p-6 w-48 hidden md:flex items-center justify-center">
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {item.tags?.slice(0, 2).map(tag => (
                                                        <span key={tag} className="border border-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-16 border-l border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                                <ExternalLink size={20} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Grid View (Swiss Style) */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-black gap-[1px] border-t border-black md:border-t-0">
                                    {filtered.map((item, index) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className="bg-white aspect-[3/4] group cursor-pointer relative overflow-hidden flex flex-col"
                                        >
                                            <div className="flex-1 relative overflow-hidden border-b border-black">
                                                {item.mediaContent && item.mediaType === 'url' ? (
                                                    <img
                                                        src={item.mediaContent}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                        <LayoutGrid size={48} className="text-gray-200" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4 font-mono text-xs bg-white border border-black px-2 py-1">
                                                    {String(index + 1).padStart(2, '0')}
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white transition-colors group-hover:bg-black group-hover:text-white h-48 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-black text-xl uppercase mb-2 leading-none">{item.title}</h3>
                                                    <p className="font-mono text-xs opacity-60 line-clamp-2 uppercase">{item.description}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {item.tags?.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-[10px] font-bold uppercase border border-current px-2 py-1">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Mobile Bottom FAB */}
            <div className="md:hidden fixed bottom-6 right-6 z-40">
                <Link href="/capture" className="w-16 h-16 bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all border-2 border-white">
                    <Plus size={32} />
                </Link>
            </div>

            {/* Detail Sheet (Swiss Style) */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-white/90 backdrop-grayscale" onClick={() => setSelectedItem(null)} />
                    <div className="relative w-full max-w-2xl bg-white h-full border-l-2 border-black flex flex-col animate-in slide-in-from-right duration-300">
                        <header className="flex items-center justify-between p-6 border-b-2 border-black">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Specification</h2>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
                                <X size={24} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto">
                            {selectedItem.mediaContent && selectedItem.mediaType === 'url' && (
                                <div className="w-full aspect-video bg-gray-100 border-b-2 border-black relative">
                                    <img src={selectedItem.mediaContent} alt="" className="w-full h-full object-contain p-8" />
                                    <div className="absolute bottom-4 right-4 bg-white border border-black px-3 py-1 font-mono text-xs">
                                        IMG_SRC_REF
                                    </div>
                                </div>
                            )}

                            <div className="p-8 md:p-12">
                                <span className="font-mono text-xs text-gray-400 block mb-6 uppercase tracking-widest">
                                    ID: {selectedItem.id.substring(0, 8)} • {new Date(selectedItem.createdAt).toLocaleDateString()}
                                </span>

                                <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.9] mb-12 text-black">
                                    {selectedItem.title}
                                </h1>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t-2 border-black pt-12">
                                    <div className="md:col-span-1">
                                        <h3 className="font-bold uppercase text-sm mb-4">Classifiers</h3>
                                        <div className="flex flex-col gap-2 align-start">
                                            {selectedItem.tags?.map(tag => (
                                                <span key={tag} className="font-mono text-xs border border-black px-2 py-1 self-start hover:bg-black hover:text-white cursor-default transition-colors">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <h3 className="font-bold uppercase text-sm mb-4">Description</h3>
                                        <p className="text-lg leading-relaxed font-serif">
                                            {selectedItem.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer className="p-6 border-t-2 border-black bg-white grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleDelete(selectedItem.id)}
                                className="h-14 flex items-center justify-center gap-3 font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-black transition-all"
                            >
                                <Trash2 size={20} /> Delete
                            </button>
                            <a
                                href={selectedItem.mediaContent}
                                target="_blank"
                                className="h-14 bg-black text-white flex items-center justify-center gap-3 font-bold uppercase tracking-wider hover:bg-accent transition-colors border-2 border-black"
                            >
                                <ExternalLink size={20} /> Open Source
                            </a>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
