import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { lineId, displayName, supabaseUserId } = await request.json();

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let userId: string | null = null;

    if (token) {
      const admin = createAdminClient();
      const { data: { user } } = await admin.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // トークンがない場合はsupabaseUserIdを信頼（後方互換）
    if (!userId) userId = supabaseUserId ?? null;
    if (!userId) {
      return NextResponse.json({ error: '認証情報が不足しています' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        line_user_id: lineId,
        name: displayName,
      }, { onConflict: 'id' });

    if (error) {
      console.error('Profile Upsert Error:', error);
      return NextResponse.json({ error: 'プロフィールの保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Auth Sync Error:', msg);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
