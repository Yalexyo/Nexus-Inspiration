import { NextRequest, NextResponse } from 'next/server';
import { stat } from 'fs/promises';
import path from 'path';
import { existsSync, createReadStream } from 'fs';
import { Readable } from 'stream';

const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
};

// 全部走流式回包：大视频不进内存，浏览器拿够首帧就断开，不会白下整个文件
function fileStream(filePath: string, start?: number, end?: number) {
    const stream = createReadStream(filePath, start === undefined ? undefined : { start, end });
    return Readable.toWeb(stream) as unknown as ReadableStream;
}

function rangeNotSatisfiable(size: number) {
    return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' },
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const segments = (await params).path;

        // Validate path segments to prevent directory traversal
        for (const seg of segments) {
            if (seg.includes('..') || seg.includes('/') || seg.includes('\\')) {
                return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
            }
        }

        const filePath = path.join(process.cwd(), 'uploads', ...segments);

        // Verify the resolved path is within uploads directory
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(uploadsDir)) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        if (!existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const { size } = await stat(filePath);
        const rangeHeader = req.headers.get('range');

        // 视频取首帧、拖动进度条都靠 206 分段响应；不支持 Range 时浏览器只能整包下载
        if (rangeHeader) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
            if (!match) return rangeNotSatisfiable(size);

            const [, rawStart, rawEnd] = match;
            let start: number;
            let end: number;

            if (rawStart === '') {
                // 后缀区间 bytes=-N：取末尾 N 字节（moov 在文件尾的 mp4 会这么要）
                const suffix = Number(rawEnd);
                if (!rawEnd || !Number.isFinite(suffix) || suffix <= 0) return rangeNotSatisfiable(size);
                start = Math.max(0, size - suffix);
                end = size - 1;
            } else {
                start = Number(rawStart);
                end = rawEnd === '' ? size - 1 : Number(rawEnd);
                if (!Number.isFinite(start) || !Number.isFinite(end)) return rangeNotSatisfiable(size);
                end = Math.min(end, size - 1);
            }

            if (start > end || start >= size) return rangeNotSatisfiable(size);

            const length = end - start + 1;

            return new NextResponse(fileStream(filePath, start, end), {
                status: 206,
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': String(length),
                    'Content-Range': `bytes ${start}-${end}/${size}`,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        }

        return new NextResponse(fileStream(filePath), {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(size),
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('GET /api/uploads error:', error);
        return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
    }
}
