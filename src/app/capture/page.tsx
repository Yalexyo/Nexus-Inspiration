'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    X,
    Image as ImageIcon,
    Link as LinkIcon,
    Sparkles,
    Trash2,
    Plus,
    Loader2,
    Video,
    Film,
    Play
} from 'lucide-react';
import { getAiSuggestions } from './actions';
import { saveInspiration, MediaAsset } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';

export default function CapturePage() {
    const router = useRouter();

    useEffect(() => {
        if (!getCurrentUser()) {
            router.replace('/');
        }
    }, [router]);

    // Form State
    const [description, setDescription] = useState('');
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // UI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isMediaLoading, setIsMediaLoading] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false); // Track analysis state
    const [predefinedTags, setPredefinedTags] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('nexus_user_tags');
        if (stored) {
            try {
                setPredefinedTags(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse tags", e);
            }
        }
    }, []);

    const handleAnalyze = async () => {
        if (!description.trim() || description.length < 5 || isAiLoading) return;

        setIsAiLoading(true);
        try {
            const result = await getAiSuggestions(description, predefinedTags);
            if (result.success && result.data) {
                setTitle(result.data.title);
                const newTags = [result.data.primary_tag, result.data.secondary_tag].filter(Boolean);
                setTags(prev => Array.from(new Set([...prev, ...newTags])));
                setHasAnalyzed(true); // Enable Save button
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title || !description) return;
        setIsSaving(true);

        try {
            await new Promise(r => setTimeout(r, 600)); // Smooth feeling
            await saveInspiration({
                title,
                description,
                assets,
                tags
            });
            router.push('/dashboard');
        } catch (error) {
            console.error("Save failed:", error);
            // Show a simple alert for now - UI could be fancier later
            // Show specific error for better debugging
            alert(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Reset file input value to allow selecting same file again
        e.target.value = '';

        for (const file of files) {
            // 120MB Check (120 * 1024 * 1024)
            if (file.size > 120 * 1024 * 1024) {
                alert(`File "${file.name}" is too large! Max size is 120MB.`);
                continue;
            }

            const type = file.type.startsWith('video/') ? 'video' : 'image';
            // Create Blob URL for instant preview (Zero-Copy)
            const preview = URL.createObjectURL(file);

            setAssets(prev => [...prev, {
                type,
                content: file, // Store actual File object
                preview // Store blob URL for UI
            }]);
        }
    };

    const removeAsset = (index: number) => {
        setAssets(prev => prev.filter((_, i) => i !== index));
    };

    const handleUrlClick = async () => {
        const url = prompt('Enter website URL (e.g., Dribbble, Pinterest, Blog):');
        if (!url) return;

        // If it's directly an image, just use it
        if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
            setAssets(prev => [...prev, { type: 'image', content: url, preview: url }]);
            return;
        }

        setIsMediaLoading(true);
        try {
            const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            const data = await res.json();

            if (data.success && data.url) {
                setAssets(prev => [...prev, { type: 'website', content: data.url }]);
            } else {
                // Fallback: use a generic website icon if preview fails, or just the URL
                setAssets(prev => [...prev, { type: 'website', content: url }]);
            }
        } catch (e) {
            console.error(e);
            setAssets(prev => [...prev, { type: 'website', content: url }]);
        } finally {
            setIsMediaLoading(false);
        }
    };

    return (
        <div className="h-[100dvh] w-full bg-slate-50 font-sans flex flex-col overflow-hidden">
            {/* Header */}
            <header className="shrink-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <X size={20} />
                </button>
                <div className="text-sm font-bold text-slate-900 uppercase tracking-wider">New Inspiration</div>
                <div className="w-9" />
            </header>

            {/* Main Content - Flex/Grid One Screen */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full">

                {/* Left: Media Zone */}
                <div className="relative shrink-0 md:flex-1 h-[45vh] md:h-full bg-slate-100 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col pt-4">

                    {/* Primary Preview Area */}
                    <div className="flex-1 min-h-0 px-4 md:px-8 flex items-center justify-center relative">
                        {assets.length > 0 ? (
                            <div className="w-full h-full flex flex-col">
                                <div className="flex-1 min-h-0 relative group rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
                                    {assets[0].type === 'video' ? (
                                        <video src={assets[0].preview} className="w-full h-full object-contain" controls />
                                    ) : (
                                        <img src={assets[0].preview} alt="" className="w-full h-full object-contain" />
                                    )}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => removeAsset(0)}
                                            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                                {isMediaLoading ? (
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                                        <span className="text-xs font-medium text-slate-500 animate-pulse">Fetching Preview...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center shadow-sm mb-4">
                                            <ImageIcon size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primary Asset</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Thumbnails / Controls Area */}
                    <div className="shrink-0 p-4 md:p-6 bg-slate-50/50">
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            <label className="shrink-0 w-20 h-20 bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group relative">
                                <Plus size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">Add Files</span>
                                <span className="text-[8px] text-slate-400/70 absolute bottom-1">Max 150MB</span>
                                <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                            </label>

                            <button
                                onClick={handleUrlClick}
                                className="shrink-0 w-20 h-20 bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                            >
                                <LinkIcon size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">Add Link</span>
                            </button>

                            {/* Remaining Thumbnails */}
                            {assets.slice(1).map((ctx, idx) => (
                                <div key={idx} className="shrink-0 w-20 h-20 bg-white rounded-xl border border-slate-200 overflow-hidden relative group shadow-sm">
                                    {ctx.type === 'video' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                            <Play size={20} className="text-white fill-white" />
                                        </div>
                                    ) : (
                                        <img src={ctx.preview} alt="" className="w-full h-full object-cover" />
                                    )}
                                    <button
                                        onClick={() => removeAsset(idx + 1)}
                                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Input Zone (Scrollable content, Fixed footer) */}
                <div className="flex-1 flex flex-col h-full bg-white md:max-w-md w-full">

                    {/* Scrollable Inputs */}
                    <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">

                        {/* 01. Context */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">01 / Observation</label>
                            <textarea
                                className="w-full min-h-[100px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none leading-relaxed"
                                placeholder="Describe what you see..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* 02. Identity */}
                        <div className={`space-y-2 transition-all duration-300 ${hasAnalyzed || isAiLoading ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">02 / Identity</label>
                            {isAiLoading ? (
                                <div className="h-12 w-full bg-slate-50 rounded-xl animate-pulse" />
                            ) : (
                                <input
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                    placeholder="AI generated title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            )}
                        </div>

                        {/* 03. Tags */}
                        <div className={`space-y-2 transition-all duration-500 ${hasAnalyzed || isAiLoading ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">03 / Classifiers</label>
                            {isAiLoading ? (
                                <div className="flex gap-2">
                                    <div className="h-7 w-20 bg-slate-50 rounded-full animate-pulse" />
                                    <div className="h-7 w-28 bg-slate-50 rounded-full animate-pulse" />
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <div key={tag} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold animate-in zoom-in duration-300">
                                            #{tag}
                                            <button
                                                onClick={() => setTags(tags.filter(t => t !== tag))}
                                                className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors ml-0.5"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const t = prompt('Add tag:');
                                            if (t) setTags([...tags, t]);
                                        }}
                                        className="h-6 w-6 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions - Dynamic Workflow */}
                    <div className="shrink-0 p-5 md:p-6 border-t border-slate-100 bg-white z-10">
                        {hasAnalyzed ? (
                            <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                                {/* SAVE Button - Primary */}
                                <button
                                    onClick={handleSave}
                                    disabled={!title || isSaving}
                                    className="flex-1 bg-indigo-600 text-white h-12 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                    Save Inspiration
                                </button>

                                {/* Magic Analyze - Secondary (Re-run) */}
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAiLoading}
                                    className="h-12 w-12 flex items-center justify-center bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors"
                                    title="Re-Analyze"
                                >
                                    <Sparkles size={18} className={isAiLoading ? "animate-spin" : ""} />
                                </button>
                            </div>
                        ) : (
                            /* Magic Analyze - Initial Action */
                            <button
                                onClick={handleAnalyze}
                                disabled={!description.trim() || description.length < 5 || isAiLoading}
                                className="w-full bg-white text-indigo-600 border-2 border-indigo-100 h-12 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:border-indigo-200 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Sparkles size={18} className={isAiLoading ? "animate-spin" : "fill-indigo-600"} />
                                {isAiLoading ? 'Analyzing Context...' : 'Magic Analyze'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Loading Overlay (Saving) */}
            {isSaving && (
                <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <span className="font-bold text-slate-600 text-sm animate-pulse">Saving...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
