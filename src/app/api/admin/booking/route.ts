import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { google } from 'googleapis';

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

export async function POST(request: Request) {
  try {
    const { userId, startTime, endTime, lessonType, memo } = await request.json();

    if (!userId || !startTime || !endTime || !lessonType) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();
    const customerName = profile?.name ?? 'お客様';

    const { data, error } = await admin
      .from('reservations')
      .insert({
        user_id: userId,
        status: 'confirmed',
        lesson_type: lessonType,
        start_time: startTime,
        end_time: endTime,
        options: [],
        customer_memo: memo || '',
      })
      .select()
      .single();

    if (error) throw error;

    addToGoogleCalendar(customerName, startTime, endTime, lessonType).catch(err =>
      console.error('[管理者代理予約 Googleカレンダー登録] エラー:', err)
    );

    return NextResponse.json({ success: true, reservation: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Admin booking error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
