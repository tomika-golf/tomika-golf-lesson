import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { lineId, displayName, supabaseUserId } = await request.json();

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 本人確認
    if (authError || !user || user.id !== supabaseUserId) {
      return NextResponse.json({ error: '認証情報が不足しています' }, { status: 401 });
    }

    // profiles テーブルへユーザー情報を保存または更新（Upsert）
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id, // Primary Key (auth.users と同一)
        line_user_id: lineId,
        name: displayName,
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Profile Upsert Error:', error);
      return NextResponse.json({ error: 'プロフィールの保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Auth Sync Error:', error);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
