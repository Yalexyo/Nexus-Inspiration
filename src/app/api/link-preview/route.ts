import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Constructed Screenshot URL (Thum.io)
    // - width/1280: Standard Desktop Width
    // - crop/1024: Catch "Above the fold"
    // - noanimate: Static image
    // - wait/2: Wait 2s for JS hydration (helps with SPA sites)
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/1024/noanimate/wait/2/${targetUrl}`;

    return NextResponse.json({
        success: true,
        url: screenshotUrl
    });
}
