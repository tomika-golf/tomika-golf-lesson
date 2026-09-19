import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyAdmins } from '@/lib/notify-admin';

// Healthchecks.io へ生存確認のpingを送る(死活監視。失敗しても本処理には影響させない)
// レスポンスを返す前に完了させるため await して使う(Vercelは応答後に処理を打ち切ることがあるため)
async function pingHealthcheck(suffix: '' | '/fail' = '') {
  const url = process.env.HEALTHCHECKS_PING_URL;
  if (!url) return;
  try {
    await fetch(`${url}${suffix}`);
  } catch (err) {
    console.error('[Healthcheck ping] エラー:', err);
  }
}

export async function GET(request: Request) {
  const admin = createAdminClient();

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    // Vercelのcronからの呼び出しが認証で弾かれている場合のみ通知する
    // (このURLは誰でも叩けるため、無関係な401まで通知すると誤報だらけになる)
    if (request.headers.get('user-agent')?.includes('vercel-cron')) {
      notifyAdmins(admin, '⚠️ リマインド送信cronが認証エラーで実行できませんでした。\nCRON_SECRET の設定を確認してください。').catch(err =>
        console.error('[cronエラー通知] エラー:', err)
      );
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' }, { status: 500 });
  }

  try {
    const { data: pending, error: fetchError } = await admin
      .from('line_notification_queue')
      .select('*')
      .is('sent_at', null)
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!pending || pending.length === 0) {
      await pingHealthcheck();
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

    if (sent < pending.length) {
      notifyAdmins(admin, `⚠️ リマインド送信で一部失敗しました。\n${pending.length}件中${sent}件のみ送信成功。`).catch(err =>
        console.error('[cronエラー通知] エラー:', err)
      );
      await pingHealthcheck('/fail');
    } else {
      await pingHealthcheck();
    }

    return NextResponse.json({ sent, total: pending.length });
  } catch (err) {
    console.error('[LINE通知Cron] 致命的エラー:', err);
    notifyAdmins(admin, `🚨 リマインド送信cronでエラーが発生し、処理が中断しました。\nログを確認してください。`).catch(e =>
      console.error('[cronエラー通知] エラー:', e)
    );
    await pingHealthcheck('/fail');
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
