import { NextRequest, NextResponse } from 'next/server';
import pool, { initDatabase } from '@/lib/db';

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
        const { rows } = await pool.query(
            'SELECT * FROM inspirations ORDER BY created_at DESC'
        );
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
        const { user_id, category, subcategory, title, description, source, source_text, design_insight, assets, tags } = body;

        if (!user_id || !title) {
            return NextResponse.json({ error: 'user_id and title are required' }, { status: 400 });
        }

        const finalCategory = category || '政策';
        // Non-创意 categories must have null subcategory
        const finalSubcategory = finalCategory === '创意' ? (subcategory || null) : null;

        const { rows } = await pool.query(
            `INSERT INTO inspirations (user_id, category, subcategory, title, description, source, source_text, design_insight, assets, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
            ]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('POST /api/inspirations error:', error);
        return NextResponse.json({ error: 'Failed to save inspiration' }, { status: 500 });
    }
}
