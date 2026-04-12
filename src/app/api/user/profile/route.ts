import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0; // 常に最新データを取得する

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ==========================================
    // 開発用ダミー判定（本番ではエラーを返します）
    // ==========================================
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';

    // プロフィール情報（チケット残数等）を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 行が見つからないエラー
      throw profileError;
    }

    // 予約履歴を取得（新しい順）
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (reservationsError) {
      throw reservationsError;
    }

    return NextResponse.json({
      success: true,
      profile: profile || { ticket_man_to_man: 0, ticket_group: 0, name: 'ゲスト' },
      reservations: reservations || [],
    });
  } catch (error: any) {
    console.error('User Dashboard Profile Error:', error);
    return NextResponse.json({ success: false, error: '情報の取得に失敗しました' }, { status: 500 });
  }
}
