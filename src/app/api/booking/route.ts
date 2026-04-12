import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkBookingRules } from '@/utils/booking-rules';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startTime, endTime, lessonType, options, memo } = body;

    const supabase = await createClient();

    // 現在ログインしているユーザーを取得（ステップ5のLINEログイン実装後に本格稼働します）
    const { data: { user } } = await supabase.auth.getUser();

    // ==========================================
    // ⚠️ 開発初期（テスト用）のバイパス処理
    // まだユーザーログインの仕組みがないため、システムエラーを防ぐために
    // 仮のID（ゼロ埋め）を割り当てます。本来はエラーを返します。
    // ==========================================
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';
    const isOverride = body.isOverride === true; // 管理者からの強制実行フラグ

    // ビジネスルールの検証：プロファイル（チケット数）と予約履歴を取得
    const [profileResult, reservationsResult] = await Promise.all([
      supabase.from('profiles').select('ticket_man_to_man, ticket_group').eq('id', userId).single(),
      supabase.from('reservations').select('status, lesson_type').eq('user_id', userId)
    ]);

    // プロフィールが存在しない場合はダミーデータ（開発用）またはnullをセット
    const userProfile = profileResult.data || { ticket_man_to_man: 0, ticket_group: 0 };
    const userReservations = reservationsResult.data || [];

    // 予約可能な条件を満たしているか判定（直前ブロック判定はUIとスライサーで実施済み）
    const ruleCheck = checkBookingRules({
      lessonType,
      isOverride,
      userProfile,
      userReservations,
    });

    if (!ruleCheck.isAllowed) {
      return NextResponse.json({ success: false, error: ruleCheck.errorMessage }, { status: 400 });
    }

    // データベース (Supabase) の reservations テーブルに予約を保存
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        user_id: userId,
        status: 'confirmed', // 予約確定
        lesson_type: lessonType, // マンツーマン or グループ
        start_time: startTime,
        end_time: endTime,
        options: options || [], // 芝・バンカーなど
        customer_memo: memo || '', // 自由記述
      })
      .select()
      .single();

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json({ success: false, error: '予約の保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reservation: data,
    });
  } catch (error: any) {
    console.error('Booking API Error:', error);
    return NextResponse.json({ success: false, error: '予期せぬシステムエラーが発生しました' }, { status: 500 });
  }
}
