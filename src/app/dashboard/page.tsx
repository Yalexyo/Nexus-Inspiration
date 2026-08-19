'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUsers } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import VideoThumb from "@/components/VideoThumb";
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
    Film,
    LogOut,
    Check,
    Globe,
    Link as LinkIcon,
    FileText,
    MessageSquare,
    Send,
    Heart,
    Hash,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { getInspirations, Inspiration, deleteInspiration, updateInspiration, setFollowUp, toggleFavorite, fetchLinkTitle, getComments, addComment, deleteComment, Comment, MediaAsset, CATEGORIES, Category, SUBCATEGORIES, Subcategory, DESIGN_CATEGORY, SOURCE_OPTIONS, SourceOption, FOLLOW_UPS, FollowUp } from '@/lib/storage';
import MushroomCardIcon from '@/components/MushroomCardIcon';

const USER_COLORS: Record<string, string> = {
    'user_01': 'bg-blue-500',
    'user_02': 'bg-emerald-500',
    'user_03': 'bg-amber-500',
    'user_04': 'bg-orange-600',   // Xu：原来是 rose-500，跟收藏红心撞色，换成偏橙红拉开
    'user_05': 'bg-purple-500',
};
const getUserColor = (userId: string) => USER_COLORS[userId] || 'bg-slate-400';

// 后续动作标签的配色。四个底色都验过白字对比度（WCAG AA 要求小号正文 ≥ 4.5:1）：
//   #0369a1 蓝 5.93:1 · #b45309 橙 5.02:1 · #047857 绿 5.48:1 · #7c3aed 紫 5.70:1
// 直接写十六进制而不用 Tailwind 色名：v4 调色板是 OKLCH 换算的，色名对应的实际值可能变，
// 那样算出来的对比度就不作数了。改色务必重算对比度。
const FOLLOW_UP_STYLE: Record<FollowUp, { bg: string }> = {
    '继续深入调查':     { bg: '#0369a1' },
    '内容结构进一步优化': { bg: '#b45309' },
    '升级成分享内容':   { bg: '#047857' },
    '考虑项目应用':     { bg: '#7c3aed' },
};

// 卡片左上角的角标：实色底 + 白字。压在封面图上时靠一圈白描边和投影跟背景分开
function FollowUpBadge({ value, size = 'md' }: { value: FollowUp | null; size?: 'sm' | 'md' }) {
    if (!value) return null;
    const sm = size === 'sm';
    return (
        <span
            className={`inline-flex items-center rounded-md font-bold text-white shadow-sm ring-1 ring-white/70 whitespace-nowrap ${sm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'}`}
            style={{ backgroundColor: FOLLOW_UP_STYLE[value].bg }}
        >
            {value}
        </span>
    );
}

const TIME_FILTERS = [
    { value: 'all',   label: '全部' },
    { value: 'month', label: '本月' },
] as const;

// 'custom' 不在上面的固定档位里，它由日历按钮选出来的具体年月驱动
type TimeFilter = (typeof TIME_FILTERS)[number]['value'] | 'custom';
type YearMonth = { y: number; m: number };   // m 用 0-11，跟 Date 保持一致，省得两套下标

