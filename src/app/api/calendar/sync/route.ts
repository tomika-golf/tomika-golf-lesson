import { NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google-calendar';
import { addDays } from 'date-fns';

// 取得対象とするキーワード（要件定義書 4.1：キーワード縛り）
const TARGET_KEYWORDS = ['稼働', 'レッスン'];

// Next.jsがこのAPIをキャッシュせず、毎回最新の情報を取得するようにする
export const revalidate = 0;

export async function GET() {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is not set.' }, { status: 500 });
    }

    const calendar = getCalendarClient();
    
    // 今日から30日先までの大元の予定ブロックを取得する
    const timeMin = new Date().toISOString();
    const timeMax = addDays(new Date(), 30).toISOString();

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items || [];

    // プライベートな予定（歯医者など）を除外するため、キーワードで絞り込み
    const filteredEvents = items.filter(event => {
      const summary = event.summary || '';
      return TARGET_KEYWORDS.some(keyword => summary.includes(keyword));
    });

    return NextResponse.json({
      success: true,
      count: filteredEvents.length,
      // 本来はこの後、このブロックを50分枠に「スライス」する処理（ステップ2）に入りますが、
      // 今回はまず「正しく取得できているか」を確認するためにそのまま返します。
      events: filteredEvents,
    });
  } catch (error: any) {
    console.error('Google Calendar API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
