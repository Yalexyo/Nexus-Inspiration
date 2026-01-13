'use client';

import { useState, useEffect } from 'react';
import { Plus, X, ArrowLeft, Settings as SettingsIcon, Tag as TagIcon, Trash2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_TAGS = ['Design', 'Development', 'Product', 'Business', 'Life'];

export default function SettingsPage() {
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        // Load existing tags or set defaults
        const stored = localStorage.getItem('nexus_user_tags');
        if (stored) {
            setTags(JSON.parse(stored));
        } else {
            setTags(DEFAULT_TAGS);
            localStorage.setItem('nexus_user_tags', JSON.stringify(DEFAULT_TAGS));
        }
    }, []);

    const addTag = () => {
        if (newTag && !tags.includes(newTag)) {
            const updated = [...tags, newTag];
            setTags(updated);
            localStorage.setItem('nexus_user_tags', JSON.stringify(updated));
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        const updated = tags.filter(t => t !== tag);
        setTags(updated);
        localStorage.setItem('nexus_user_tags', JSON.stringify(updated));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-24">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <TagIcon size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Tag Management</h2>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            These tags help the AI organize your content. Adding more specific tags improves the auto-categorization accuracy.
                        </p>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* Add Tag Info */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Add New Tag
                            </label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="e.g. Architecture, Photography..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                />
                                <button
                                    className="bg-indigo-600 text-white p-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                                    onClick={addTag}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Tag List */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Active Tags ({tags.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <div
                                        key={tag}
                                        className="flex items-center gap-2 pl-4 pr-2 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                                    >
                                        {tag}
                                        <button
                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                            onClick={() => removeTag(tag)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                        <SettingsIcon size={16} className="text-slate-400" />
                        <span className="text-xs text-slate-500 font-medium">Changes are saved automatically to local storage</span>
                    </div>
                </div>

                <div className="mt-8 p-6 rounded-2xl bg-indigo-900 text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-2">Nexus Pro Perks</h3>
                        <p className="text-indigo-200 text-sm mb-4">Unlimited cloud sync, collaborative boards, and advanced AI models.</p>
                        <button className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-sm font-bold shadow-xl">Upgrade Soon</button>
                    </div>
                    <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-indigo-800/50" />
                </div>
            </main>
        </div>
    );
}

