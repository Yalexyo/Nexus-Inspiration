'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoThumbProps {
    src: string;
    /** 播放角标的图标尺寸，同时决定角标圆的大小 */
    iconSize?: number;
    /** 网格卡片封面用：hover 时轻微放大，和图片封面保持一致 */
    zoomOnHover?: boolean;
}

/**
 * 视频封面 = 视频第一帧。
 * 给 <video> 挂媒体片段 #t=0.1 并 preload="metadata"，浏览器会 seek 到该帧并画出来，
 * 只拉 metadata + 这一帧的数据（依赖 /api/uploads 的 206 Range 支持）。
 * 解不出来的格式（部分 .mov）走 onError 回退到原来的黑底播放图标。
 */
export default function VideoThumb({ src, iconSize = 16, zoomOnHover = false }: VideoThumbProps) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <Play size={iconSize} className="text-white fill-white" />
            </div>
        );
    }

    // blob: 预览地址已带自己的片段规则，只给普通 URL 补 #t
    const frameSrc = src.includes('#') ? src : `${src}#t=0.1`;
    const badgeSize = Math.round(iconSize * 1.9);

    return (
        <div className="w-full h-full relative bg-slate-900">
            <video
                src={frameSrc}
                preload="metadata"
                muted
                playsInline
                onError={() => setFailed(true)}
                className={`w-full h-full object-cover pointer-events-none ${zoomOnHover ? 'group-hover:scale-105 transition-transform duration-500' : ''}`}
            />
            <span
                className="absolute inset-0 m-auto flex items-center justify-center rounded-full bg-black/45"
                style={{ width: badgeSize, height: badgeSize }}
            >
                <Play size={iconSize} className="text-white fill-white" />
            </span>
        </div>
    );
}
