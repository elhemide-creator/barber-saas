import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Bu kod qapını tam açıq saxlayır və Node.js (Edge) xətalarından yayınır
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  // Səhifələri oxuyarkən static faylları iqnor edir
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
