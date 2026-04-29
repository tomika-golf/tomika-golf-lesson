import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/admin-token';

function getAdminUsers() {
  return [
    { username: process.env.ADMIN_1_USERNAME?.trim(), password: process.env.ADMIN_1_PASSWORD?.trim(), role: 'full' },
    { username: process.env.ADMIN_2_USERNAME?.trim(), password: process.env.ADMIN_2_PASSWORD?.trim(), role: 'full' },
    { username: process.env.ADMIN_3_USERNAME?.trim(), password: process.env.ADMIN_3_PASSWORD?.trim(), role: 'staff' },
  ].filter(u => u.username && u.password);
}

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const trimmedUsername = username?.trim();
  const trimmedPassword = password?.trim();

  const match = getAdminUsers().find(u => u.username === trimmedUsername && u.password === trimmedPassword);
  if (!match) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 });
  }

  const role = match.role;
  const token = await signAdminToken(trimmedUsername, role);
  const cookieOpts = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  };
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_token', token, { ...cookieOpts, httpOnly: true });
  // admin_role は httpOnly:false でクライアントから読める（UI表示の切り替え用）
  res.cookies.set('admin_role', role, { ...cookieOpts, httpOnly: false });
  return res;
}
