import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { action } = await request.json();
  const admin = createAdminClient();

  const { data: req } = await admin
    .from('late_requests')
    .select('user_id, start_time, lesson_type')
    .eq('id', id)
    .single();

  if (!req) return NextResponse.json({ error: 'リクエストが見つかりません' }, { status: 404 });

  const { data: profile } = await admin
    .from('profiles')
    .select('name, line_user_id')
    .eq('id', req.user_id)
    .single();

  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineUserId = profile?.line_user_id;
  const customerName = profile?.name ?? 'お客様';
  const lessonDate = new Date(req.start_time);
  const dateStr = lessonDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
  const timeStr = `${lessonDate.getHours()}:${String(lessonDate.getMinutes()).padStart(2, '0')}`;
  const lessonLabel = req.lesson_type === 'man-to-man' ? 'マンツーマン（50分）' : 'マンツーマン（25分）';

  const sendLine = async (message: string) => {
    if (!lineToken || !lineUserId) return;
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: message }] }),
    });
  };

  if (action === 'book') {
    const durationMin = req.lesson_type === 'man-to-man' ? 50 : 25;
    const startTime = new Date(req.start_time);
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

    const { error: bookError } = await admin.from('reservations').insert({
      user_id: req.user_id,
      status: 'confirmed',
      lesson_type: req.lesson_type,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      options: [],
      customer_memo: '',
    });

    if (bookError) return NextResponse.json({ error: bookError.message }, { status: 500 });

    await sendLine(`✅ レッスン予約が確定しました！\n\n${dateStr} ${timeStr}\n${lessonLabel}\n\nご参加をお待ちしております。`);
    await admin.from('late_requests').update({ status: 'booked' }).eq('id', id);

    return NextResponse.json({ success: true });
  }

  if (action === 'reject') {
    await sendLine(`申し訳ございません。\n\n${customerName} 様\nご希望の${dateStr} ${timeStr}（${lessonLabel}）につきまして、あいにく対応が難しい状況です。\n\nご不便をおかけして申し訳ございません。別の日程でのご予約をお待ちしております。`);
    await admin.from('late_requests').update({ status: 'rejected' }).eq('id', id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: '不明なアクションです' }, { status: 400 });
}
