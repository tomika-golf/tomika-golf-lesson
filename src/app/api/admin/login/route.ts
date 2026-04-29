import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/admin-token';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const RESET_MINUTES = 30;

function getAdminUsers() {
  return [
    { username: process.env.ADMIN_1_USERNAME?.trim(), password: process.env.ADMIN_1_PASSWORD?.trim(), role: 'full' },
    { username: process.env.ADMIN_2_USERNAME?.trim(), password: process.env.ADMIN_2_PASSWORD?.trim(), role: 'full' },
    { username: process.env.ADMIN_3_USERNAME?.trim(), password: process.env.ADMIN_3_PASSWORD?.trim(), role: 'staff' },
  ].filter(u => u.username && u.password);
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() ?? 'unknown';
}

async function isRateLimited(ip: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - LOCK_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('attempted_at', cutoff);
  return (count ?? 0) >= MAX_ATTEMPTS;
}

async function recordFailedAttempt(ip: string) {
  await supabaseAdmin.from('login_attempts').insert({ ip });
  // 古いレコードを定期削除
  const cutoff = new Date(Date.now() - RESET_MINUTES * 60 * 1000).toISOString();
  await supabaseAdmin.from('login_attempts').delete().lt('attempted_at', cutoff);
}

async function clearAttempts(ip: string) {
  await supabaseAdmin.from('login_attempts').delete().eq('ip', ip);
}

// 平文パスワードとbcryptハッシュの両方に対応（移行期間中の後方互換）
async function verifyPassword(input: string, stored: string): Promise<boolean> {
  const isHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$');
  if (isHashed) return bcrypt.compare(input, stored);
  return input === stored;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (await isRateLimited(ip)) {
    return NextResponse.json(
      { error: `ログイン試行回数が上限に達しました。${LOCK_MINUTES}分後に再試行してください。` },
      { status: 429 }
    );
  }

  const { username, password } = await request.json();
  const trimmedUsername = username?.trim();
  const trimmedPassword = password?.trim();

  let match = null;
  for (const user of getAdminUsers()) {
    if (user.username === trimmedUsername && await verifyPassword(trimmedPassword, user.password!)) {
      match = user;
      break;
    }
  }

  if (!match) {
    await recordFailedAttempt(ip);
    return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 });
  }

  await clearAttempts(ip);

  const role = match.role;
  const token = await signAdminToken(trimmedUsername, role);
  const cookieOpts = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 180 * 60, // 180分
    path: '/',
  };
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_token', token, { ...cookieOpts, httpOnly: true });
  res.cookies.set('admin_role', role, { ...cookieOpts, httpOnly: false });
  return res;
}