// 时间口径的单一真源。返回左闭右开区间，to 为 null 表示「到现在为止」。
// 指定月份必须有右边界，否则选 5 月会把 6 月之后的也算进来
function timeRange(value: TimeFilter, custom: YearMonth | null): { from: Date; to: Date | null } | null {
    const now = new Date();
    if (value === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    if (value === 'custom' && custom) {
        return { from: new Date(custom.y, custom.m, 1), to: new Date(custom.y, custom.m + 1, 1) };
    }
    return null;
}

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
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [copiedShare, setCopiedShare] = useState(false);
    // 评论：跟着详情面板走，打开哪条就拉哪条的
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentDraft, setCommentDraft] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    // 编辑态里拖拽排序附件用。第一个 = 头图
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [followUpFilter, setFollowUpFilter] = useState<FollowUp | 'none' | null>(null);
    const [customMonth, setCustomMonth] = useState<YearMonth | null>(null);
    const [monthPickerOpen, setMonthPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    // 换时间维度时让结果区闪一下：不给反馈的话，切过去看着像什么都没发生
    const [refreshing, setRefreshing] = useState(false);
    const [favOnly, setFavOnly] = useState(false);

    const getOwnerName = (userId: string) => {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        return user ? user.name : userId;
    };

    const isOwner = (item: Inspiration) => currentUserId === item.user_id;

    // Auth Check (allow view-only for non-logged-in visitors)
    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setCurrentUserId(user.id);
            setIsViewOnly(false);
        } else {
            setCurrentUserId('');
            setIsViewOnly(true);
        }

        const load = async () => {
            const data = await getInspirations();
            setInspirations(data);
            setFiltered(data);
        };
        load();
    }, [router]);

    // 详情面板打开/切换时拉评论
    useEffect(() => {
        if (!selectedItem) { setComments([]); setCommentDraft(''); return; }
        let cancelled = false;
        setCommentsLoading(true);
        getComments(selectedItem.id).then(list => {
            if (!cancelled) { setComments(list); setCommentsLoading(false); }
        });
        return () => { cancelled = true; };
    }, [selectedItem?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

    // 发表评论后同步更新卡片上的计数，不用整表重拉
    const syncCounts = (list: Comment[]) => {
        if (!selectedItem) return;
        const cnt = list.length;
        const people = new Set(list.map(c => c.user_id)).size;
        setInspirations(all => all.map(i =>
            i.id === selectedItem.id ? { ...i, comment_count: cnt, commenter_count: people } : i));
        setSelectedItem(cur => cur ? { ...cur, comment_count: cnt, commenter_count: people } : cur);
    };

    // 把第 from 个附件挪到第 to 个位置。数组第一个就是卡片头图
    const moveAsset = (from: number, to: number) => {
        if (!editForm || from === to || to < 0 || to >= editForm.assets.length) return;
        const next = [...editForm.assets];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setEditForm({ ...editForm, assets: next });
        // 让预览跟着被移动的那张走，不然选中框会跳到别的图上
        setActiveAssetIndex(to);
    };

    const handleAddComment = async () => {
        const text = commentDraft.trim();
        if (!selectedItem || !text || postingComment || isViewOnly) return;
        setPostingComment(true);
        try {
            const created = await addComment(selectedItem.id, text);
            const next = [...comments, created];
            setComments(next); syncCounts(next); setCommentDraft('');
        } catch (e) {
            alert(e instanceof Error ? e.message : '评论失败');
        } finally {
            setPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!selectedItem || !confirm('删除这条评论？')) return;
        const next = comments.filter(c => c.id !== commentId);
        const prev = comments;
        setComments(next); syncCounts(next);
        try {
            await deleteComment(selectedItem.id, commentId);
        } catch (e) {
            setComments(prev); syncCounts(prev);
            alert(e instanceof Error ? e.message : '删除失败');
        }
    };

    // 每个后续动作各有多少条，供筛选栏显示计数
    // 淡出 → 换内容 → 淡入。内容其实是立刻换的，这层淡入淡出只是让人看见「刷新了」
    const pulseResults = () => {
        setRefreshing(true);
        window.setTimeout(() => setRefreshing(false), 170);
    };
    const pickTimeFilter = (v: TimeFilter) => {
        setCustomMonth(null);
        setTimeFilter(v);
        setMonthPickerOpen(false);
        pulseResults();
    };
    const pickMonth = (y: number, m: number) => {
        setCustomMonth({ y, m });
        setTimeFilter('custom');
        setMonthPickerOpen(false);
        pulseResults();
    };

    // 每个年月各有多少条 + 数据覆盖的年份范围，供选月面板用
    const monthStats = (() => {
        const m = new Map<string, number>();
        let min = new Date().getFullYear(), max = min;
        inspirations.forEach(i => {
            const d = new Date(i.createdAt);
            const y = d.getFullYear();
            if (y < min) min = y;
            if (y > max) max = y;
            const k = `${y}-${d.getMonth()}`;
            m.set(k, (m.get(k) || 0) + 1);
        });
        return { counts: m, minYear: min, maxYear: max };
    })();

    const followUpStats = (() => {
        const m = new Map<FollowUp | 'none', number>();
        inspirations.forEach(i => {
            const k = (i.follow_up || 'none') as FollowUp | 'none';
            m.set(k, (m.get(k) || 0) + 1);
        });
        return m;
    })();

    const favCount = inspirations.filter(i => i.favorited).length;

    // 收藏：先改本地再发请求，失败回滚。收藏是私人的，不影响别人看到的内容
    const handleToggleFavorite = async (item: Inspiration, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (isViewOnly) { alert('请先登录再收藏'); return; }
        const next = !item.favorited;
        const apply = (fav: boolean, delta: number) => {
            setInspirations(list => list.map(i => i.id === item.id
                ? { ...i, favorited: fav, favorite_count: Math.max(0, (i.favorite_count || 0) + delta) } : i));
            setSelectedItem(cur => cur && cur.id === item.id
                ? { ...cur, favorited: fav, favorite_count: Math.max(0, (cur.favorite_count || 0) + delta) } : cur);
        };
        apply(next, next ? 1 : -1);
        try {
            await toggleFavorite(item.id, next);
        } catch (err) {
            apply(!next, next ? -1 : 1);
            alert(err instanceof Error ? err.message : '操作失败');
        }
    };

    const handleShare = (id: string) => {
        const url = `${window.location.origin}/view/${id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedShare(true);
            setTimeout(() => setCopiedShare(false), 2000);
        });
    };

    // Reset subcategory filter when category filter changes
    // 全屏详情没有遮罩可点，ESC 兜底关闭（编辑态不关，防误触丢草稿）
    useEffect(() => {
        if (!selectedItem) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isEditing) { setSelectedItem(null); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedItem, isEditing]);

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
        if (followUpFilter) {
            result = followUpFilter === 'none'
                ? result.filter(i => !i.follow_up)
                : result.filter(i => i.follow_up === followUpFilter);
        }
        if (favOnly) {
            result = result.filter(i => i.favorited);
        }
        const range = timeRange(timeFilter, customMonth);
        if (range) {
            result = result.filter(i => {
                const t = new Date(i.createdAt);
                return t >= range.from && (!range.to || t < range.to);
            });
        }
        if (search) {
            const q = search.toLowerCase();
            const qNum = search.trim().replace(/^#/, ''); // support "#1" input
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.category?.toLowerCase().includes(q) ||
                i.subcategory?.toLowerCase().includes(q) ||
                i.tags?.some(t => t.toLowerCase().includes(q)) ||
                (/^\d+$/.test(qNum) && String(i.card_no) === qNum)
            );
        }
        setFiltered(result);
    }, [search, inspirations, categoryFilter, subcategoryFilter, userFilter, timeFilter, customMonth, followUpFilter, favOnly]);

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

    // 标后续动作：单选，点已选中的那个就是取消。乐观更新 + 失败回滚
    const handleSetFollowUp = async (value: FollowUp | null) => {
        if (!selectedItem || isViewOnly) return;   // 全员可标，只要求已登录
        const target = selectedItem.id;
        const prev = selectedItem.follow_up;
        const prevBy = selectedItem.follow_up_by;
        const apply = (v: FollowUp | null, by: string | null) => {
            setSelectedItem(cur => (cur && cur.id === target ? { ...cur, follow_up: v, follow_up_by: by } : cur));
            setInspirations(list => list.map(i => (i.id === target ? { ...i, follow_up: v, follow_up_by: by } : i)));
        };
        apply(value, value ? currentUserId : null);
        try {
            await setFollowUp(target, value);
        } catch (e) {
            apply(prev, prevBy);
            alert('标记失败：' + (e instanceof Error ? e.message : '未知错误'));
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
            // 原始文件名当显示名，PDF 尤其需要——否则界面上只有一串 uuid
            newAssets.push({ type, content: file, preview, title: file.name });
        }

        setEditForm(prev => prev ? { ...prev, assets: [...prev.assets, ...newAssets] } : null);
    };

    const handleAddLink = async () => {
        if (!editForm) return;
        const url = prompt('请输入网址：');
        if (!url) return;
        // 先加进去（标题留空），再异步补标题，不让用户等抓取
        setEditForm(prev => prev ? {
            ...prev,
            assets: [...prev.assets, { type: 'website', content: url }]
        } : null);
        const title = await fetchLinkTitle(url);
        if (!title) return;
        setEditForm(prev => prev ? {
            ...prev,
            assets: prev.assets.map(a =>
                a.type === 'website' && a.content === url && !a.title ? { ...a, title } : a)
        } : null);
    };

    const renderAssetThumbnail = (asset: MediaAsset, className: string = "w-full h-full object-cover") => {
        if (asset.type === 'video') {
            return (
                <VideoThumb
                    src={asset.preview || (typeof asset.content === 'string' ? asset.content : '')}
                    iconSize={14}
                />
            );
        } else if (asset.type === 'pdf') {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 gap-1 p-2 text-center" title={asset.title || 'PDF'}>
                    <FileText size={24} />
                    <span className="text-[10px] leading-tight font-medium line-clamp-2 w-full px-1 break-all">
                        {asset.title || 'PDF'}
                    </span>
                </div>
            );
        } else if (asset.type === 'website') {
            return (
                <div
                    className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-500 gap-1 p-2 text-center"
                    title={asset.title || (typeof asset.content === 'string' ? asset.content : 'Link')}
                >
                    <Globe size={24} />
                    <span className="text-[10px] leading-tight font-medium line-clamp-2 w-full px-1 break-all">
                        {asset.title || (typeof asset.content === 'string' ? (() => { try { return new URL(asset.content as string).hostname; } catch { return 'Link'; } })() : 'Link')}
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
            const videoSrc = asset.preview || (typeof asset.content === 'string' ? asset.content as string : '');
            return (
                <video
                    // 同封面逻辑：未播放时停在第一帧，而不是一片黑
                    src={videoSrc.includes('#') ? videoSrc : `${videoSrc}#t=0.1`}
                    className="max-h-full max-w-full"
                    preload="metadata"
                    playsInline
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
                        <h3 className="font-bold text-slate-900 text-lg mb-1 break-all">{asset.title || 'PDF Document'}</h3>
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
                        <h3 className="font-bold text-slate-900 text-lg mb-1 break-all">{asset.title || 'External Website'}</h3>
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
                        {/* 仪表盘 / 收藏 是同一页的两个视图，不是两个路由，所以用 button 不用 Link */}
                        <nav className="flex items-center gap-6">
                            <button
                                onClick={() => setFavOnly(false)}
                                className={`text-sm font-bold pb-4 mt-4 border-b-2 transition-colors ${
                                    favOnly ? 'text-slate-400 border-transparent hover:text-slate-700' : 'text-slate-900 border-indigo-600'
                                }`}
                            >
                                仪表盘
                            </button>
                            {!isViewOnly && (
                                <button
                                    onClick={() => setFavOnly(true)}
                                    className={`text-sm font-bold pb-4 mt-4 border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                                        favOnly ? 'text-slate-900 border-rose-500' : 'text-slate-400 border-transparent hover:text-slate-700'
                                    }`}
                                >
                                    <Heart size={16} className={favOnly ? 'fill-rose-500 text-rose-500' : 'fill-rose-400 text-rose-400'} />
                                    收藏
                                    <span className={favOnly ? 'text-rose-500' : 'text-slate-300'}>{favCount}</span>
                                </button>
                            )}
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        {isViewOnly ? (
                            <Link href="/" className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
                                登录
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        const { logout } = require('@/lib/auth');
                                        logout();
                                        router.replace('/');
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                    title="退出登录"
                                >
                                    <LogOut size={20} />
                                </button>
                                <div className={`w-9 h-9 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold ${currentUserId ? getUserColor(currentUserId) : 'bg-indigo-600'}`}>
                                    {currentUserId ? getOwnerName(currentUserId).charAt(0) : ''}
                                </div>
                            </>
                        )}
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
                        {isViewOnly ? (
                            <Link href="/" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all">
                                登录
                            </Link>
                        ) : (
                            <>
                                {/* 收藏入口：点开只看自己收藏的卡，数字是我收了多少 */}
                                <button
                                    onClick={() => setFavOnly(v => !v)}
                                    title={favOnly ? '显示全部灵感' : '只看我的收藏'}
                                    className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-bold transition-all ${
                                        favOnly ? 'bg-rose-500 text-white shadow-sm' : 'text-rose-500 hover:bg-rose-50'
                                    }`}
                                >
                                    <Heart size={17} className={favOnly ? 'fill-white' : 'fill-rose-500'} />
                                    {favCount}
                                </button>
                                <Link href="/settings">
                                    <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-full">
                                        <Settings size={20} />
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex-1 flex flex-col">

                {/* Visual Toolbar */}
                <div className="flex flex-col gap-3 mb-8">
                    {/* Row 1: 时间 + 搜索 + 操作 */}
                    <div className="flex flex-row flex-wrap lg:flex-nowrap items-center gap-3 w-full">
                        {/* 时间维度：回答的是「看哪一段时间的东西」，先于分类/谁发的/后续动作这些属性问题，
                            所以跟搜索同级放最上面一行。
                            材质上刻意跟下面的属性筛选拉开：下面是平贴的 pill、选中＝红色实心；
                            这里是凹槽轨道 + 抬起的白色滑块。层级靠材质区分，不靠加大字号硬凹。 */}
                        <div className="relative shrink-0">
                            <div className="flex items-center gap-1 h-11 px-1 bg-[#f4f1f0] border border-[#e7e0de] rounded-xl">
                                {/* 日历按钮＝翻旧账的入口：点开按年月挑，挑完变成轨道里的第三档 */}
                                <button
                                    onClick={() => {
                                        // 默认落在当年，但夹进「有内容的年份」区间——
                                        // 否则跨年后头几天打开就是一整年全灰
                                        const want = customMonth?.y ?? new Date().getFullYear();
                                        setPickerYear(Math.min(monthStats.maxYear, Math.max(monthStats.minYear, want)));
                                        setMonthPickerOpen(v => !v);
                                    }}
                                    title="按年月挑"
                                    className={`shrink-0 w-9 h-9 rounded-lg inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                                        monthPickerOpen
                                            ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/70'
                                    }`}
                                >
                                    <CalendarRange size={16} />
                                </button>
                                {TIME_FILTERS.map((tf) => {
                                    const active = timeFilter === tf.value;
                                    return (
                                        <button
                                            key={tf.value}
                                            onClick={() => pickTimeFilter(tf.value)}
                                            className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                                                active
                                                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {tf.label}
                                        </button>
                                    );
                                })}
                                {/* 选了具体月份才出现的第三档，点 × 回到「全部」 */}
                                {customMonth && (
                                    <span className="inline-flex items-center gap-1 h-9 pl-3 pr-1.5 rounded-lg bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5 text-sm font-bold whitespace-nowrap">
                                        {customMonth.y} 年 {customMonth.m + 1} 月
                                        <button
                                            onClick={() => pickTimeFilter('all')}
                                            title="取消这个月份"
                                            className="w-5 h-5 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                        >
                                            <X size={13} />
                                        </button>
                                    </span>
                                )}
                            </div>

                            {monthPickerOpen && (
                                <>
                                    {/* 点面板外面收起来 */}
                                    <div className="fixed inset-0 z-30" onClick={() => setMonthPickerOpen(false)} />
                                    <div className="absolute z-40 mt-2 left-0 w-[268px] bg-white border border-slate-200 rounded-xl shadow-xl p-3 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="flex items-center justify-between mb-3">
                                            <button
                                                onClick={() => setPickerYear(y => Math.max(monthStats.minYear, y - 1))}
                                                disabled={pickerYear <= monthStats.minYear}
                                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                            <span className="text-sm font-bold text-slate-900">{pickerYear} 年</span>
                                            <button
                                                onClick={() => setPickerYear(y => Math.min(monthStats.maxYear, y + 1))}
                                                disabled={pickerYear >= monthStats.maxYear}
                                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {Array.from({ length: 12 }, (_, m) => {
                                                const n = monthStats.counts.get(`${pickerYear}-${m}`) || 0;
                                                const on = customMonth?.y === pickerYear && customMonth?.m === m;
                                                return (
                                                    <button
                                                        key={m}
                                                        onClick={() => pickMonth(pickerYear, m)}
                                                        disabled={n === 0}
                                                        title={n === 0 ? '这个月没有内容' : `${n} 条`}
                                                        className={`h-9 rounded-lg text-sm font-bold transition-all ${
                                                            on
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : n === 0
                                                                    ? 'text-slate-300 cursor-not-allowed'
                                                                    : 'text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {m + 1} 月
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex-1 min-w-[180px] relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400"
                                placeholder="搜索灵感或编号（如 #1）..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-auto lg:ml-2 shrink-0">
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
                            {/* Add New Button (hidden for view-only visitors) */}
                            {!isViewOnly && (
                                <Link href="/capture" className="flex-1 md:flex-none">
                                    <button className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                        <Plus size={18} strokeWidth={2.5} />
                                        <span>新建</span>
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Row 2: 分类 + 上传人并排一行（原来各占一行，三行长得一样没有主次）
                        二级分类是「创意」的下钻，跟着这一排走，另起一行 */}
                    <div className="flex flex-wrap items-center gap-3">
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
                    </div>

                    {/* Row 3: Subcategory Filter (only for 创意) */}
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

                    {/* Row 3: 按后续动作筛选。选中态用该标签自己的实色底 + 白字，跟卡片角标一个语言 */}
                    <div className="flex items-start gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 h-7 px-1 shrink-0">
                            <Hash size={12} /> 后续动作
                        </span>
                        {FOLLOW_UPS.map(f => {
                            const active = followUpFilter === f;
                            const bg = FOLLOW_UP_STYLE[f].bg;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFollowUpFilter(active ? null : f)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-bold transition-all border ${
                                        active
                                            ? 'text-white border-transparent shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                                    }`}
                                    style={active ? { backgroundColor: bg } : undefined}
                                >
                                    {!active && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bg }} />}
                                    {f}
                                    <span className={active ? 'text-white/70' : 'text-slate-300'}>
                                        {followUpStats.get(f) || 0}
                                    </span>
                                </button>
                            );
                        })}
                        {/* 还没人标过的，用来找漏掉的卡 */}
                        <button
                            onClick={() => setFollowUpFilter(followUpFilter === 'none' ? null : 'none')}
                            className={`px-2.5 h-7 rounded-lg text-xs font-bold transition-all border ${
                                followUpFilter === 'none'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                            }`}
                        >
                            未标记
                            <span className={followUpFilter === 'none' ? 'text-white/70 ml-1' : 'text-slate-300 ml-1'}>
                                {followUpStats.get('none') || 0}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content Grid/List
                    切时间维度时整块淡出再淡入。内容其实是立刻换的，这层动画只为让人看见「刷新了」——
                    不给反馈的话，切到一个结果差不多的档位会以为没点上。
                    只动 opacity/transform，不动布局属性；关了动效的用户直接跳过 */}
                <div className={`transition-all duration-150 motion-reduce:transition-none ${
                    refreshing ? 'opacity-30 translate-y-1 motion-reduce:opacity-100 motion-reduce:translate-y-0' : 'opacity-100 translate-y-0'
                }`}>
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-slate-500">{favOnly ? '收藏夹是空的' : '暂无灵感'}</p>
                        <p className="text-sm text-slate-400 mt-1">
                            {favOnly ? '在卡片右上角点红心，就会收进这里' : '试试其他搜索词，或新建一条灵感'}
                        </p>
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
                                            {item.follow_up && (
                                                <span className="absolute top-1 left-1 z-10 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                                                      style={{ backgroundColor: FOLLOW_UP_STYLE[item.follow_up].bg }}
                                                      title={item.follow_up} />
                                            )}
                                            {item.assets && item.assets.length > 0 ? (
                                                renderAssetThumbnail(item.assets[0])
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <LayoutGrid size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                                {item.follow_up && <span className="shrink-0"><FollowUpBadge value={item.follow_up} size="sm" /></span>}
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">{item.description}</p>
                                            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${getUserColor(item.user_id)}`} />
                                                <span className="font-bold text-slate-600">{getOwnerName(item.user_id)}</span>
                                                <span className="text-slate-300">·</span>
                                                <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                {item.commenter_count > 0 && (
                                                    <>
                                                        <span className="text-slate-300">·</span>
                                                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium"
                                                              title={`${item.commenter_count} 人评论，共 ${item.comment_count} 条`}>
                                                            <MessageSquare size={12} />
                                                            {item.commenter_count}
                                                        </span>
                                                    </>
                                                )}
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
                                        {!isViewOnly && (
                                            <button
                                                onClick={(e) => handleToggleFavorite(item, e)}
                                                title={item.favorited ? '取消收藏' : '收藏'}
                                                className={`p-2 rounded-full transition-all ${
                                                    item.favorited ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'
                                                }`}
                                            >
                                                <Heart size={17} className={item.favorited ? 'fill-rose-500' : ''} />
                                            </button>
                                        )}
                                        <div className="px-2 text-slate-300 group-hover:text-indigo-400">
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
                                            {item.follow_up && (
                                                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                                                    <FollowUpBadge value={item.follow_up} />
                                                </div>
                                            )}
                                            {item.assets && item.assets.length > 0 ? (
                                                <>
                                                    {item.assets[0].type === 'video' ? (
                                                        <VideoThumb src={item.assets[0].content as string} iconSize={22} zoomOnHover />
                                                    ) : item.assets[0].type === 'pdf' ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-400 group-hover:bg-red-100 transition-colors px-4">
                                                            <FileText size={48} />
                                                            <span className="text-xs font-bold mt-2 opacity-60 line-clamp-2 text-center break-all">
                                                                {item.assets[0].title || 'PDF'}
                                                            </span>
                                                        </div>
                                                    ) : item.assets[0].type === 'website' ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100 transition-colors px-4">
                                                            <Globe size={48} />
                                                            <span className="text-xs font-bold mt-2 opacity-60 line-clamp-2 text-center break-all">
                                                                {item.assets[0].title || '网站'}
                                                            </span>
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
                                            {/* 收藏红心：已收藏常亮，未收藏 hover 才出现，避免满屏空心 */}
                                            {!isViewOnly && (
                                                <button
                                                    onClick={(e) => handleToggleFavorite(item, e)}
                                                    title={item.favorited ? '取消收藏' : '收藏'}
                                                    className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                                                        item.favorited
                                                            ? 'bg-white/90 text-rose-500 shadow-sm'
                                                            : 'bg-black/25 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'
                                                    }`}
                                                >
                                                    <Heart size={16} className={item.favorited ? 'fill-rose-500' : ''} />
                                                </button>
                                            )}
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
                                                    {item.commenter_count > 0 && (
                                                        <>
                                                            <span className="text-slate-300">·</span>
                                                            <span className="inline-flex items-center gap-1 text-slate-500 font-medium"
                                                                  title={`${item.commenter_count} 人评论，共 ${item.comment_count} 条`}>
                                                                <MessageSquare size={12} />
                                                                {item.commenter_count}
                                                            </span>
                                                        </>
                                                    )}
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
                </div>
            </main>

            {/* Detail Sheet (Soft Modern) */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] bg-white animate-in fade-in duration-200">
                    <div className="relative w-full h-full bg-white flex flex-col">
                        {/* 全屏详情。正文用 max-w 收窄，宽屏上一行拉到 1900px 没法读 */}
                        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <h2 className="text-lg font-bold text-slate-900">灵感详情</h2>
                            <div className="flex items-center gap-2">
                                {!isEditing && !isViewOnly && (
                                    <button
                                        onClick={(e) => handleToggleFavorite(selectedItem, e)}
                                        className={`p-2 rounded-full transition-all flex items-center gap-1.5 ${
                                            selectedItem.favorited ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
                                        }`}
                                        title={selectedItem.favorited ? '取消收藏' : '收藏'}
                                    >
                                        <Heart size={18} className={selectedItem.favorited ? 'fill-rose-500' : ''} />
                                        {!!selectedItem.favorite_count && (
                                            <span className="text-xs font-bold">{selectedItem.favorite_count}</span>
                                        )}
                                    </button>
                                )}
                                {!isEditing && (
                                    <button
                                        onClick={() => handleShare(String(selectedItem.card_no))}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all flex items-center gap-1.5"
                                        title="复制分享链接"
                                    >
                                        {copiedShare ? (
                                            <>
                                                <Check size={18} className="text-emerald-600" />
                                                <span className="text-xs font-bold text-emerald-600">已复制</span>
                                            </>
                                        ) : (
                                            <LinkIcon size={18} />
                                        )}
                                    </button>
                                )}
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
                                {/* 删除是破坏性操作：用红色实底说清后果，并跟关闭之间加一道分隔，
                                    免得跟「关掉」挨着手滑。点下去仍有一次 confirm 兜底 */}
                                {!isEditing && isOwner(selectedItem) && (
                                    <button
                                        onClick={() => handleDelete(selectedItem.id)}
                                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-red-600 text-white text-sm font-bold shadow-sm hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 transition-all"
                                        title="删除这条灵感"
                                    >
                                        <Trash2 size={16} /> 删除
                                    </button>
                                )}
                                <span className="w-px h-6 bg-slate-200 mx-1" aria-hidden />
                                {/* 关闭常驻一个浅底：它是全屏详情唯一的出口，本来就该长得像按钮。
                                    另一个作用是消掉「幽灵 hover」——关掉上一张卡后光标就停在这个位置，
                                    再打开下一张时 X 正好长在光标底下，底色像凭空冒出来。常态有底就没这问题 */}
                                <button
                                    onClick={() => { setSelectedItem(null); setIsEditing(false); }}
                                    className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200/70 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-colors"
                                    title="关闭"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </header>

                        {/* 后续动作：看完这条打算怎么处理。单选，再点一次取消 */}
                        {!isEditing && (
                            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mr-1">后续动作</span>
                                    {FOLLOW_UPS.map(f => {
                                        const active = selectedItem.follow_up === f;
                                        const bg = FOLLOW_UP_STYLE[f].bg;
                                        const editable = !isViewOnly;
                                        return (
                                            <button
                                                key={f}
                                                onClick={() => handleSetFollowUp(active ? null : f)}
                                                disabled={!editable}
                                                title={editable ? (active ? '再点一次取消' : '标记为' + f) : '登录后即可标记'}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-bold transition-all ${
                                                    active
                                                        ? 'text-white border-transparent shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                                } ${editable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                                style={active ? { backgroundColor: bg } : undefined}
                                            >
                                                {!active && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bg }} />}
                                                {f}
                                            </button>
                                        );
                                    })}
                                </div>
                                {isViewOnly ? (
                                    <p className="text-[11px] text-slate-400 mt-2">登录后任何人都可以标记后续动作</p>
                                ) : selectedItem.follow_up && selectedItem.follow_up_by ? (
                                    <p className="text-[11px] text-slate-400 mt-2">
                                        由 <span className="font-bold text-slate-500">{getOwnerName(selectedItem.follow_up_by)}</span> 标记 · 任何人都可以改
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-slate-400 mt-2">任何人都可以标记，标完全员可见</p>
                                )}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            <div className="mx-auto w-full max-w-4xl">
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
                                                draggable
                                                onDragStart={() => setDragIdx(idx)}
                                                onDragEnd={() => setDragIdx(null)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (dragIdx !== null) moveAsset(dragIdx, idx);
                                                    setDragIdx(null);
                                                }}
                                                onClick={() => setActiveAssetIndex(idx)}
                                                title={idx === 0 ? '这张是卡片头图' : '拖动可调整顺序'}
                                                className={`shrink-0 w-24 h-24 rounded-lg overflow-hidden border shadow-sm relative group cursor-grab active:cursor-grabbing transition-all ${
                                                    dragIdx === idx ? 'opacity-40 scale-95' : ''
                                                } ${
                                                    idx === 0
                                                        ? 'border-2 border-amber-400 ring-2 ring-amber-100'
                                                        : activeAssetIndex === idx
                                                            ? 'border-2 border-indigo-600 ring-2 ring-indigo-100'
                                                            : 'border-slate-200 hover:border-indigo-300'
                                                }`}
                                            >
                                                {renderAssetThumbnail(asset)}

                                                {idx === 0 && (
                                                    <span className="absolute bottom-0 inset-x-0 bg-amber-400 text-[9px] font-black text-amber-950 text-center py-0.5 pointer-events-none">
                                                        头图
                                                    </span>
                                                )}

                                                {/* 一键置顶：拖拽之外给个更快的路径 */}
                                                {idx !== 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); moveAsset(idx, 0); }}
                                                        className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] font-bold py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="设为头图"
                                                    >
                                                        设为头图
                                                    </button>
                                                )}

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
                                    {editForm.assets.length > 1 && (
                                        <p className="px-4 pb-3 -mt-1 text-[11px] text-slate-400">
                                            拖动缩略图可调整顺序，<span className="font-bold text-amber-600">排第一的那张就是卡片头图</span>；hover 缩略图可一键「设为头图」
                                        </p>
                                    )}
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
                                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-mono">#{selectedItem.card_no}</span>
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
                                                className="w-full min-h-[220px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-y leading-relaxed"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest pl-1 block mb-2">
                                                设计启示 <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                className="w-full min-h-[220px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-y leading-relaxed"
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

                                            {/* 评论区：任何登录用户都能评 */}
                                            <div className="mt-10 pt-8 border-t border-slate-100">
                                                <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                                                    <MessageSquare size={14} />
                                                    评论
                                                    {comments.length > 0 && (
                                                        <span className="font-medium text-slate-400 tracking-normal">
                                                            {new Set(comments.map(c => c.user_id)).size} 人 · {comments.length} 条
                                                        </span>
                                                    )}
                                                </h3>

                                                {commentsLoading ? (
                                                    <p className="text-sm text-slate-400">加载中…</p>
                                                ) : comments.length === 0 ? (
                                                    <p className="text-sm text-slate-400 mb-5">还没有人评论，来说第一句</p>
                                                ) : (
                                                    <div className="space-y-4 mb-6">
                                                        {comments.map(c => (
                                                            <div key={c.id} className="flex gap-3 group/c">
                                                                <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${getUserColor(c.user_id)}`}>
                                                                    {getOwnerName(c.user_id).charAt(0)}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 text-[11px]">
                                                                        <span className="font-bold text-slate-700">{getOwnerName(c.user_id)}</span>
                                                                        <span className="text-slate-400">
                                                                            {new Date(c.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                        {c.user_id === currentUserId && (
                                                                            <button
                                                                                onClick={() => handleDeleteComment(c.id)}
                                                                                className="ml-auto inline-flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
                                                                                title="删除我的评论"
                                                                            >
                                                                                <Trash2 size={13} /> 删除
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap mt-1 break-words">
                                                                        {c.body}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {isViewOnly ? (
                                                    <p className="text-sm text-slate-400 bg-slate-50 rounded-xl px-4 py-3">登录后即可评论</p>
                                                ) : (
                                                    <div className="flex gap-3 items-start">
                                                        <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${getUserColor(currentUserId)}`}>
                                                            {getOwnerName(currentUserId).charAt(0)}
                                                        </span>
                                                        <div className="flex-1">
                                                            <textarea
                                                                value={commentDraft}
                                                                onChange={e => setCommentDraft(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleAddComment();
                                                                }}
                                                                rows={3}
                                                                maxLength={2000}
                                                                placeholder="说点什么…（⌘/Ctrl + Enter 发送）"
                                                                className="w-full text-[15px] border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-y"
                                                            />
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-[11px] text-slate-400">{commentDraft.length}/2000</span>
                                                                <button
                                                                    onClick={handleAddComment}
                                                                    disabled={!commentDraft.trim() || postingComment}
                                                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                                                >
                                                                    <Send size={14} /> {postingComment ? '发送中…' : '发表'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            </div>
                        </div>

                        <footer className={`p-4 border-t border-slate-100 bg-slate-50 shrink-0 mx-auto w-full max-w-4xl ${isEditing ? 'grid grid-cols-2 gap-3' : 'flex'}`}>
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
