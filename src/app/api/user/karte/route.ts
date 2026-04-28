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
