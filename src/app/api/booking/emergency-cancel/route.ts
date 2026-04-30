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

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN が未設定です' }, { status: 500 });
    }

    // ADMIN_USER_IDS からSupabaseのUUIDを取得し、line_user_idを引く
    const adminUserIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (adminUserIds.length === 0) {
      return NextResponse.json({ error: 'ADMIN_USER_IDS が未設定です' }, { status: 500 });
    }

    const { data: adminProfiles } = await admin
      .from('profiles')
      .select('line_user_id')
      .in('id', adminUserIds);

    const adminLineUserIds = (adminProfiles ?? [])
      .map(p => p.line_user_id)
      .filter(Boolean) as string[];

    if (adminLineUserIds.length === 0) {
      return NextResponse.json({ error: '通知先のLINEユーザーIDが見つかりません' }, { status: 500 });
    }

    const lessonDate = new Date(reservation.start_time);
    const lessonStr = lessonDate.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric' });
    const timeStr = lessonDate.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false });
    const customerName = (reservation.profiles as any)?.name ?? 'お客様';

    const message = `⚠️ 直前キャンセル申請\n\n${customerName} 様\n${lessonStr} ${timeStr}のレッスン\n\n管理画面から対応をお願いします。`;

    // 全管理者に並列送信
    await Promise.all(
      adminLineUserIds.map(lineUserId =>
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${lineToken}`,
          },
          body: JSON.stringify({
            to: lineUserId,
            messages: [{ type: 'text', text: message }],
          }),
        }).then(res => {
          if (!res.ok) {
            res.text().then(body =>
              console.error('[緊急キャンセル通知] 送信失敗:', lineUserId, res.status, body)
            );
          }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
