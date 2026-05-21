import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // İlk olaraq standart bir cavab obyekti yaradırıq
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Supabase SSR müştərisini təhlükəsiz şəkildə işə salırıq
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Supabase-dən cari istifadəçinin sessiyasını yoxlayırıq
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 🔐 QORUMA MƏNTİQİ:
  // Əgər istifadəçi daxil olmayıbsa və /dashboard qovluğuna girmək istəyirsə -> onu /login-ə qov
  if (!user && url.pathname.startsWith('/dashboard')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 🔄 ƏKSİNƏ QORUMA:
  // Əgər istifadəçi artıq daxil olubsa və yenidən /login səhifəsinə girmək istəyirsə -> onu birbaşa /dashboard-a ötür
  if (user && url.pathname === '/login') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

// Mühafizəçinin hansı səhifələrə nəzarət edəcəyini seçirik
export const config = {
  matcher: [
    '/dashboard/:path*', // Dashboard və onun altındakı bütün səhifələr
    '/login'             // Loqin səhifəsi
  ],
}
