import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkBookingRules } from '@/utils/booking-rules';
import { google } from 'googleapis';

// 予約確定時にLINEで即時通知
async function sendBookingConfirmation(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  startTime: string,
  lessonType: string
) {
  const { data: profile } = await admin
    .from('profiles')
    .select('line_user_id')
    .eq('id', userId)
    .single();

  if (!profile?.line_user_id) return;

  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) return;

  const lessonDate = new Date(startTime);
  const dateStr = lessonDate.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = lessonDate.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false });
  const lessonLabel = lessonType === 'man-to-man' ? 'マンツーマン（50分）' : 'マンツーマン（25分）';

  const message = `✅ ご予約が確定しました！\n\n📅 ${dateStr} ${timeStr}\n🏌️ ${lessonLabel}\n\n当日お気をつけてお越しください。\n前日・当日の朝8時にもリマインダーをお送りします。\n\nキャンセルは3時間前まで\nメニューの「レッスンはこちら」から行えます。\n\n富加ゴルフ`;

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` },
    body: JSON.stringify({ to: profile.line_user_id, messages: [{ type: 'text', text: message }] }),
  });
}

// 管理者全員にLINE通知を送る共通関数
async function notifyAdmins(
  admin: ReturnType<typeof createAdminClient>,
  message: string
) {
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) return;

  const adminUserIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (adminUserIds.length === 0) return;

  const { data: adminProfiles } = await admin
    .from('profiles')
    .select('line_user_id')
    .in('id', adminUserIds);

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

// 予約確定時にGoogleカレンダーにイベント登録
async function addToGoogleCalendar(
  customerName: string,
  startTime: string,
  endTime: string,
  lessonType: string
) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!calendarId || !clientEmail || !privateKey) return;

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });
  const lessonLabel = lessonType === 'man-to-man' ? '50分' : '25分';

  await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `${customerName}様レッスン（${lessonLabel}）`,
      start: { dateTime: startTime, timeZone: 'Asia/Tokyo' },
      end: { dateTime: endTime, timeZone: 'Asia/Tokyo' },
    },
  });
}

// 予約作成時にLINEリマインダーをキューに登録
async function queueReminders(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  startTime: string
) {
  const { data: profile } = await admin
    .from('profiles')
    .select('line_user_id')
    .eq('id', userId)
    .single();

  if (!profile?.line_user_id) return;

  const lessonDate = new Date(startTime);
  const lessonStr = lessonDate.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric' });
  const timeStr = lessonDate.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false });

  // JST日付ベースで前日・当日の8時JST（= 23時UTC）を計算
  const lessonJST = new Date(lessonDate.getTime() + 9 * 60 * 60 * 1000);

  const prevDay = new Date(lessonJST);
  prevDay.setUTCDate(prevDay.getUTCDate() - 1);
  prevDay.setUTCHours(8, 0, 0, 0);
  const prevDayReminder = new Date(prevDay.getTime() - 9 * 60 * 60 * 1000);

  const sameDay = new Date(lessonJST);
  sameDay.setUTCHours(8, 0, 0, 0);
  const sameDayReminder = new Date(sameDay.getTime() - 9 * 60 * 60 * 1000);

  const now = new Date();
  const toInsert = [];

  if (prevDayReminder > now) {
    toInsert.push({
      line_user_id: profile.line_user_id,
      message: `📅 明日のレッスンのお知らせ\n${lessonStr} ${timeStr}のレッスンが予定されています。\nお気をつけてお越しください！`,
      scheduled_at: prevDayReminder.toISOString(),
    });
  }

  if (sameDayReminder > now) {
    toInsert.push({
      line_user_id: profile.line_user_id,
      message: `⛳ 本日のレッスンのお知らせ\n${lessonStr} ${timeStr}のレッスンが本日あります。\nお気をつけてお越しください！`,
      scheduled_at: sameDayReminder.toISOString(),
    });
  }

  if (toInsert.length > 0) {
    await admin.from('line_notification_queue').insert(toInsert);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startTime, endTime, lessonType, options, memo } = body;

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ success: false, error: '認証に失敗しました' }, { status: 401 });
    }

    const userId = user.id;

    const [profileResult, reservationsResult] = await Promise.all([
      admin.from('profiles').select('id, name').eq('id', userId).single(),
      admin.from('reservations').select('status, lesson_type').eq('user_id', userId),
    ]);

    // 名前未登録の場合は予約不可
    if (!profileResult.data || !profileResult.data.name || profileResult.data.name.trim() === '') {
      return NextResponse.json({ success: false, error: 'お名前の登録が必要です。マイページから登録してください。' }, { status: 400 });
    }

    const userReservations = reservationsResult.data || [];

    const ruleCheck = checkBookingRules({
      lessonType,
      isOverride: false,
      userProfile: {},
      userReservations,
    });

    if (!ruleCheck.isAllowed) {
      return NextResponse.json({ success: false, error: ruleCheck.errorMessage }, { status: 400 });
    }

    // ダブルブッキング防止
    const { data: conflicting, error: conflictError } = await admin
      .from('reservations')
      .select('id')
      .eq('status', 'confirmed')
      .lt('start_time', endTime)
      .gt('end_time', startTime)
      .limit(1);

    if (conflictError) {
      return NextResponse.json({ success: false, error: '予約確認中にエラーが発生しました' }, { status: 500 });
    }

    if (conflicting && conflicting.length > 0) {
      return NextResponse.json({ success: false, error: 'この時間帯はすでに予約が入っています。他の時間帯をお選びください。' }, { status: 409 });
    }

    const { data, error } = await admin
      .from('reservations')
      .insert({
        user_id: userId,
        status: 'confirmed',
        lesson_type: lessonType,
        start_time: startTime,
        end_time: endTime,
        options: options || [],
        customer_memo: memo || '',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: `予約の保存に失敗しました: ${error.message}` }, { status: 500 });
    }

    // お客様への予約確定LINE通知
    sendBookingConfirmation(admin, userId, startTime, lessonType).catch(err =>
      console.error('[予約確定LINE] エラー:', err)
    );

    // 管理者への新規予約通知
    const { data: customerProfile } = await admin.from('profiles').select('name').eq('id', userId).single();
    const customerName = customerProfile?.name ?? 'お客様';
    const bookingDate = new Date(startTime);
    const bookingDateStr = bookingDate.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric', weekday: 'short' });
    const bookingTimeStr = bookingDate.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false });
    const bookingLabel = lessonType === 'man-to-man' ? 'マンツーマン（50分）' : 'マンツーマン（25分）';
    notifyAdmins(admin, `📅 新規予約が入りました！\n\n👤 ${customerName} 様\n🗓️ ${bookingDateStr} ${bookingTimeStr}\n🏌️ ${bookingLabel}`).catch(err =>
      console.error('[管理者通知] エラー:', err)
    );

    // リマインダーをキューに登録（失敗しても予約は成功とする）
    queueReminders(admin, userId, startTime).catch(err =>
      console.error('[リマインダー登録] エラー:', err)
    );

    // Googleカレンダーにイベント登録（失敗しても予約は成功とする）
    addToGoogleCalendar(customerName, startTime, endTime, lessonType).catch(err =>
      console.error('[Googleカレンダー登録] エラー:', err)
    );

    return NextResponse.json({ success: true, reservation: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: '予期せぬエラーが発生しました' }, { status: 500 });
  }
}
