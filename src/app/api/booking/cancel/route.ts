import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { differenceInHours } from 'date-fns';
import { google } from 'googleapis';

async function deleteFromGoogleCalendar(startTime: string) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!calendarId || !serviceAccountJson) return;

  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  const calendar = google.calendar({ version: 'v3', auth });

  const start = new Date(startTime);
  const end = new Date(start.getTime() + 60 * 1000);

  const { data } = await calendar.events.list({
    calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
  });

  await Promise.all(
    (data.items ?? []).map(e => calendar.events.delete({ calendarId, eventId: e.id! }))
  );
}

async function notifyAdmins(admin: ReturnType<typeof createAdminClient>, message: string) {
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) return;
  const adminUserIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (adminUserIds.length === 0) return;
  const { data: adminProfiles } = await admin.from('profiles').select('line_user_id').in('id', adminUserIds);
  const lineUserIds = (adminProfiles ?? []).map(p => p.line_user_id).filter(Boolean) as string[];
  await Promise.all(
    lineUserIds.map(lineUserId =>
      fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` },
        body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: message }] }),
      })
    )
  );
}

export async function POST(request: Request) {
  try {
    const { reservationId, cancelReason } = await request.json();

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

    const userId = user.id;

    const { data: reservation, error: fetchError } = await admin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: '予約データが見つかりません。' }, { status: 404 });
    }

    if (reservation.status !== 'confirmed') {
      return NextResponse.json({ error: 'この予約はすでにキャンセルされているか、受講完了しています。' }, { status: 400 });
    }

    const hoursUntilLesson = differenceInHours(new Date(reservation.start_time), new Date());
    if (hoursUntilLesson < 3) {
      return NextResponse.json({ error: 'レッスン開始3時間前を過ぎているため、キャンセルはお電話でご連絡ください。' }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from('reservations')
      .update({ status: 'cancelled', cancel_reason: cancelReason || null })
      .eq('id', reservationId);

    if (updateError) {
      throw updateError;
    }

    // 管理者へキャンセル通知（失敗しても成功とする）
    const { data: profile } = await admin.from('profiles').select('name').eq('id', userId).single();
    const customerName = profile?.name ?? 'お客様';
    const lessonDate = new Date(reservation.start_time);
    const dateStr = lessonDate.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric', weekday: 'short' });
    const timeStr = lessonDate.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false });
    const lessonLabel = reservation.lesson_type === 'man-to-man' ? 'マンツーマン（50分）' : 'マンツーマン（25分）';
    const reasonText = cancelReason ? `\n📝 理由：${cancelReason}` : '';
    notifyAdmins(admin, `❌ 予約がキャンセルされました\n\n👤 ${customerName} 様\n🗓️ ${dateStr} ${timeStr}\n🏌️ ${lessonLabel}${reasonText}`).catch(err =>
      console.error('[キャンセル管理者通知] エラー:', err)
    );

    // Googleカレンダーから予定を削除（失敗しても成功とする）
    deleteFromGoogleCalendar(reservation.start_time).catch(err =>
      console.error('[Googleカレンダー削除] エラー:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel API Error:', error);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
