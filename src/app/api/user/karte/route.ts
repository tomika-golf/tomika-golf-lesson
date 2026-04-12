import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    if (!reservationId) {
       return NextResponse.json({ error: 'reservationId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // カルテ（review_notes）と、関連するレッスンの日時（reservations）を取得
    const { data, error } = await supabase
      .from('review_notes')
      .select('karte_good, is_draft, reservations(start_time, lesson_type)')
      .eq('reservation_id', reservationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
         return NextResponse.json({ success: true, karte: null }); // まだカルテが作成されていない
      }
      throw error;
    }

    return NextResponse.json({ success: true, karte: data });
  } catch (error: any) {
    console.error('Fetch Karte Error:', error);
    return NextResponse.json({ success: false, error: 'カルテの取得に失敗しました' }, { status: 500 });
  }
}
