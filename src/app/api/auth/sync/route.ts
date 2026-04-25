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

    if (!userId) userId = supabaseUserId ?? null;
    if (!userId) {
      return NextResponse.json({ error: '認証情報が不足しています' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 既存プロフィールを確認
    const { data: existing } = await admin
      .from('profiles')
      .select('id, name')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      // 既存ユーザー：line_user_idのみ更新し、名前は上書きしない
      await admin.from('profiles').update({ line_user_id: lineId }).eq('id', userId);
    } else {
      // 新規ユーザー：名前はnullにして登録画面で入力してもらう
      const { error } = await admin.from('profiles').insert({
        id: userId,
        line_user_id: lineId,
        name: null,
        ticket_man_to_man: 0,
        ticket_group: 0,
      });
      if (error) {
        console.error('Profile Insert Error:', error);
        return NextResponse.json({ error: 'プロフィールの保存に失敗しました' }, { status: 500 });
      }
    }

    const hasName = !!(existing?.name);

    return NextResponse.json({ success: true, hasName });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Auth Sync Error:', msg);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
