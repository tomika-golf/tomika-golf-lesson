import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' }, { status: 500 });
  }

  const { data: pending } = await admin
    .from('line_notification_queue')
    .select('*')
    .is('sent_at', null)
    .lte('scheduled_at', new Date().toISOString());

  if (!pending || pending.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const item of pending) {
    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: item.line_user_id,
          messages: [{ type: 'text', text: item.message }],
        }),
      });

      if (res.ok) {
        await admin
          .from('line_notification_queue')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', item.id);
        sent++;
        console.log('[LINE通知Cron] 送信成功 to:', item.line_user_id);
      } else {
        const body = await res.text();
        console.error('[LINE通知Cron] 送信失敗:', res.status, body);
      }
    } catch (err) {
      console.error('[LINE通知Cron] エラー:', err);
    }
  }

  return NextResponse.json({ sent, total: pending.length });
}
