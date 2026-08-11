import { NextRequest, NextResponse } from 'next/server';
import pool, { initDatabase } from '@/lib/db';

// 这个端点可能在 /api/inspirations 之前被打到（比如直接分享链接进来），
// 不自己保证一次建表/加列，follow_up_by 就可能还不存在
let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await initDatabase();
        dbInitialized = true;
    }
}

// 与 src/lib/storage.ts 的 FOLLOW_UPS 保持一致（改这里必须同步改那边）
const FOLLOW_UPS = ['继续深入调查', '内容结构进一步优化', '升级成分享内容', '考虑项目应用'];

// PUT 后续动作标签。
// 这是唯一一个「非上传人也能写」的端点：后续动作是全员协作的分拣动作，
// 谁都可以标，但只影响 follow_up / follow_up_by 两列，碰不到正文和附件。
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureDb();
        const { id } = await params;
        const body = await req.json();
        const { user_id, follow_up } = body;

        // 仍然要求已登录（未登录的 view-only 访客不能标）
        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        const value = FOLLOW_UPS.includes(follow_up) ? follow_up : null;
        // 取消标记时把标记人一起清掉
        const by = value ? user_id : null;

        const isNumeric = /^\d+$/.test(id);
        const { rowCount } = isNumeric
            ? await pool.query(
                'UPDATE inspirations SET follow_up = $1, follow_up_by = $2 WHERE card_no = $3::integer',
                [value, by, parseInt(id, 10)]
            )
            : await pool.query(
                'UPDATE inspirations SET follow_up = $1, follow_up_by = $2 WHERE id = $3::uuid',
                [value, by, id]
            );

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, follow_up: value, follow_up_by: by });
    } catch (error) {
        console.error('PUT /api/inspirations/[id]/follow-up error:', error);
        return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
    }
}
