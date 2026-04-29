import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

// LINEユーザーIDから決定論的なメールとパスワードを生成する
// → Supabase OIDC設定不要で、LINE認証済みユーザーのセッションを作成できる
function buildCredentials(lineId: string) {
  const email = `line_${lineId}@liff.internal`;
  const password = createHmac('sha256', process.env.LINE_CHANNEL_SECRET!)
    .update(lineId)
    .digest('hex');
  return { email, password };
}

// LINE IDトークンをLINE公式APIで署名検証し、subがlineIdと一致するか確認する
async function verifyLineIdToken(idToken: string, lineId: string): Promise<{ ok: boolean; reason: string }> {
  const channelId = process.env.LINE_CHANNEL_ID;
  if (!channelId) return { ok: false, reason: 'LINE_CHANNEL_ID未設定' };
  try {
    const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
    });
    const data = await res.json();
    console.log('[LINE verify] status:', res.status, 'body:', JSON.stringify(data), 'channelId:', channelId, 'sub:', data.sub, 'lineId:', lineId);
    if (!res.ok) return { ok: false, reason: `LINE API ${res.status}: ${data.error_description ?? data.error ?? JSON.stringify(data)}` };
    if (data.sub !== lineId) return { ok: false, reason: `sub不一致 sub=${data.sub} lineId=${lineId}` };
    return { ok: true, reason: 'ok' };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

export async function POST(request: Request) {
  try {
    const { lineId, displayName, idToken } = await request.json();

    if (!lineId) {
      return NextResponse.json({ error: 'lineId が必要です' }, { status: 400 });
    }

    // IDトークンが送られてきた場合はLINE公式APIで署名検証する
    if (idToken) {
      const { ok, reason } = await verifyLineIdToken(idToken, lineId);
      if (!ok) {
        console.error('[LINE verify] 失敗:', reason);
        return NextResponse.json({ error: `LINE認証トークンの検証に失敗しました: ${reason}` }, { status: 401 });
      }
    }

    const { email, password } = buildCredentials(lineId);
    const admin = createAdminClient();
    const regular = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // まず既存ユーザーとしてログインを試みる
    const { data: signInData } = await regular.auth.signInWithPassword({ email, password });
    if (signInData?.session) {
      return NextResponse.json({
        session: signInData.session,
        userId: signInData.user?.id,
      });
    }

    // 存在しない場合は新規作成
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { lineId, displayName, provider: 'line' },
    });

    if (createError) {
      console.error('createUser error:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 作成直後にログイン
    const { data: newSignIn, error: newSignInError } = await regular.auth.signInWithPassword({
      email,
      password,
    });

    if (newSignInError || !newSignIn?.session) {
      console.error('signIn after create error:', newSignInError);
      return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 });
    }

    return NextResponse.json({
      session: newSignIn.session,
      userId: newSignIn.user?.id,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('line-session error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
