import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { message, userIds } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: 'メッセージを入力してください' }, { status: 400 });

    const admin = createAdminClient();

    let query = admin.from('profiles').select('line_user_id, name');
    if (userIds && userIds.length > 0) {
      query = query.in('id', userIds);
    }
    const { data: profiles } = await query;

    const targets = (profiles || []).filter(p => p.line_user_id);
    if (targets.length === 0) return NextResponse.json({ error: '送信対象のお客様がいません' }, { status: 400 });

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN が未設定です' }, { status: 500 });

    let successCount = 0;
    await Promise.all(
      targets.map(async p => {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` },
          body: JSON.stringify({ to: p.line_user_id, messages: [{ type: 'text', text: message.trim() }] }),
        });
        if (res.ok) successCount++;
        else console.error('[一斉送信] 失敗:', p.name, res.status);
      })
    );

    return NextResponse.json({ success: true, sent: successCount, total: targets.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
