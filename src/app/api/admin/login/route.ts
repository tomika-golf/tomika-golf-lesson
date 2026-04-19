import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/admin-token';

function getAdminUsers() {
  return [
    { username: process.env.ADMIN_1_USERNAME, password: process.env.ADMIN_1_PASSWORD },
    { username: process.env.ADMIN_2_USERNAME, password: process.env.ADMIN_2_PASSWORD },
  ].filter(u => u.username && u.password);
}

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const match = getAdminUsers().find(u => u.username === username && u.password === password);
  if (!match) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 });
  }

  const token = await signAdminToken(username);
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  return res;
}
