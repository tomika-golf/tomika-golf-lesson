import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { reservationId, message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'メッセージを入力してください' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: reservation } = await admin
      .from('reservations')
      .select('user_id, start_time, profiles(name, line_user_id)')
      .eq('id', reservationId)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 });
    }

    const lineUserId = (reservation.profiles as any)?.line_user_id;
    if (!lineUserId) {
      return NextResponse.json({ error: 'このお客様のLINEアカウントが登録されていません' }, { status: 400 });
    }

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN が未設定です' }, { status: 500 });
    }

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text: message.trim() }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[LINE送信] 失敗:', res.status, body);
      return NextResponse.json({ error: 'LINE送信に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
