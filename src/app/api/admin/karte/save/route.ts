import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function parseKarteSections(content: string) {
  const goodMatch = content.match(/【今日の良かった点[^】]*】\s*([\s\S]*?)(?=【|$)/);
  const improveMatch = content.match(/【改善のポイント[^】]*】\s*([\s\S]*?)(?=【|$)/);
  const homeworkMatch = content.match(/【次回までの宿題[^】]*】\s*([\s\S]*?)(?=【|$)/);

  return {
    good: goodMatch?.[1]?.trim() || content,
    improve: improveMatch?.[1]?.trim() || '',
    homework: homeworkMatch?.[1]?.trim() || '',
  };
}

export async function POST(request: Request) {
  try {
    const { reservationId, content, videoUrl, isDraft } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is missing' }, { status: 400 });
    }

    const { good, improve, homework } = parseKarteSections(content);

    const { data, error } = await supabaseAdmin
      .from('review_notes')
      .upsert({
        reservation_id: reservationId,
        karte_good: good,
        karte_improve: improve,
        karte_homework: homework,
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Save Karte API Error:', msg);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
