import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUsernameFromCookie } from '@/lib/admin-token';

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

// JST で夜10時〜翌朝8時の静寂時間帯かどうか判定
function isQuietHoursJST(): boolean {
  const jstHour = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCHours();
  return jstHour >= 22 || jstHour < 8;
}

// 翌朝8時JST（UTC表記）を返す
function next8amJST(): Date {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const target = new Date(jstNow);
  target.setUTCHours(8, 0, 0, 0);
  if (jstNow.getUTCHours() >= 8) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return new Date(target.getTime() - 9 * 60 * 60 * 1000);
}

async function pushLineMessage(lineUserId: string, message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error('[LINE通知] LINE_CHANNEL_ACCESS_TOKEN が未設定です');
    return;
  }
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[LINE通知] 送信失敗 status:', res.status, 'body:', body);
  } else {
    console.log('[LINE通知] 送信成功 to:', lineUserId);
  }
}

async function handleKarteNotification(reservationId: string, isEdit: boolean) {
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
    .select('line_user_id')
    .eq('id', reservation.user_id)
    .single();

  if (!profile?.line_user_id) {
    console.error('[LINE通知] line_user_id が未登録です user_id:', reservation.user_id);
    return;
  }

  const lessonDate = new Date(reservation.start_time).toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
  });

  const message = isEdit
    ? `📝 ${lessonDate}のレッスンカルテが編集されました。\n\nマイページからご確認いただけます。`
    : `📋 ${lessonDate}のレッスンカルテが公開されました！\n\nマイページからご確認いただけます。`;

  if (isQuietHoursJST()) {
    // 静寂時間帯 → 翌朝8時に送信するためキューに積む
    await supabaseAdmin.from('line_notification_queue').insert({
      line_user_id: profile.line_user_id,
      message,
      scheduled_at: next8amJST().toISOString(),
    });
    console.log('[LINE通知] 静寂時間帯のためキューに登録 scheduled_at:', next8amJST().toISOString());
  } else {
    await pushLineMessage(profile.line_user_id, message);
  }
}

export async function POST(request: Request) {
  try {
    const adminUsername = getAdminUsernameFromCookie(request.headers.get('cookie'));
    const { reservationId, content, videoUrl, isDraft } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is missing' }, { status: 400 });
    }

    // 公開済みカルテが存在するか確認（公開 vs 編集の判定に使う）
    const { data: existing } = await supabaseAdmin
      .from('review_notes')
      .select('is_draft')
      .eq('reservation_id', reservationId)
      .single();

    const isAlreadyPublished = existing && !existing.is_draft;

    // 既存カルテがあれば履歴に保存
    if (existing) {
      const { data: currentKarte } = await supabaseAdmin
        .from('review_notes')
        .select('karte_good, karte_improve, karte_homework, video_url, is_draft')
        .eq('reservation_id', reservationId)
        .single();
      if (currentKarte) {
        await supabaseAdmin.from('review_notes_history').insert({
          review_note_id: (await supabaseAdmin.from('review_notes').select('id').eq('reservation_id', reservationId).single()).data?.id,
          karte_good: currentKarte.karte_good,
          karte_improve: currentKarte.karte_improve,
          karte_homework: currentKarte.karte_homework,
          video_url: currentKarte.video_url,
          is_draft: currentKarte.is_draft,
          saved_by: adminUsername,
        });
      }
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

    if (!isDraft) {
      handleKarteNotification(reservationId, !!isAlreadyPublished).catch(err =>
        console.error('[LINE通知] エラー:', err)
      );
    }

    // #15: 操作ログを記録
    await supabaseAdmin.from('admin_operation_logs').insert({
      admin_username: adminUsername,
      action: isDraft ? 'karte_draft_saved' : (isAlreadyPublished ? 'karte_edited' : 'karte_published'),
      target_id: reservationId,
      detail: isDraft ? '下書き保存' : (isAlreadyPublished ? 'カルテ編集・再公開' : 'カルテ新規公開'),
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Save Karte API Error:', msg);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
