import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenRole } from '@/lib/admin-token';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/dashboard/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;
  const role = token ? await getAdminTokenRole(token) : null;

  if (!role) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/dashboard/login', request.url));
  }

  // 従業員はカルテ関連ページ・APIへのアクセスを禁止
  if (role === 'staff') {
    const isKartePage = pathname.includes('/karte');
    const isKarteApi = pathname.startsWith('/api/admin/karte');
    if (isKartePage || isKarteApi) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'この操作の権限がありません' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
