import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { startTime, lessonType, appBaseUrl } = await request.json();

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const { data: profile } = await admin
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const customerName = profile?.name ?? 'お客様';

    const adminUserIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    console.log('[late-request] ADMIN_USER_IDS count:', adminUserIds.length);

    const { data: adminProfiles } = await admin
      .from('profiles')
      .select('id, line_user_id')
      .in('id', adminUserIds);

    console.log('[late-request] adminProfiles:', JSON.stringify(adminProfiles));

    const adminLineUserIds = (adminProfiles ?? []).map(p => p.line_user_id).filter(Boolean) as string[];
    if (adminLineUserIds.length === 0) {
      const reason = adminUserIds.length === 0
        ? 'ADMIN_USER_IDSが未設定'
        : `プロフィールにline_user_idなし（${adminUserIds.length}件のUUIDを検索）`;
      console.error('[late-request] 通知先なし:', reason);
      return NextResponse.json({ error: `通知先が設定されていません（${reason}）` }, { status: 500 });
    }

    const lessonDate = new Date(startTime);
    const dateStr = lessonDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
    const timeStr = `${lessonDate.getHours()}:${String(lessonDate.getMinutes()).padStart(2, '0')}`;
    const lessonLabel = lessonType === 'man-to-man' ? 'マンツーマン（50分）' : 'マンツーマン（25分）';

    // late_requestsテーブルに保存
    const { error: insertError } = await admin.from('late_requests').insert({
      user_id: user.id,
      start_time: startTime,
      lesson_type: lessonType,
      status: 'pending',
    });

    if (insertError) {
      console.error('[late-request] insert error:', insertError.message, insertError.code);
      return NextResponse.json({ error: `DB保存失敗: ${insertError.message}` }, { status: 500 });
    }

    const adminLink = `${appBaseUrl}/dashboard`;
    const message = `⚡ 直前予約リクエスト\n\n${customerName} 様\n${dateStr} ${timeStr}（${lessonLabel}）\n\n管理ダッシュボードで対応してください。\n${adminLink}`;

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) return NextResponse.json({ error: 'LINE設定が不完全です' }, { status: 500 });

    await Promise.all(
      adminLineUserIds.map(lineUserId =>
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` },
          body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: message }] }),
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
