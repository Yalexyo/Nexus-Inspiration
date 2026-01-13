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
    Loader2
} from 'lucide-react';
import { getAiSuggestions } from './actions';
import { saveInspiration } from '@/lib/storage';

export default function CapturePage() {
    const router = useRouter();

    // Form State
    const [description, setDescription] = useState('');
    const [mediaType, setMediaType] = useState<'url' | 'upload'>('url');
    const [mediaContent, setMediaContent] = useState('');
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // UI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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

    const handleBlurDescription = async () => {
        if (!description.trim() || description.length < 5 || isAiLoading) return;

        setIsAiLoading(true);
        try {
            const result = await getAiSuggestions(description, predefinedTags);
            if (result.success && result.data) {
                setTitle(result.data.title);
                const newTags = [result.data.primary_tag, result.data.secondary_tag].filter(Boolean);
                setTags(prev => Array.from(new Set([...prev, ...newTags])));
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
            saveInspiration({
                title,
                description,
                mediaType,
                mediaContent,
                tags
            });
            router.push('/dashboard');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaContent(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
            {/* Header */}
            <header className="shrink-0 z-50 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-600"
                >
                    <X size={22} />
                </button>
                <div className="text-sm font-semibold text-slate-800 uppercase tracking-widest">Capture</div>
                <button
                    onClick={handleSave}
                    disabled={!title || !description || isSaving}
                    className="bg-indigo-600 text-white rounded-full px-5 py-1.5 text-sm font-medium disabled:opacity-30 disabled:grayscale transition-all"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
                </button>
            </header>

            <div className="flex-1 overflow-y-auto pb-10">
                {/* Media Zone */}
                <div className="w-full h-[35vh] bg-slate-50 relative border-b border-slate-100 group">
                    {mediaContent ? (
                        <div className="relative w-full h-full">
                            <img src={mediaContent} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button
                                onClick={() => setMediaContent('')}
                                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur shadow-lg p-2.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                                <ImageIcon size={28} className="text-slate-300" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-medium text-slate-500">Add visuals</span>
                                <span className="text-xs text-slate-400 mt-1">Inspire your future self</span>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <label className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer hover:bg-indigo-100 transition-colors">
                                    <Plus size={14} />
                                    Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                                <button
                                    onClick={() => {
                                        const url = prompt('Enter image URL:');
                                        if (url) setMediaContent(url);
                                    }}
                                    className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    <LinkIcon size={14} />
                                    URL
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Zone */}
                <div className="p-6 flex flex-col gap-8">
                    {/* User Raw Thoughts */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chaos to Order</label>
                            <button
                                onClick={handleBlurDescription}
                                disabled={!description.trim() || description.length < 5 || isAiLoading}
                                className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700 disabled:opacity-30 transition-all group"
                            >
                                <Sparkles size={12} className={isAiLoading ? "animate-spin" : "group-hover:rotate-12 transition-transform"} />
                                Magic Analyze
                            </button>
                        </div>
                        <textarea
                            className="w-full text-lg md:text-xl text-slate-800 placeholder:text-slate-300 resize-none outline-none bg-transparent min-h-[120px] leading-relaxed transition-all focus:placeholder:opacity-50"
                            placeholder="Sunlight hitting a weathered brick wall in Kyoto, creating long shadows and a sense of wabi-sabi..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleBlurDescription}
                        />
                    </div>

                    {/* AI Interpretation (Title) */}
                    {(isAiLoading || title || description.length > 20) && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-6 border-t border-slate-50">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">
                                <Sparkles size={12} />
                                {isAiLoading ? 'Analyzing Intent...' : 'Target Identity'}
                            </label>

                            {isAiLoading ? (
                                <div className="h-10 w-3/4 bg-slate-50 animate-pulse rounded-lg border-2 border-dashed border-indigo-100" />
                            ) : (
                                <input
                                    className="w-full text-2xl font-black text-black border-none outline-none bg-transparent placeholder:text-slate-200 uppercase tracking-tighter"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={description.length > 5 ? "WAITING FOR AI..." : "DRAFTING IDENTITY..."}
                                />
                            )}
                        </div>
                    )}

                    {/* Tags Zone */}
                    {(isAiLoading || tags.length > 0) && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Perspective Tags</label>

                            {isAiLoading ? (
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-full" />
                                    <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-full" />
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <div key={tag} className="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full text-sm border border-slate-100 group">
                                            #{tag}
                                            <button
                                                onClick={() => setTags(tags.filter(t => t !== tag))}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const t = prompt('Add tag:');
                                            if (t) setTags([...tags, t.replace('#', '')]);
                                        }}
                                        className="w-9 h-9 border border-dashed border-slate-200 rounded-full flex items-center justify-center text-slate-300 hover:border-indigo-300 hover:text-indigo-400 transition-all"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Zone */}
                    <div className="pt-10 border-t-2 border-black mt-10">
                        <button
                            onClick={handleSave}
                            disabled={!title || !description || isSaving}
                            className="w-full bg-black text-white py-6 text-xl font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_rgba(0,0,0,0.1)] hover:bg-indigo-600 active:translate-y-1 active:shadow-none transition-all disabled:opacity-20 disabled:grayscale disabled:pointer-events-none flex items-center justify-center gap-4"
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <Plus size={24} strokeWidth={3} />
                                    Save Inspiration
                                </>
                            )}
                        </button>
                        <p className="mt-4 text-[10px] text-slate-400 font-mono text-center uppercase tracking-widest">
                            PERSISTING TO LOCAL_DATABASE v2.0
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual Feedback on Save */}
            {isSaving && (
                <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in zoom-in duration-300">
                        <Sparkles className="animate-bounce" />
                        <span className="font-semibold text-lg">Inspiration captured</span>
                    </div>
                </div>
            )}
        </div>
    );
}

