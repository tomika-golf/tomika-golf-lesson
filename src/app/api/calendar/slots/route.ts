import { NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google-calendar';
import { createAdminClient } from '@/lib/supabase/admin';
import { addDays } from 'date-fns';
import { sliceBlockIntoSlots } from '@/utils/slot-slicer';

const TARGET_KEYWORDS = ['稼働', 'レッスン', 'マンツーマン', 'グループ'];

function isRelevantEvent(summary: string): boolean {
  return TARGET_KEYWORDS.some(kw => summary.includes(kw));
}

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is not set.' }, { status: 500 });
    }

    const calendar = getCalendarClient();

    const timeMin = new Date().toISOString();
    const timeMax = addDays(new Date(), 60).toISOString();

    const adminClient = createAdminClient();

    // カレンダーイベント・既存予約・休業日を並行取得
    const [calendarResponse, reservationsResult, blockedResult] = await Promise.all([
      calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      }),
      adminClient.from('reservations').select('start_time, end_time, lesson_type').eq('status', 'confirmed'),
      adminClient.from('blocked_dates').select('date'),
    ]);

    const blockedDateSet = new Set(
      (blockedResult.data || []).map(b => b.date)
    );

    const items = calendarResponse.data.items || [];
    const existingReservations = reservationsResult.data || [];
    const now = new Date();

    // すべての稼働ブロックから50分枠と25分枠を生成（既存予約・休業日で空き判定）
    const allSlots = items.flatMap(event => {
      const summary = event.summary || '';
      if (!isRelevantEvent(summary)) return [];

      // 休業日チェック
      const eventDate = event.start?.dateTime
        ? new Date(event.start.dateTime).toISOString().slice(0, 10)
        : event.start?.date;
      if (eventDate && blockedDateSet.has(eventDate)) return [];

      const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
      const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;

      if (start && end) {
        return sliceBlockIntoSlots(start, end, now, isAdmin ? 0 : 3, existingReservations);
      }
      return [];
    });

    let lastSlotDate: string | null = null;
    if (allSlots.length > 0) {
      const lastSlot = allSlots[allSlots.length - 1];
      lastSlotDate = lastSlot.startTime.toISOString();
    }

    return NextResponse.json({
      success: true,
      slots: allSlots,
      lastSlotDate,
    });
  } catch (error: any) {
    console.error('Slots API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
