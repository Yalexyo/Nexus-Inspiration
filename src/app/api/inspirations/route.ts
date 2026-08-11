import { NextRequest, NextResponse } from 'next/server';
import pool, { initDatabase } from '@/lib/db';

// 与 src/lib/storage.ts 的 FOLLOW_UPS 保持一致（改这里必须同步改那边）
const FOLLOW_UPS = ['继续深入调查', '内容结构进一步优化', '升级成分享内容', '考虑项目应用'];

let dbInitialized = false;

async function ensureDb() {
    if (!dbInitialized) {
        await initDatabase();
        dbInitialized = true;
    }
}

// GET all inspirations
export async function GET() {
    try {
        await ensureDb();
        // 一次带出评论数和"评论人数"（去重后的人头），避免列表页 N+1
        const { rows } = await pool.query(`
            SELECT i.*,
                   COALESCE(c.cnt, 0)::int    AS comment_count,
                   COALESCE(c.people, 0)::int AS commenter_count
            FROM inspirations i
            LEFT JOIN (
                SELECT inspiration_id,
                       COUNT(*) AS cnt,
                       COUNT(DISTINCT user_id) AS people
                FROM inspiration_comments GROUP BY inspiration_id
            ) c ON c.inspiration_id = i.id
            ORDER BY i.created_at DESC
        `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('GET /api/inspirations error:', error);
        return NextResponse.json({ error: 'Failed to fetch inspirations' }, { status: 500 });
    }
}

// POST new inspiration
export async function POST(req: NextRequest) {
    try {
        await ensureDb();
        const body = await req.json();
        const { user_id, category, subcategory, title, description, source, source_text, design_insight, assets, tags, follow_up } = body;

        if (!user_id || !title) {
            return NextResponse.json({ error: 'user_id and title are required' }, { status: 400 });
        }

        const finalCategory = category || '政策';
        // Non-创意 categories must have null subcategory
        const finalSubcategory = finalCategory === '创意' ? (subcategory || null) : null;

        const { rows } = await pool.query(
            `INSERT INTO inspirations (user_id, category, subcategory, title, description, source, source_text, design_insight, assets, tags, follow_up)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                user_id,
                finalCategory,
                finalSubcategory,
                title,
                description || '',
                source || null,
                source_text || '',
                design_insight || '',
                JSON.stringify(assets || []),
                JSON.stringify(tags || []),
                FOLLOW_UPS.includes(follow_up) ? follow_up : null,
            ]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('POST /api/inspirations error:', error);
        return NextResponse.json({ error: 'Failed to save inspiration' }, { status: 500 });
    }
}
