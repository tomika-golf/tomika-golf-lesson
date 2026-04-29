import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function parseKarteSections(content: string) {
  const goodMatch = content.match(/【課題】\s*([\s\S]*?)(?=【|$)/);
  const improveMatch = content.match(/【改善策】\s*([\s\S]*?)(?=【|$)/);
  const homeworkMatch = content.match(/【練習方法】\s*([\s\S]*?)(?=【|$)/);

  return {
    good: goodMatch?.[1]?.trim() || content,
    improve: improveMatch?.[1]?.trim() || '',
    homework: homeworkMatch?.[1]?.trim() || '',
  };
}

async function sendLineKarteNotification(reservationId: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error('[LINE通知] LINE_CHANNEL_ACCESS_TOKEN が未設定です');
    return;
  }

  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .select('user_id, start_time')
    .eq('id', reservationId)
    .single();

  if (!reservation?.user_id) {
    console.error('[LINE通知] 予約データが見つかりません reservationId:', reservationId);
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('line_user_id, name')
    .eq('id', reservation.user_id)
    .single();

  if (!profile?.line_user_id) {
    console.error('[LINE通知] line_user_id が未登録です user_id:', reservation.user_id);
    return;
  }

  const lessonDate = new Date(reservation.start_time).toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
  });

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: profile.line_user_id,
      messages: [
        {
          type: 'text',
          text: `📋 ${lessonDate}のレッスンカルテが公開されました！\n\nマイページからご確認いただけます。`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[LINE通知] 送信失敗 status:', res.status, 'body:', body);
  } else {
    console.log('[LINE通知] 送信成功 to:', profile.line_user_id);
  }
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

    // LINEプッシュ通知（公開時のみ、エラーは握りつぶしてカルテ保存は成功扱い）
    if (!isDraft) {
      sendLineKarteNotification(reservationId).catch(err =>
        console.error('LINE notification error:', err)
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Save Karte API Error:', msg);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
