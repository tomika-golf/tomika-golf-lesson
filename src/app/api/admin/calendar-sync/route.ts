import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { google } from 'googleapis';

export async function POST(request: Request) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!calendarId || !clientEmail || !privateKey) {
    return NextResponse.json({ error: 'Google Calendar環境変数が未設定です' }, { status: 500 });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  const calendar = google.calendar({ version: 'v3', auth });

  const admin = createAdminClient();

  const { data: reservations, error } = await admin
    .from('reservations')
    .select('id, user_id, start_time, end_time, lesson_type')
    .eq('status', 'confirmed')
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set((reservations ?? []).map(r => r.user_id))];
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name ?? 'お客様']));

  let successCount = 0;
  const errors: string[] = [];

  for (const r of reservations ?? []) {
    try {
      const customerName = profileMap[r.user_id] ?? 'お客様';
      const lessonLabel = r.lesson_type === 'man-to-man' ? '50分' : '25分';
      await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `${customerName}様レッスン（${lessonLabel}）`,
          start: { dateTime: r.start_time, timeZone: 'Asia/Tokyo' },
          end: { dateTime: r.end_time, timeZone: 'Asia/Tokyo' },
        },
      });
      successCount++;
    } catch (e: any) {
      errors.push(`予約ID ${r.id}: ${e.message}`);
    }
  }

  return NextResponse.json({ success: true, successCount, errors });
}

// キャンセル済み予約のカレンダーイベントを一括削除
export async function DELETE() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!calendarId || !clientEmail || !privateKey) {
    return NextResponse.json({ error: 'Google Calendar環境変数が未設定です' }, { status: 500 });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  const calendar = google.calendar({ version: 'v3', auth });

  const admin = createAdminClient();

  const { data: reservations, error } = await admin
    .from('reservations')
    .select('id, start_time')
    .eq('status', 'cancelled')
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let deletedCount = 0;
  const errors: string[] = [];

  for (const r of reservations ?? []) {
    try {
      const start = new Date(r.start_time);
      const end = new Date(start.getTime() + 60 * 1000);

      const { data } = await calendar.events.list({
        calendarId,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
      });

      for (const event of data.items ?? []) {
        await calendar.events.delete({ calendarId, eventId: event.id! });
        deletedCount++;
      }
    } catch (e: any) {
      errors.push(`予約ID ${r.id}: ${e.message}`);
    }
  }

  return NextResponse.json({ success: true, deletedCount, errors });
}
