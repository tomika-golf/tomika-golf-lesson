import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { differenceInHours } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { reservationId } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'; // 開発環境用

    // キャンセル対象の予約データを取得して状態を確認
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: '予約データが見つかりません。' }, { status: 404 });
    }

    if (reservation.status !== 'confirmed') {
      return NextResponse.json({ error: 'この予約はすでにキャンセルされているか、受講完了しています。' }, { status: 400 });
    }

    // キャンセル期限のチェック（例：レッスン開始の3時間前まで）
    const hoursUntilLesson = differenceInHours(new Date(reservation.start_time), new Date());
    if (hoursUntilLesson < 3) {
      return NextResponse.json({ error: 'レッスン開始3時間前を過ぎているため、キャンセルはお電話でご連絡ください。' }, { status: 400 });
    }

    // 予約を「キャンセル」に更新
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (updateError) {
      throw updateError;
    }

    // 注意：チケットは「完了時」に減るため、キャンセル時はチケットを「戻す」処理は発生しません。
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel API Error:', error);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
