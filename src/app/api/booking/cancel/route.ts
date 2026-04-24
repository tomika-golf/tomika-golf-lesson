import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { differenceInHours } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { reservationId } = await request.json();

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    const userId = user.id;

    const { data: reservation, error: fetchError } = await admin
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

    const hoursUntilLesson = differenceInHours(new Date(reservation.start_time), new Date());
    if (hoursUntilLesson < 3) {
      return NextResponse.json({ error: 'レッスン開始3時間前を過ぎているため、キャンセルはお電話でご連絡ください。' }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel API Error:', error);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
