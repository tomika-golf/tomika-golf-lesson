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

export async function POST(request: Request) {
  try {
    const { lineId, displayName } = await request.json();

    if (!lineId) {
      return NextResponse.json({ error: 'lineId が必要です' }, { status: 400 });
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
