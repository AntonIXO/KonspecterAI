import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for AI endpoints
  if (request.nextUrl.pathname.startsWith('/api/summarize') || 
      request.nextUrl.pathname.startsWith('/api/quiz')) {
    
    const userAgent = request.headers.get('user-agent');
    
    // Check if browser is Chrome and version is >= 127
    if (!userAgent?.includes('Chrome/') || 
        parseInt(userAgent.split('Chrome/')[1]) < 127) {
      return NextResponse.json(
        { error: 'Chrome version 127 or higher is required for AI features' },
        { status: 400 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/summarize/:path*', '/api/quiz/:path*'],
}; 