import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // 予約の存在・オーナー確認
    const { data: reservation } = await admin
      .from('reservations')
      .select('*, profiles(name)')
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .single();

    if (!reservation || reservation.status !== 'confirmed') {
      return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 });
    }

    const adminLineUserId = process.env.ADMIN_LINE_USER_ID;
    if (!adminLineUserId) {
      return NextResponse.json({ error: 'ADMIN_LINE_USER_ID が未設定です' }, { status: 500 });
    }

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN が未設定です' }, { status: 500 });
    }

    const lessonDate = new Date(reservation.start_time);
    const lessonStr = lessonDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
    const timeStr = `${lessonDate.getHours()}:${String(lessonDate.getMinutes()).padStart(2, '0')}`;
    const customerName = (reservation.profiles as any)?.name ?? 'お客様';

    const message = `⚠️ 直前キャンセル申請\n\n${customerName} 様\n${lessonStr} ${timeStr}のレッスン\n\n管理画面から対応をお願いします。`;

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        to: adminLineUserId,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[緊急キャンセル通知] 送信失敗:', res.status, body);
      return NextResponse.json({ error: 'LINE通知の送信に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
