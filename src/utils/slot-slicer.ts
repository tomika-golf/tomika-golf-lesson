import { addMinutes, isBefore, addHours, differenceInMinutes, startOfHour } from 'date-fns';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean; // 既に予約で埋まっていれば false
  isBlockedByTimeToStart: boolean; // 直前ブロック判定（3時間前を切っていたら true）
  lessonType: 'man-to-man' | 'group' | 'both'; // この枠がどちらの種別向けか
}

/**
 * カレンダーの1つの「稼働ブロック（例: 9:00〜13:00）」を受け取り、
 * 「毎時00分スタート、50分終わりの10分インターバル」の枠（スロット）に自動分割します。
 * 
 * @param blockStart 稼働ブロックの開始時刻
 * @param blockEnd 稼働ブロックの終了時刻
 * @param now 現在の時刻（直前ブロック判定用）
 * @param blockHours 直前ブロックの基準時間（例：3時間前）
 * @param lessonType この稼働ブロックの対象レッスン種別
 * @returns 分割された予約枠（スロット）の配列
 */
export function sliceBlockIntoSlots(
  blockStart: Date,
  blockEnd: Date,
  now: Date = new Date(),
  blockHours: number = 3,
  lessonType: 'man-to-man' | 'group' | 'both' = 'both'
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // カレンダーの開始時刻を「XX時00分」のキリの良い時間に揃える
  let currentStartTime = startOfHour(blockStart);

  while (isBefore(currentStartTime, blockEnd)) {
    // スロットの終了時間は、開始時間から50分後
    const slotEndTime = addMinutes(currentStartTime, 50);

    // カレンダーの稼働終了時刻をはみ出すスロットは作成しない
    // 例：ブロック終了が12:30の場合、12:00〜12:50の枠は除外する
    if (isBefore(blockEnd, slotEndTime)) {
       break;
    }

    // 直前予約ブロック機能の判定 (要件定義書 4.3)
    // レッスン開始時刻と現在時刻の差分(分)が、指定時間(3時間=180分)未満ならブロックする
    const diffMinutes = differenceInMinutes(currentStartTime, now);
    const isBlockedByTimeToStart = diffMinutes < (blockHours * 60);

    slots.push({
      startTime: currentStartTime,
      endTime: slotEndTime,
      isAvailable: true, // 初期状態は「空き」。予約が入っているかどうかの確認処理はAPI側で行う
      isBlockedByTimeToStart,
      lessonType,
    });

    // 次のスロットは、1時間後（実質10分のインターバル）
    currentStartTime = addHours(currentStartTime, 1);
  }

  return slots;
}
