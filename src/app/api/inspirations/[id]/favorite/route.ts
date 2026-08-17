import { NextRequest, NextResponse } from 'next/server';
import pool, { initDatabase } from '@/lib/db';

let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
}

async function resolveId(id: string): Promise<string | null> {
    if (!/^\d+$/.test(id)) return id;
    const { rows } = await pool.query('SELECT id FROM inspirations WHERE card_no = $1::integer', [parseInt(id, 10)]);
    return rows.length ? rows[0].id : null;
}

// POST 收藏。任何已登录用户都能收藏任何卡，收藏是私人的，别人看不到你收了什么
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await ensureDb();
        const target = await resolveId((await params).id);
        if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const { user_id } = await req.json();
        if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        // 重复收藏不报错，直接当成已收藏
        await pool.query(
            `INSERT INTO inspiration_favorites (inspiration_id, user_id) VALUES ($1::uuid, $2)
             ON CONFLICT (inspiration_id, user_id) DO NOTHING`,
            [target, user_id]
        );
        return NextResponse.json({ success: true, favorited: true });
    } catch (error) {
        console.error('POST favorite error:', error);
        return NextResponse.json({ error: 'Failed to favorite' }, { status: 500 });
    }
}

// DELETE 取消收藏
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await ensureDb();
        const target = await resolveId((await params).id);
        if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const user_id = new URL(req.url).searchParams.get('user_id');
        if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        await pool.query(
            'DELETE FROM inspiration_favorites WHERE inspiration_id = $1::uuid AND user_id = $2',
            [target, user_id]
        );
        return NextResponse.json({ success: true, favorited: false });
    } catch (error) {
        console.error('DELETE favorite error:', error);
        return NextResponse.json({ error: 'Failed to unfavorite' }, { status: 500 });
    }
}
