import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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

        const buffer = await readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('GET /api/uploads error:', error);
        return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
    }
}
