import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT update inspiration
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { user_id, title, description, tags, assets, category } = body;

        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        // Build dynamic SET clause from provided fields
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
        if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
        if (category !== undefined) { fields.push(`category = $${idx++}`); values.push(category); }
        if (tags !== undefined) { fields.push(`tags = $${idx++}`); values.push(JSON.stringify(tags)); }
        if (assets !== undefined) { fields.push(`assets = $${idx++}`); values.push(JSON.stringify(assets)); }

        if (fields.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        // Security: only owner can update
        values.push(id);
        values.push(user_id);

        const { rowCount } = await pool.query(
            `UPDATE inspirations SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx}`,
            values
        );

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PUT /api/inspirations/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

// DELETE inspiration
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id');

        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        // First get assets for cleanup
        const { rows } = await pool.query(
            'SELECT assets FROM inspirations WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        // Delete file assets from disk
        const assets = rows[0].assets;
        if (Array.isArray(assets)) {
            for (const asset of assets) {
                if (typeof asset.content === 'string' && asset.content.startsWith('/api/uploads/')) {
                    try {
                        const filePath = asset.content.replace('/api/uploads/', '');
                        const fs = await import('fs/promises');
                        const path = await import('path');
                        const fullPath = path.join(process.cwd(), 'uploads', filePath);
                        await fs.unlink(fullPath).catch(() => {});
                    } catch {
                        // Ignore cleanup errors
                    }
                }
            }
        }

        // Delete DB row
        await pool.query(
            'DELETE FROM inspirations WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/inspirations/[id] error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
