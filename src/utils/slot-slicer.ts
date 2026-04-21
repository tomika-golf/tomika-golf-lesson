import { addMinutes, isBefore, differenceInMinutes, startOfHour } from 'date-fns';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  isBlockedByTimeToStart: boolean;
  lessonType: 'man-to-man' | 'group';
}

export interface ExistingReservation {
  start_time: string;
  end_time: string;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * カレンダーの1つの稼働ブロックを受け取り、
 * 50分枠（毎時00分スタート、man-to-man）と
 * 25分枠（毎時00分・30分スタート、group）の両方を生成する。
 * 既存予約と重複するスロットは isAvailable: false になる。
 */
export function sliceBlockIntoSlots(
  blockStart: Date,
  blockEnd: Date,
  now: Date = new Date(),
  blockHours: number = 3,
  existingReservations: ExistingReservation[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const reservations = existingReservations.map(r => ({
    start: new Date(r.start_time),
    end: new Date(r.end_time),
  }));

  const hourStart = startOfHour(blockStart);

  // 50-min slots (man-to-man): on the hour only
  for (let cur = new Date(hourStart); isBefore(cur, blockEnd); cur = addMinutes(cur, 60)) {
    const end = addMinutes(cur, 50);
    if (isBefore(blockEnd, end)) continue;

    const diffMinutes = differenceInMinutes(cur, now);
    const isBlockedByTimeToStart = diffMinutes < blockHours * 60;
    const isAvailable = !reservations.some(r => overlaps(cur, end, r.start, r.end));

    slots.push({
      startTime: new Date(cur),
      endTime: end,
      isAvailable,
      isBlockedByTimeToStart,
      lessonType: 'man-to-man',
    });
  }

  // 25-min slots (group): on the hour and half-hour
  for (let cur = new Date(hourStart); isBefore(cur, blockEnd); cur = addMinutes(cur, 30)) {
    const end = addMinutes(cur, 25);
    if (isBefore(blockEnd, end)) continue;

    const diffMinutes = differenceInMinutes(cur, now);
    const isBlockedByTimeToStart = diffMinutes < blockHours * 60;
    const isAvailable = !reservations.some(r => overlaps(cur, end, r.start, r.end));

    slots.push({
      startTime: new Date(cur),
      endTime: end,
      isAvailable,
      isBlockedByTimeToStart,
      lessonType: 'group',
    });
  }

  return slots;
}
