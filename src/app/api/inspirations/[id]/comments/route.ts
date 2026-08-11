import { NextRequest, NextResponse } from 'next/server';
import pool, { initDatabase } from '@/lib/db';

let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await initDatabase();
        dbInitialized = true;
    }
}

// 支持用 uuid 或 card_no 定位卡片（分享链接用的是 card_no）
async function resolveId(id: string): Promise<string | null> {
    if (!/^\d+$/.test(id)) return id;
    const { rows } = await pool.query(
        'SELECT id FROM inspirations WHERE card_no = $1::integer',
        [parseInt(id, 10)]
    );
    return rows.length ? rows[0].id : null;
}

// GET 某条灵感的全部评论，按时间正序
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureDb();
        const target = await resolveId((await params).id);
        if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const { rows } = await pool.query(
            `SELECT id, inspiration_id, user_id, body, created_at
             FROM inspiration_comments WHERE inspiration_id = $1::uuid
             ORDER BY created_at ASC`,
            [target]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('GET comments error:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST 发表评论。任何已登录用户都可以评，不限于上传人
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureDb();
        const target = await resolveId((await params).id);
        if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const { user_id, body } = await req.json();
        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }
        const text = typeof body === 'string' ? body.trim() : '';
        if (!text) {
            return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
        }
        if (text.length > 2000) {
            return NextResponse.json({ error: '评论最多 2000 字' }, { status: 400 });
        }

        const { rows } = await pool.query(
            `INSERT INTO inspiration_comments (inspiration_id, user_id, body)
             VALUES ($1::uuid, $2, $3) RETURNING id, inspiration_id, user_id, body, created_at`,
            [target, user_id, text]
        );
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('POST comments error:', error);
        return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }
}
