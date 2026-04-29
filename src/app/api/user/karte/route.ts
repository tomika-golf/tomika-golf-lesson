import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const admin = createAdminClient();

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');
    if (!reservationId) {
      return NextResponse.json({ success: false, error: 'reservationId is required' }, { status: 400 });
    }

    // 予約がログインユーザー本人のものか確認してからカルテを取得
    const { data: reservation } = await admin
      .from('reservations')
      .select('user_id')
      .eq('id', reservationId)
      .single();

    if (!reservation || reservation.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'カルテが見つかりません' }, { status: 404 });
    }

    const { data, error } = await admin
      .from('review_notes')
      .select('karte_good, karte_improve, karte_homework, is_draft, reservations(start_time, lesson_type)')
      .eq('reservation_id', reservationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: true, karte: null });
      }
      throw error;
    }

    return NextResponse.json({ success: true, karte: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Fetch Karte Error:', msg);
    return NextResponse.json({ success: false, error: 'カルテの取得に失敗しました' }, { status: 500 });
  }
}
