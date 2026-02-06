import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    // Wir rufen das Bild vom Server aus auf (kein CORS Problem)
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Proxy: Failed to fetch ${url} - Status: ${response.status}`);
      return new NextResponse('Failed to fetch image', { status: 404 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        // Caching erlauben, damit es schneller geht
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}