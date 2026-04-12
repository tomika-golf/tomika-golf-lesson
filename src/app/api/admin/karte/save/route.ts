import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { reservationId, content, videoUrl, isDraft } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is missing' }, { status: 400 });
    }

    // review_notes テーブルにカルテを保存（すでに存在すれば更新：Upsert）
    const { data, error } = await supabaseAdmin
      .from('review_notes')
      .upsert({
        reservation_id: reservationId,
        karte_good: content, // 今回はAIが清書した全文をここに格納します
        video_url: videoUrl || '',
        is_draft: isDraft ?? false,
      }, {
        onConflict: 'reservation_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Save Karte Error:', error);
      return NextResponse.json({ error: 'カルテの保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Save Karte API Error:', error);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
