import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE 只能删自己发的评论
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const { commentId } = await params;
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id');
        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        const { rowCount } = await pool.query(
            'DELETE FROM inspiration_comments WHERE id = $1::uuid AND user_id = $2',
            [commentId, user_id]
        );
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE comment error:', error);
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }
}
