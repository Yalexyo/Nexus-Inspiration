'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getInspirationById } from '@/lib/storage';
import type { Inspiration, MediaAsset } from '@/lib/storage';
import { getUsers } from '@/lib/auth';
import { Loader2, FileText, Globe, Play, ExternalLink, ArrowLeft } from 'lucide-react';
import MushroomCardIcon from '@/components/MushroomCardIcon';

const USER_COLORS: Record<string, string> = {
    'user_01': 'bg-blue-500',
    'user_02': 'bg-emerald-500',
    'user_03': 'bg-amber-500',
    'user_04': 'bg-rose-500',
    'user_05': 'bg-purple-500',
};
const getUserColor = (userId: string) => USER_COLORS[userId] || 'bg-slate-400';

function getOwnerName(userId: string): string {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId;
}

function renderAssetPreview(asset: MediaAsset) {
    const content = typeof asset.content === 'string' ? asset.content : '';
    if (asset.type === 'video') {
        return <video src={content} className="w-full h-full object-contain" controls />;
    }
    if (asset.type === 'pdf') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 gap-4">
                <FileText size={64} className="text-red-500" />
                <a href={content} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <ExternalLink size={16} /> 打开 PDF
                </a>
            </div>
        );
    }
    if (asset.type === 'website') {
        let hostname = 'Link';
        try { hostname = new URL(content).hostname; } catch {}
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-500 gap-4 p-8">
                <Globe size={64} />
                <p className="text-sm text-slate-600 text-center break-all max-w-lg">{content}</p>
                <a href={content} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <ExternalLink size={16} /> 访问 {hostname}
                </a>
            </div>
        );
    }
    return <img src={content} alt="" className="w-full h-full object-contain" />;
}

function renderAssetThumbnail(asset: MediaAsset) {
    const content = typeof asset.content === 'string' ? asset.content : '';
    if (asset.type === 'video') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <Play size={16} className="text-white fill-white" />
            </div>
        );
    }
    if (asset.type === 'pdf') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500">
                <FileText size={24} />
            </div>
        );
    }
    if (asset.type === 'website') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500">
                <Globe size={24} />
            </div>
        );
    }
    return <img src={content} alt="" className="w-full h-full object-cover" />;
}

export default function ViewPage() {
    const params = useParams();
    const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
    const [item, setItem] = useState<Inspiration | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeAssetIndex, setActiveAssetIndex] = useState(0);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            const data = await getInspirationById(id);
            if (cancelled) return;
            if (!data) {
                setNotFound(true);
            } else {
                setItem(data);
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [id]);

    return (
        <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col">
            {/* Header */}
            <header className="shrink-0 w-full h-16 bg-white border-b border-slate-200 z-50 shadow-sm">
                <div className="w-full max-w-4xl mx-auto px-6 flex items-center justify-between h-full">
                    <Link href="/dashboard" className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-indigo-600">
                            <MushroomCardIcon size={22} />
                        </div>
                        灵感卡片
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <ArrowLeft size={16} /> 浏览全部
                        </Link>
                        <Link href="/" className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
                            登录
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-8">
                {loading && (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                    </div>
                )}

                {notFound && (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
                        <p className="font-bold text-slate-500 text-lg">灵感不存在</p>
                        <p className="text-sm text-slate-400">这条灵感可能已被删除</p>
                        <Link href="/dashboard" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all">
                            浏览全部灵感
                        </Link>
                    </div>
                )}

                {item && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Media */}
                        {item.assets && item.assets.length > 0 && (
                            <div className="bg-slate-50 border-b border-slate-100">
                                <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                                    {item.assets[activeAssetIndex] && renderAssetPreview(item.assets[activeAssetIndex])}
                                </div>
                                {item.assets.length > 1 && (
                                    <div className="p-4 flex gap-3 overflow-x-auto bg-white border-t border-slate-100 scrollbar-hide">
                                        {item.assets.map((asset, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setActiveAssetIndex(idx)}
                                                className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border shadow-sm cursor-pointer transition-all ${activeAssetIndex === idx ? 'border-2 border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                {renderAssetThumbnail(asset)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-6 md:p-8">
                            {/* Metadata header */}
                            <div className="flex items-center gap-3 text-xs font-bold tracking-wider text-slate-400 mb-4">
                                <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${getUserColor(item.user_id)}`}>
                                    {getOwnerName(item.user_id).charAt(0)}
                                </span>
                                <span className="text-slate-600">{getOwnerName(item.user_id)}</span>
                                <span>·</span>
                                <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500">#{item.id.substring(0, 6)}</span>
                                <span>·</span>
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-black text-slate-900 mb-6 leading-tight">{item.title}</h1>

                            <div className="space-y-6">
                                {/* 分类 */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">分类</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full border border-indigo-200">
                                            {item.category}
                                        </span>
                                        {item.subcategory && (
                                            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-bold rounded-full border border-amber-200">
                                                {item.subcategory}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 自定义标签 */}
                                {item.tags && item.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">自定义标签</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 信息来源 */}
                                {(item.source || item.source_text) && (
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">信息来源</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.source && (
                                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-full border border-emerald-200">
                                                    {item.source}
                                                </span>
                                            )}
                                            {item.source_text && (
                                                <span className="text-sm text-slate-600">{item.source_text}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 描述 */}
                                {item.description && (
                                    <div className="prose prose-slate">
                                        <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">描述</h3>
                                        <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                            {item.description}
                                        </p>
                                    </div>
                                )}

                                {/* 设计启示 */}
                                {item.design_insight && (
                                    <div className="prose prose-slate">
                                        <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-3">设计启示</h3>
                                        <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                            {item.design_insight}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
