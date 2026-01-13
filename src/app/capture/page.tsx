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
    return (
        <div className="flex flex-col h-screen bg-white font-sans max-w-md mx-auto shadow-[0_0_40px_rgba(0,0,0,0.1)] relative overflow-hidden border-x border-slate-200">
            {/* Header - Swiss Style: Clean, Centered, Bold */}
            <header className="shrink-0 z-50 h-16 bg-white border-b-2 border-black flex items-center justify-between px-6">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black"
                >
                    <X size={24} strokeWidth={2} />
                </button>
                <div className="text-lg font-black text-black uppercase tracking-[0.2em]">Capture</div>
                <div className="w-8" /> {/* Spacer for balance */}
            </header>

            <div className="flex-1 overflow-y-auto pb-10">
                {/* Media Zone - Technical Grid Background */}
                <div className="w-full h-[40vh] bg-[#f0f0f0] relative border-b-2 border-black group overflow-hidden">
                    {/* CSS Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    {mediaContent ? (
                        <div className="relative w-full h-full">
                            <img src={mediaContent} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => setMediaContent('')}
                                    className="bg-white text-black px-6 py-3 font-mono text-xs uppercase cursor-pointer hover:bg-red-600 hover:text-white transition-colors border-2 border-transparent hover:border-white"
                                >
                                    Remove Asset
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-6 z-10 relative">
                            <div className="w-20 h-20 border-2 border-slate-300 flex items-center justify-center bg-white">
                                <ImageIcon size={32} className="text-slate-300" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-mono text-xs uppercase tracking-widest text-slate-500">Visual Input Required</span>
                            </div>

                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 bg-black text-white px-6 py-3 font-mono text-xs uppercase cursor-pointer hover:bg-indigo-600 transition-colors border-2 border-transparent hover:border-indigo-600">
                                    <Plus size={14} />
                                    Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                                <button
                                    onClick={() => {
                                        const url = prompt('Enter image URL:');
                                        if (url) setMediaContent(url);
                                    }}
                                    className="flex items-center gap-2 bg-white text-black border-2 border-black px-6 py-3 font-mono text-xs uppercase hover:bg-black hover:text-white transition-colors"
                                >
                                    <LinkIcon size={14} />
                                    URL Link
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Zone */}
                <div className="p-8 flex flex-col gap-10">
                    {/* User Raw Thoughts */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b pb-2 border-black">
                            <label className="font-mono text-xs font-bold text-black uppercase tracking-widest">01 / Observation</label>
                            <button
                                onClick={handleBlurDescription}
                                disabled={!description.trim() || description.length < 5 || isAiLoading}
                                className="flex items-center gap-2 font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:bg-indigo-600 hover:text-white px-2 py-1 transition-all group disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-indigo-600"
                            >
                                <Sparkles size={12} className={isAiLoading ? "animate-spin" : "group-hover:rotate-12 transition-transform"} />
                                Magic Analyze
                            </button>
                        </div>
                        <textarea
                            className="w-full text-xl md:text-2xl font-serif text-black placeholder:text-gray-300 resize-none outline-none bg-transparent min-h-[140px] leading-relaxed p-0 rounded-none border-b border-gray-100 focus:border-black transition-colors"
                            placeholder="Describe what you see..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleBlurDescription}
                            style={{ borderRadius: 0 }}
                        />
                    </div>

                    {/* AI Interpretation (Title) */}
                    {(isAiLoading || title || description.length > 20) && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center justify-between border-b pb-2 border-black mb-4">
                                <label className="font-mono text-xs font-bold text-black uppercase tracking-widest">
                                    02 / Identity
                                </label>
                                {isAiLoading && <span className="font-mono text-[10px] animate-pulse">PROCESSING...</span>}
                            </div>

                            {isAiLoading ? (
                                <div className="h-12 w-full bg-gray-100 animate-pulse border-l-4 border-black" />
                            ) : (
                                <input
                                    className="w-full text-3xl font-black text-black border-none outline-none bg-transparent placeholder:text-gray-200 uppercase tracking-tighter"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="WAITING FOR AI..."
                                    style={{ borderRadius: 0 }}
                                />
                            )}
                        </div>
                    )}

                    {/* Tags Zone */}
                    {(isAiLoading || tags.length > 0) && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between border-b pb-2 border-black mb-4">
                                <label className="font-mono text-xs font-bold text-black uppercase tracking-widest">03 / Classifiers</label>
                            </div>

                            {isAiLoading ? (
                                <div className="flex gap-2">
                                    <div className="h-8 w-24 bg-gray-100 animate-pulse border border-gray-200" />
                                    <div className="h-8 w-32 bg-gray-100 animate-pulse border border-gray-200" />
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {tags.map(tag => (
                                        <div key={tag} className="flex items-center gap-2 bg-white text-black px-3 py-1.5 font-mono text-xs border border-black hover:bg-black hover:text-white transition-colors group cursor-default">
                                            #{tag}
                                            <button
                                                onClick={() => setTags(tags.filter(t => t !== tag))}
                                                className="text-gray-400 group-hover:text-white hover:text-red-500 transition-colors ml-1"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const t = prompt('Add tag:');
                                            if (t) setTags([...tags, t.replace('#', '')]);
                                        }}
                                        className="w-8 h-8 border border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-all"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Zone */}
                    <div className="pt-8 mt-4 border-t-2 border-black">
                        <button
                            onClick={handleSave}
                            disabled={!title || !description || isSaving}
                            className="w-full bg-black text-white py-6 text-lg font-bold font-mono uppercase tracking-widest hover:bg-indigo-600 active:translate-y-[2px] transition-all disabled:opacity-20 disabled:grayscale disabled:pointer-events-none flex items-center justify-center gap-3 border-2 border-transparent"
                            style={{ borderRadius: 0 }}
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>Save Record</span>
                                    <Plus size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Visual Feedback on Save */}
            {isSaving && (
                <div className="fixed inset-0 z-[100] bg-white/80 backdrop-grayscale flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-black text-white px-10 py-6 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300 border-2 border-white outline outline-2 outline-black">
                        <Sparkles className="animate-spin" size={32} />
                        <span className="font-mono text-sm uppercase tracking-widest">Archiving Data...</span>
                    </div>
                </div>
            )}
        </div>
    );
}

