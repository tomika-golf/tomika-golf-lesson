import { NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google-calendar';
import { addDays } from 'date-fns';
import { sliceBlockIntoSlots } from '@/utils/slot-slicer';

// キーワード判定
// 予定名に「マンツーマン」が含まれていれば man-to-man 専用
// 予定名に「グループ」が含まれていれば group 専用
// それ以外で「稼働」「レッスン」が含まれていれば両方対応（both）
const TARGET_KEYWORDS = ['稼働', 'レッスン', 'マンツーマン', 'グループ'];

function detectLessonType(summary: string): 'man-to-man' | 'group' | 'both' | null {
  const lowerSummary = summary.toLowerCase();

  if (lowerSummary.includes('マンツーマン')) return 'man-to-man';
  if (lowerSummary.includes('グループ')) return 'group';
  // 上記のいずれにも該当しないが「稼働」や「レッスン」を含む場合はどちらにも使える
  if (lowerSummary.includes('稼働') || lowerSummary.includes('レッスン')) return 'both';
  return null; // 関係ない予定
}

export const revalidate = 0;

export async function GET() {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is not set.' }, { status: 500 });
    }

    const calendar = getCalendarClient();
    
    // 今日から60日先までの予定を取得（枠を長めに出す）
    const timeMin = new Date().toISOString();
    const timeMax = addDays(new Date(), 60).toISOString();

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items || [];
    const now = new Date(); // 現在時刻

    // 稼働ブロックを50分枠のスロットに自動分割（種別付き）
    const allSlots = items.flatMap(event => {
      const summary = event.summary || '';
      const lessonType = detectLessonType(summary);

      if (!lessonType) return []; // 関係のない予定はスキップ

      const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
      const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;

      if (start && end) {
        return sliceBlockIntoSlots(start, end, now, 3, lessonType);
      }
      return [];
    });

    // 全スロットの中で最も遅い日付を取得（フロント側で「まだ枠が追加されていません」判定に使用）
    let lastSlotDate: string | null = null;
    if (allSlots.length > 0) {
      const lastSlot = allSlots[allSlots.length - 1];
      lastSlotDate = lastSlot.startTime.toISOString();
    }

    return NextResponse.json({
      success: true,
      slots: allSlots,
      lastSlotDate, // フロントに「最後の枠の日付」を渡す
    });
  } catch (error: any) {
    console.error('Slots API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
