import { NextRequest, NextResponse } from 'next/server';

// 抓网页 <title> / og:title，给链接附件当显示名。
// 抓不到不报错——前端会退回显示域名，这只是锦上添花
export async function GET(req: NextRequest) {
    const target = req.nextUrl.searchParams.get('url');
    if (!target) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    let host = '';
    try {
        const u = new URL(target);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad protocol');
        host = u.hostname.replace(/^www\./, '');
    } catch {
        return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 8000);   // 内网环境外网可能不通，别把请求挂死
        const res = await fetch(target, {
            signal: ctl.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NexusInspiration/1.0)' },
        });
        clearTimeout(timer);
        if (!res.ok) return NextResponse.json({ title: '', host });

        // 只读前 200KB，标题一定在 <head> 里，没必要整页下载
        const buf = await res.arrayBuffer();
        const html = new TextDecoder('utf-8').decode(buf.slice(0, 200000));

        const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
        const tt = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        let title = (og?.[1] || tt?.[1] || '').trim()
            .replace(/\s+/g, ' ')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
        if (title.length > 120) title = title.slice(0, 120) + '…';

        return NextResponse.json({ title, host });
    } catch {
        return NextResponse.json({ title: '', host });   // 超时/不可达都算拿不到，不是错误
    }
}
