'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUsers } from '@/lib/auth';
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
    LogOut,
    Check,
    Globe,
    Link as LinkIcon,
    FileText
} from 'lucide-react';
import { getInspirations, Inspiration, deleteInspiration, updateInspiration, MediaAsset, CATEGORIES, Category, SUBCATEGORIES, Subcategory, DESIGN_CATEGORY, SOURCE_OPTIONS, SourceOption } from '@/lib/storage';
import MushroomCardIcon from '@/components/MushroomCardIcon';

const USER_COLORS: Record<string, string> = {
    'user_01': 'bg-blue-500',
    'user_02': 'bg-emerald-500',
    'user_03': 'bg-amber-500',
    'user_04': 'bg-rose-500',
    'user_05': 'bg-purple-500',
};
const getUserColor = (userId: string) => USER_COLORS[userId] || 'bg-slate-400';

const TIME_FILTERS = [
    { value: 'all', label: '全部' },
    { value: 'today', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
] as const;

export default function DashboardPage() {
    const router = useRouter();
    const [inspirations, setInspirations] = useState<Inspiration[]>([]);
    const [filtered, setFiltered] = useState<Inspiration[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [selectedItem, setSelectedItem] = useState<Inspiration | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{ title: string; description: string; tags: string[]; assets: MediaAsset[]; category: Category; subcategory: Subcategory | null; source: SourceOption | null; source_text: string; design_insight: string } | null>(null);
    const [activeAssetIndex, setActiveAssetIndex] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [editTagInput, setEditTagInput] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
    const [subcategoryFilter, setSubcategoryFilter] = useState<Subcategory | null>(null);
    const [userFilter, setUserFilter] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<string>('all');

    const getOwnerName = (userId: string) => {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        return user ? user.name : userId;
    };

    const isOwner = (item: Inspiration) => currentUserId === item.user_id;

    // Auth Check
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            router.replace('/');
            return;
        }
        setCurrentUserId(user.id);

        const load = async () => {
            const data = await getInspirations();
            setInspirations(data);
            setFiltered(data);
        };
        load();
    }, [router]);

    // Reset subcategory filter when category filter changes
    useEffect(() => {
        if (categoryFilter === DESIGN_CATEGORY) {
            setSubcategoryFilter(null);
        }
    }, [categoryFilter]);

    // Filter Logic
    useEffect(() => {
        let result = inspirations;
        if (categoryFilter) {
            result = result.filter(i => i.category === categoryFilter);
        }
        if (categoryFilter === DESIGN_CATEGORY && subcategoryFilter) {
            result = result.filter(i => i.subcategory === subcategoryFilter);
        }
        if (userFilter) {
            result = result.filter(i => i.user_id === userFilter);
        }
        if (timeFilter !== 'all') {
            const now = new Date();
            let cutoff: Date;
            if (timeFilter === 'today') {
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (timeFilter === 'week') {
                cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            } else {
                cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            }
            result = result.filter(i => new Date(i.createdAt) >= cutoff);
        }
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.category?.toLowerCase().includes(q) ||
                i.subcategory?.toLowerCase().includes(q) ||
                i.tags?.some(t => t.toLowerCase().includes(q))
            );
        }
        setFiltered(result);
    }, [search, inspirations, categoryFilter, subcategoryFilter, userFilter, timeFilter]);

    const handleDelete = async (id: string) => {
        if (confirm('确定要删除这条灵感吗？删除后将无法恢复。')) {
            try {
                await deleteInspiration(id);
                setInspirations(prev => prev.filter(i => i.id !== id));
                setSelectedItem(null);
                setIsEditing(false);
            } catch (e) {
                console.error(e);
                alert("Failed to delete inspiration: " + (e instanceof Error ? e.message : 'Unknown error'));
            }
        }
    };

    const handleEditStart = () => {
        if (!selectedItem) return;
        setEditForm({
            title: selectedItem.title,
            description: selectedItem.description,
            tags: selectedItem.tags || [],
            assets: selectedItem.assets || [],
            category: selectedItem.category || CATEGORIES[0],
            subcategory: selectedItem.subcategory || null,
            source: (selectedItem.source as SourceOption) || null,
            source_text: selectedItem.source_text || '',
            design_insight: selectedItem.design_insight || ''
        });
        setIsEditing(true);
        setEditTagInput('');
        setActiveAssetIndex(0); // Reset preview to first item
    };

    const handleEditSave = async () => {
        if (!selectedItem || !editForm) return;
        try {
            await updateInspiration(selectedItem.id, editForm);
            // Update local state
            const updated = { ...selectedItem, ...editForm };
            setSelectedItem(updated); // Keep detail view open with new data
            setInspirations(prev => prev.map(i => i.id === updated.id ? updated : i)); // Update list
            setIsEditing(false);
            setActiveAssetIndex(0);
        } catch (e) {
            console.error(e);
            alert("Failed to update inspiration: " + (e instanceof Error ? e.message : 'Unknown error'));
        }
    };

    const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editForm) return;
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        e.target.value = ''; // Reset input to allow re-selecting same file

        const newAssets: MediaAsset[] = [];
        for (const file of files) {
            if (file.size > 120 * 1024 * 1024) {
                alert(`File "${file.name}" is too large! Max size is 120MB.`);
                continue;
            }
            const type = file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('video/') ? 'video' : 'image';
            // Create preview URL
            const preview = URL.createObjectURL(file);
            newAssets.push({ type, content: file, preview });
        }

        setEditForm(prev => prev ? { ...prev, assets: [...prev.assets, ...newAssets] } : null);
    };

    const handleAddLink = () => {
        if (!editForm) return;
        const url = prompt('Please enter the website URL:');
        if (!url) return;

        // Simple URL validation could go here

        setEditForm(prev => prev ? {
            ...prev,
            assets: [...prev.assets, { type: 'website', content: url }]
        } : null);
    };

    const renderAssetThumbnail = (asset: MediaAsset, className: string = "w-full h-full object-cover") => {
        if (asset.type === 'video') {
            return (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <Play size={16} className="text-white fill-white" />
                </div>
            );
        } else if (asset.type === 'pdf') {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 gap-1 p-2 text-center">
                    <FileText size={24} />
                    <span className="text-[10px] leading-tight font-medium">PDF</span>
                </div>
            );
        } else if (asset.type === 'website') {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-500 gap-1 p-2 text-center">
                    <Globe size={24} />
                    <span className="text-[10px] leading-tight font-medium truncate w-full px-1">
                        {typeof asset.content === 'string' ? new URL(asset.content).hostname : 'Link'}
                    </span>
                </div>
            );
        } else {
            return (
                <img
                    src={asset.preview || (typeof asset.content === 'string' ? asset.content as string : '')}
                    alt=""
                    className={className}
                />
            );
        }
    };

    const renderAssetPreview = (asset: MediaAsset) => {
        if (asset.type === 'video') {
            return (
                <video
                    src={asset.preview || (typeof asset.content === 'string' ? asset.content as string : '')}
                    className="max-h-full max-w-full"
                    controls
                />
            );
        } else if (asset.type === 'pdf') {
            const pdfUrl = asset.preview || (typeof asset.content === 'string' ? asset.content : '');
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-4">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <FileText size={48} className="text-red-500" />
                    </div>
                    <div className="text-center max-w-md px-4">
                        <h3 className="font-bold text-slate-900 text-lg mb-1">PDF Document</h3>
                    </div>
                    {pdfUrl && (
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 px-6 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                            <ExternalLink size={16} /> Open PDF
                        </a>
                    )}
                </div>
            );
        } else if (asset.type === 'website') {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-4">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Globe size={48} className="text-indigo-500" />
                    </div>
                    <div className="text-center max-w-md px-4">
                        <h3 className="font-bold text-slate-900 text-lg mb-1">External Website</h3>
                        <p className="text-sm break-all">{asset.content as string}</p>
                    </div>
                    <a
                        href={asset.content as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <ExternalLink size={16} /> Open Link
                    </a>
                </div>
            );
        } else {
            return (
                <img
                    src={asset.preview || (typeof asset.content === 'string' ? asset.content as string : '')}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                />
            );
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col">
            {/* Desktop Navigation */}
            <header className="hidden md:flex shrink-0 w-full h-16 bg-white border-b border-slate-200 z-50 justify-center shadow-sm">
                <div className="w-full max-w-7xl px-6 flex items-center justify-between h-full">
                    <div className="flex items-center gap-8">
                        <div className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-indigo-600">
                                <MushroomCardIcon size={22} />
                            </div>
                            灵感卡片
                        </div>
                        <nav className="flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-bold text-slate-900 border-b-2 border-indigo-600 pb-4 mt-4">仪表盘</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                const { logout } = require('@/lib/auth');
                                logout();
                                router.replace('/');
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Log Out"
                        >
                            <LogOut size={20} />
                        </button>
                        <div className="w-9 h-9 bg-indigo-600 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                            {currentUserId ? getOwnerName(currentUserId).charAt(0) : ''}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Header - Sticky Top */}
            <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <header className="h-14 flex items-center justify-between px-4">
                    <div className="text-lg font-black tracking-tight text-slate-900">灵感卡片</div>
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

                {/* Visual Toolbar */}
                <div className="flex flex-col gap-3 mb-8">
                    {/* Row 1: Search + Actions */}
                    <div className="flex flex-row items-center gap-3 w-full">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400"
                                placeholder="搜索灵感..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-2">
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
                            {/* Add New Button */}
                            <Link href="/capture" className="flex-1 md:flex-none">
                                <button className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                    <Plus size={18} strokeWidth={2.5} />
                                    <span>新建</span>
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Row 2: Category Filter */}
                    <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-x-auto w-fit">
                        <button
                            onClick={() => setCategoryFilter(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                categoryFilter === null
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            全部({inspirations.length})
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                    categoryFilter === cat
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {cat}({inspirations.filter(i => i.category === cat).length})
                            </button>
                        ))}
                    </div>

                    {/* Row 3: Subcategory Filter (only for 设计灵感) */}
                    {categoryFilter === DESIGN_CATEGORY && (
                        <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-x-auto w-fit">
                            <button
                                onClick={() => setSubcategoryFilter(null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                    subcategoryFilter === null
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                全部({inspirations.filter(i => i.category === DESIGN_CATEGORY).length})
                            </button>
                            {SUBCATEGORIES.map((sub) => (
                                <button
                                    key={sub}
                                    onClick={() => setSubcategoryFilter(sub)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                        subcategoryFilter === sub
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {sub}({inspirations.filter(i => i.category === DESIGN_CATEGORY && i.subcategory === sub).length})
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Row 4: User + Time Filter */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-x-auto w-fit">
                            <button
                                onClick={() => setUserFilter(null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                    userFilter === null
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                全部({inspirations.length})
                            </button>
                            {getUsers().map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => setUserFilter(u.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                        userFilter === u.id
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${userFilter === u.id ? 'bg-white' : getUserColor(u.id)}`} />
                                    {u.name}({inspirations.filter(i => i.user_id === u.id).length})
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
                            {TIME_FILTERS.map((tf) => (
                                <button
                                    key={tf.value}
                                    onClick={() => setTimeFilter(tf.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                        timeFilter === tf.value
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Grid/List */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-slate-500">暂无灵感</p>
                        <p className="text-sm text-slate-400 mt-1">试试其他搜索词，或新建一条灵感</p>
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
                                                renderAssetThumbnail(item.assets[0])
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <LayoutGrid size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                            <p className="text-sm text-slate-500 truncate">{item.description}</p>
                                            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${getUserColor(item.user_id)}`} />
                                                <span className="font-bold text-slate-600">{getOwnerName(item.user_id)}</span>
                                                <span className="text-slate-300">·</span>
                                                <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex gap-2 items-center">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100">
                                                {item.category}
                                            </span>
                                            {item.subcategory && (
                                                <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-100">
                                                    {item.subcategory}
                                                </span>
                                            )}
                                            {item.tags?.slice(0, 2).map(tag => (
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
                                                    ) : item.assets[0].type === 'pdf' ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-400 group-hover:bg-red-100 transition-colors">
                                                            <FileText size={48} />
                                                            <span className="text-xs font-bold mt-2 opacity-60">PDF</span>
                                                        </div>
                                                    ) : item.assets[0].type === 'website' ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100 transition-colors">
                                                            <Globe size={48} />
                                                            <span className="text-xs font-bold mt-2 opacity-60">网站</span>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={item.assets[0].content as string}
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
                                                <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                                                    <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold ${getUserColor(item.user_id)}`}>
                                                        {getOwnerName(item.user_id).charAt(0)}
                                                    </span>
                                                    <span className="font-medium text-slate-600">{getOwnerName(item.user_id)}</span>
                                                    <span className="text-slate-300">·</span>
                                                    <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                                                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                    {item.category}
                                                </span>
                                                {item.subcategory && (
                                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                        {item.subcategory}
                                                    </span>
                                                )}
                                                {item.tags?.slice(0, 2).map(tag => (
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
                            <h2 className="text-lg font-bold text-slate-900">灵感详情</h2>
                            <div className="flex items-center gap-2">
                                {!isEditing && isOwner(selectedItem) && (
                                    <button
                                        onClick={handleEditStart}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all"
                                        title="编辑灵感"
                                    >
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                            </svg>
                                        </div>
                                    </button>
                                )}
                                <button onClick={() => { setSelectedItem(null); setIsEditing(false); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto">
                            {/* Media Section: Editable vs View */}
                            {isEditing && editForm ? (
                                <div className="w-full bg-slate-50 border-b border-slate-100">
                                    {/* Primary Media (Preview) */}
                                    <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                                        {editForm.assets.length > 0 ? (
                                            <>
                                                {editForm.assets[activeAssetIndex] && renderAssetPreview(editForm.assets[activeAssetIndex])}
                                                <button
                                                    onClick={() => {
                                                        const newAssets = editForm.assets.filter((_, i) => i !== activeAssetIndex);
                                                        setEditForm({ ...editForm, assets: newAssets });
                                                        // Adjust index if needed
                                                        if (activeAssetIndex >= newAssets.length) {
                                                            setActiveAssetIndex(Math.max(0, newAssets.length - 1));
                                                        }
                                                    }}
                                                    className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors z-10"
                                                    title="移除"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">请添加图片或视频</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Editable Thumbnails */}
                                    <div className="p-4 flex gap-3 overflow-x-auto bg-white border-t border-slate-100 scrollbar-hide items-center">
                                        <label className="shrink-0 w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-slate-400 hover:text-indigo-500" title="支持图片、视频、PDF，单文件最大120MB">
                                            <Plus size={20} />
                                            <span className="text-[10px] font-bold">添加文件</span>
                                            <span className="text-[7px] opacity-70 leading-tight">图片/视频/PDF</span>
                                            <input type="file" className="hidden" accept="image/*,video/*,.pdf" multiple onChange={handleAssetUpload} />
                                        </label>

                                        <button
                                            onClick={handleAddLink}
                                            className="shrink-0 w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-slate-400 hover:text-indigo-500"
                                        >
                                            <LinkIcon size={20} />
                                            <span className="text-[10px] font-bold">添加链接</span>
                                        </button>

                                        {editForm.assets.map((asset, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setActiveAssetIndex(idx)}
                                                className={`shrink-0 w-24 h-24 rounded-lg overflow-hidden border shadow-sm relative group cursor-pointer transition-all ${activeAssetIndex === idx ? 'border-2 border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                {renderAssetThumbnail(asset)}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newAssets = editForm.assets.filter((_, i) => i !== idx);
                                                        setEditForm({ ...editForm, assets: newAssets });
                                                        // Adjust index if needed
                                                        if (activeAssetIndex === idx) {
                                                            setActiveAssetIndex(Math.max(0, idx - 1));
                                                        } else if (activeAssetIndex > idx) {
                                                            setActiveAssetIndex(activeAssetIndex - 1);
                                                        }
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Standard View Mode */
                                selectedItem.assets && selectedItem.assets.length > 0 && (
                                    <div className="w-full bg-slate-50 border-b border-slate-100">
                                        {/* Primary Media */}
                                        <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                                            {selectedItem.assets[activeAssetIndex] && renderAssetPreview(selectedItem.assets[activeAssetIndex])}
                                        </div>

                                        {/* Gallery Thumbnails (if more than 1) */}
                                        {selectedItem.assets.length > 1 && (
                                            <div className="p-4 flex gap-3 overflow-x-auto bg-white border-t border-slate-100 scrollbar-hide">
                                                {selectedItem.assets.map((asset, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setActiveAssetIndex(idx)}
                                                        className={`shrink-0 w-24 h-24 rounded-lg overflow-hidden border shadow-sm relative group cursor-pointer transition-all ${activeAssetIndex === idx ? 'border-2 border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}
                                                    >
                                                        {renderAssetThumbnail(asset)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            <div className="p-8">
                                <div className="flex items-center gap-3 text-xs font-bold tracking-wider text-slate-400 mb-4">
                                    <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${getUserColor(selectedItem.user_id)}`}>
                                        {getOwnerName(selectedItem.user_id).charAt(0)}
                                    </span>
                                    <span className="text-slate-600">{getOwnerName(selectedItem.user_id)}</span>
                                    <span>·</span>
                                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500">#{selectedItem.id.substring(0, 6)}</span>
                                    <span>·</span>
                                    <span>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                                </div>

                                {isEditing && editForm ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest pl-1 block mb-2">分类</label>
                                            <div className="flex flex-wrap gap-2">
                                                {CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setEditForm({
                                                            ...editForm,
                                                            category: cat,
                                                            subcategory: cat === DESIGN_CATEGORY ? SUBCATEGORIES[0] : null
                                                        })}
                                                        className={`px-4 h-9 rounded-lg text-sm font-bold transition-all ${
                                                            editForm.category === cat
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-indigo-300'
                                                        }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {editForm.category === DESIGN_CATEGORY && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 tracking-widest pl-1 block mb-2">子分类</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {SUBCATEGORIES.map(sub => (
                                                        <button
                                                            key={sub}
                                                            type="button"
                                                            onClick={() => setEditForm({ ...editForm, subcategory: sub })}
                                                            className={`px-3 h-9 rounded-lg text-sm font-bold transition-all ${
                                                                editForm.subcategory === sub
                                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-indigo-300'
                                                            }`}
                                                        >
                                                            {sub}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest pl-1 block mb-2">标题</label>
                                            <input
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest pl-1 block mb-2">自定义标签</label>
                                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[60px]">
                                                {editForm.tags.map(tag => (
                                                    <div key={tag} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-white text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold shadow-sm">
                                                        #{tag}
                                                        <button
                                                            onClick={() => setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) })}
                                                            className="p-0.5 hover:bg-slate-100 rounded-full transition-colors ml-0.5 text-slate-400 hover:text-red-500"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        const t = editTagInput.trim();
                                                        if (t && !editForm.tags.includes(t)) {
                                                            setEditForm({ ...editForm, tags: [...editForm.tags, t] });
                                                            setEditTagInput('');
                                                        }
                                                    }}
                                                    disabled={!editTagInput.trim()}
                                                    className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> 添加
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={editTagInput}
                                                onChange={(e) => setEditTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const t = editTagInput.trim();
                                                        if (t && !editForm.tags.includes(t)) {
                                                            setEditForm({ ...editForm, tags: [...editForm.tags, t] });
                                                            setEditTagInput('');
                                                        }
                                                    }
                                                }}
                                                placeholder="输入标签后按回车..."
                                                className="w-full h-9 px-3 mt-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest pl-1 block mb-2">信息来源</label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {SOURCE_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setEditForm({ ...editForm, source: editForm.source === opt ? null : opt })}
                                                        className={`px-3 h-9 rounded-lg text-sm font-bold transition-all ${
                                                            editForm.source === opt
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-indigo-300'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                placeholder="补充说明（选填）..."
                                                value={editForm.source_text}
                                                onChange={(e) => setEditForm({ ...editForm, source_text: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest pl-1 block mb-2">详细描述</label>
                                            <textarea
                                                className="w-full min-h-[150px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none leading-relaxed"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest pl-1 block mb-2">
                                                设计启示 <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none leading-relaxed"
                                                placeholder="这个灵感如何应用到我们的工作中？可以从设计方法、用户体验、技术实现等角度思考..."
                                                value={editForm.design_insight}
                                                onChange={(e) => setEditForm({ ...editForm, design_insight: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
                                            {selectedItem.title}
                                        </h1>

                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">分类</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full border border-indigo-200">
                                                        {selectedItem.category}
                                                    </span>
                                                    {selectedItem.subcategory && (
                                                        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-bold rounded-full border border-amber-200">
                                                            {selectedItem.subcategory}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">自定义标签</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedItem.tags?.map(tag => (
                                                        <span key={tag} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {(selectedItem.source || selectedItem.source_text) && (
                                                <div>
                                                    <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">信息来源</h3>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {selectedItem.source && (
                                                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-full border border-emerald-200">
                                                                {selectedItem.source}
                                                            </span>
                                                        )}
                                                        {selectedItem.source_text && (
                                                            <span className="text-sm text-slate-600">{selectedItem.source_text}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="prose prose-slate">
                                                <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">描述</h3>
                                                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                                    {selectedItem.description}
                                                </p>
                                            </div>

                                            {selectedItem.design_insight && (
                                                <div className="prose prose-slate">
                                                    <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">设计启示</h3>
                                                    <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                                        {selectedItem.design_insight}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <footer className={`p-4 border-t border-slate-100 bg-slate-50 ${isEditing ? 'grid grid-cols-2 gap-3' : 'flex'}`}>
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="h-12 flex items-center justify-center gap-2 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors bg-white border border-slate-200"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleEditSave}
                                        className="h-12 text-white flex items-center justify-center gap-2 font-bold rounded-xl shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 transition-all hover:translate-y-[-1px]"
                                    >
                                        保存修改
                                    </button>
                                </>
                            ) : isOwner(selectedItem) ? (
                                <button
                                    onClick={() => handleDelete(selectedItem.id)}
                                    className="h-12 w-full flex items-center justify-center gap-2 font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <Trash2 size={18} /> 删除灵感
                                </button>
                            ) : (
                                <div className="h-12 w-full flex items-center justify-center text-sm text-slate-400">
                                    由 {getOwnerName(selectedItem.user_id)} 分享
                                </div>
                            )}
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
