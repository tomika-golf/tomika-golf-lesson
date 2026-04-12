"use client";

import { useEffect, useState, useMemo } from "react";
import { addDays, format, startOfDay, isSameDay, isAfter, isBefore } from "date-fns";
import { ja } from "date-fns/locale";

type TimeSlot = {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBlockedByTimeToStart: boolean;
  lessonType: "man-to-man" | "group" | "both";
};

export default function BookingPage() {
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [lastSlotDate, setLastSlotDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [lessonType, setLessonType] = useState<"man-to-man" | "group">("man-to-man");
  const [options, setOptions] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/calendar/slots")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAllSlots(data.slots || []);
          setLastSlotDate(data.lastSlotDate || null);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // 選択中のlessonTypeに対応するスロットだけに絞り込む
  const filteredSlots = useMemo(() => {
    return allSlots.filter((slot) => {
      if (slot.lessonType === "both") return true;
      return slot.lessonType === lessonType;
    });
  }, [allSlots, lessonType]);

  // カレンダーに表示する日付の一覧（今日〜60日後）
  const calendarDates = useMemo(() => {
    const dates: Date[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 60; i++) {
      dates.push(addDays(today, i));
    }
    return dates;
  }, []);

  // 各日付に何枠あるかのカウントマップ（視覚的に枠がある日にマークをつけるため）
  const dateSlotCountMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredSlots.forEach((slot) => {
      const dateKey = format(new Date(slot.startTime), "yyyy-MM-dd");
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    });
    return map;
  }, [filteredSlots]);

  // 選択した日の枠だけを表示
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredSlots.filter((slot) =>
      isSameDay(new Date(slot.startTime), selectedDate)
    );
  }, [filteredSlots, selectedDate]);

  // 「まだ日程が追加されていません」表示の判定
  const isDateBeyondLastSlot = useMemo(() => {
    if (!selectedDate || !lastSlotDate) return false;
    return isAfter(startOfDay(selectedDate), startOfDay(new Date(lastSlotDate)));
  }, [selectedDate, lastSlotDate]);

  const handleOptionToggle = (option: string) => {
    setOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          lessonType,
          options,
          memo,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert("予約が完了しました！（※開発中のテスト通知です）");
        setSelectedSlot(null);
      } else {
        alert("エラー: " + data.error);
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // lessonType変更時にスロット選択をリセット
  const handleLessonTypeChange = (type: "man-to-man" | "group") => {
    setLessonType(type);
    setSelectedSlot(null);
    if (type === "group") setOptions([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      {/* ヘッダー */}
      <header className="bg-brand text-white px-6 py-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold">🎯 レッスン予約</h1>
        <button className="text-sm border border-white px-3 py-1 rounded">戻る</button>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {/* レッスン種別の選択 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-brand mb-3 border-b-2 border-brand pb-1">1. レッスン種別</h2>
          <div className="flex gap-4">
            <button
              onClick={() => handleLessonTypeChange("man-to-man")}
              className={`flex-1 py-3 rounded-lg font-bold border-2 transition-colors ${
                lessonType === "man-to-man" ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              マンツーマン
            </button>
            <button
              onClick={() => handleLessonTypeChange("group")}
              className={`flex-1 py-3 rounded-lg font-bold border-2 transition-colors ${
                lessonType === "group" ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              グループ
            </button>
          </div>
        </section>

        {/* カレンダー日付選択 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-brand mb-3 border-b-2 border-brand pb-1">2. 日にちを選ぶ</h2>
          {loading ? (
            <div className="text-center py-10 text-gray-500">カレンダーを読み込んでいます...</div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm p-3 overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 min-w-[320px]">
                {/* 曜日ヘッダー */}
                {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                  <div key={day} className={`text-center text-xs font-bold py-1 ${day === "日" ? "text-red-500" : day === "土" ? "text-blue-500" : "text-gray-500"}`}>
                    {day}
                  </div>
                ))}
                
                {/* 最初の日の曜日分の空白を埋める */}
                {Array.from({ length: calendarDates[0]?.getDay() || 0 }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                
                {/* 日付ボタン */}
                {calendarDates.map((date) => {
                  const dateKey = format(date, "yyyy-MM-dd");
                  const slotCount = dateSlotCountMap.get(dateKey) || 0;
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isPast = isBefore(date, startOfDay(new Date()));
                  const dayOfWeek = date.getDay();

                  return (
                    <button
                      key={dateKey}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      disabled={isPast}
                      className={`relative py-2 rounded-lg text-sm font-bold transition-all ${
                        isPast
                          ? "text-gray-300 cursor-not-allowed"
                          : isSelected
                          ? "bg-accent text-white shadow-md scale-105"
                          : slotCount > 0
                          ? "bg-green-50 text-gray-800 hover:bg-green-100 border border-green-200"
                          : "text-gray-400 hover:bg-gray-50"
                      } ${dayOfWeek === 0 ? "text-red-500" : ""} ${dayOfWeek === 6 ? "text-blue-500" : ""}`}
                    >
                      {date.getDate()}
                      {slotCount > 0 && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* 時間枠の選択 */}
        {selectedDate && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-brand mb-3 border-b-2 border-brand pb-1">
              3. 時間を選ぶ（{format(selectedDate, "M月d日(E)", { locale: ja })}）
            </h2>

            {isDateBeyondLastSlot ? (
              // 最後の枠より未来の日付を選択した場合
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">📅</div>
                <p className="font-bold text-gray-700 mb-1">まだ日程が追加されていません</p>
                <p className="text-sm text-gray-500">日程追加まで少々お待ちください。</p>
              </div>
            ) : slotsForSelectedDate.length === 0 ? (
              // 枠の範囲内だが、この日には枠がない場合
              <div className="bg-gray-50 border rounded-xl p-6 text-center">
                <p className="text-gray-500 text-sm">
                  {format(selectedDate, "M月d日", { locale: ja })}は
                  {lessonType === "man-to-man" ? "マンツーマン" : "グループ"}レッスンの枠がありません。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slotsForSelectedDate.map((slot, index) => {
                  const date = new Date(slot.startTime);
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  const label = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

                  if (slot.isBlockedByTimeToStart) {
                    return (
                      <div key={index} className="bg-gray-100 border-2 border-gray-200 text-gray-400 py-3 px-4 rounded-lg text-center opacity-70">
                        <span className="font-bold text-lg">{label}</span>
                        <p className="text-xs mt-1">締切済</p>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-4 rounded-lg font-bold border-2 transition-all text-center ${
                        isSelected
                          ? "bg-accent border-accent text-white shadow-md scale-105"
                          : "bg-white border-gray-300 text-gray-700 hover:border-accent hover:text-accent"
                      }`}
                    >
                      <span className="text-lg">{label}</span>
                      {isSelected && <p className="text-xs mt-1">✓ 選択中</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ヒアリング（事前アンケート） */}
        {selectedSlot && (
          <section className="mb-8 animate-fade-in">
            <h2 className="text-lg font-bold text-brand mb-3 border-b-2 border-brand pb-1">4. 事前ヒアリング</h2>
            
            {lessonType === "man-to-man" && (
              <div className="mb-4 bg-white p-4 rounded-lg border">
                <label className="block font-bold mb-2 text-gray-700">追加オプション (複数選択可)</label>
                <div className="flex flex-wrap gap-2">
                  {["芝 (+1,000円)", "バンカー (+1,000円)"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleOptionToggle(opt)}
                      className={`px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
                        options.includes(opt) ? "bg-green-100 border-brand text-brand" : "bg-gray-50 border-gray-300 text-gray-600"
                      }`}
                    >
                      {options.includes(opt) ? "✓ " : ""}{opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg border">
              <label className="block font-bold mb-2 text-gray-700">今回の希望課題など（自由記述）</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-brand transition-colors"
                rows={3}
                placeholder="例: ドライバーの飛距離を伸ばしたい、スライスを直したい等"
              ></textarea>
            </div>
          </section>
        )}
      </main>

      {/* 予約ボタン（画面下部固定） */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="max-w-2xl mx-auto flex gap-4 items-center">
            <div className="flex-1 text-sm font-bold text-gray-700">
              <div>{format(new Date(selectedSlot.startTime), "M/d(E) H:mm", { locale: ja })}</div>
              <div className="text-brand">
                {lessonType === "man-to-man" ? "マンツーマン" : "グループ"} チケット 1枚消費
              </div>
            </div>
            <button
              onClick={handleBooking}
              disabled={isSubmitting}
              className={`flex-1 ${isSubmitting ? 'bg-gray-400' : 'bg-accent hover:translate-y-[-2px]'} text-white py-3 rounded-xl font-bold shadow-md transition-all`}
            >
              {isSubmitting ? '処理中...' : '予約を確定する'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
