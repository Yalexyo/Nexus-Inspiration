import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const userId = formData.get('user_id') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 120MB limit
        if (file.size > 120 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Max 120MB.' }, { status: 413 });
        }

        const folder = userId || 'anon';
        const ext = path.extname(file.name) || `.${file.type.split('/')[1] || 'bin'}`;
        // Sanitize: only allow alphanumeric folder names
        const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${crypto.randomUUID()}${ext}`;
        const uploadDir = path.join(process.cwd(), 'uploads', safeFolder);

        await mkdir(uploadDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // Return a URL path that can be served
        const publicUrl = `/api/uploads/${safeFolder}/${fileName}`;
        return NextResponse.json({ url: publicUrl }, { status: 201 });
    } catch (error) {
        console.error('POST /api/upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
