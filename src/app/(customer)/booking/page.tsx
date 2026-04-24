"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, startOfDay, isSameDay, isAfter, isBefore } from "date-fns";
import { ja } from "date-fns/locale";
import { useAuthContext } from "@/contexts/AuthContext";

type TimeSlot = {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBlockedByTimeToStart: boolean;
  lessonType: "man-to-man" | "group";
};

export default function BookingPage() {
  const router = useRouter();
  const { isReady, error: authError, accessToken } = useAuthContext();
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [lastSlotDate, setLastSlotDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [lessonType, setLessonType] = useState<"man-to-man" | "group">("man-to-man");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!isReady) return;
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
  }, [isReady]);

  const filteredSlots = useMemo(() => {
    return allSlots.filter((slot) => slot.lessonType === lessonType && slot.isAvailable);
  }, [allSlots, lessonType]);

  const calendarDates = useMemo(() => {
    const dates: Date[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 60; i++) {
      dates.push(addDays(today, i));
    }
    return dates;
  }, []);

  const dateSlotCountMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredSlots.forEach((slot) => {
      const dateKey = format(new Date(slot.startTime), "yyyy-MM-dd");
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    });
    return map;
  }, [filteredSlots]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredSlots.filter((slot) =>
      isSameDay(new Date(slot.startTime), selectedDate)
    );
  }, [filteredSlots, selectedDate]);

  const isDateBeyondLastSlot = useMemo(() => {
    if (!selectedDate || !lastSlotDate) return false;
    return isAfter(startOfDay(selectedDate), startOfDay(new Date(lastSlotDate)));
  }, [selectedDate, lastSlotDate]);

  const handleBooking = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const response = await fetch("/api/booking", {
        method: "POST",
        headers,
        body: JSON.stringify({
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          lessonType,
          options: [],
          memo,
        }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("予約が完了しました！");
        setTimeout(() => router.push("/mypage"), 1500);
      } else {
        showToast("エラー: " + data.error, false);
      }
    } catch {
      showToast("通信エラーが発生しました。", false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLessonTypeChange = (type: "man-to-man" | "group") => {
    setLessonType(type);
    setSelectedSlot(null);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">LINE認証中です...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3 p-8">
        <p className="text-2xl">⚠️</p>
        <p className="font-bold text-gray-700 text-center">ログインに失敗しました</p>
        <p className="text-xs text-red-500 text-center bg-red-50 p-3 rounded-lg max-w-sm break-all">{authError}</p>
        <p className="text-sm text-gray-500 text-center mt-2">LINEアプリからアクセスしてください。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <header className="bg-brand text-white px-6 py-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold">🎯 レッスン予約</h1>
        <button onClick={() => router.back()} className="text-sm border border-white px-3 py-1 rounded">戻る</button>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <section className="mb-6">
          <h2 className="text-lg font-bold text-brand mb-3 border-b-2 border-brand pb-1">1. レッスン種別</h2>
          <div className="flex gap-4">
            <button
              onClick={() => handleLessonTypeChange("man-to-man")}
              className={`flex-1 py-3 rounded-lg font-bold border-2 transition-colors ${
                lessonType === "man-to-man" ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              マンツーマン（50分）
            </button>
            <button
              onClick={() => handleLessonTypeChange("group")}
              className={`flex-1 py-3 rounded-lg font-bold border-2 transition-colors ${
                lessonType === "group" ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              マンツーマン（25分）
            </button>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-brand mb-3 border-b-2 border-brand pb-1">2. 日にちを選ぶ</h2>
          {loading ? (
            <div className="text-center py-10 text-gray-500">カレンダーを読み込んでいます...</div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm p-3 overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 min-w-[320px]">
                {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                  <div key={day} className={`text-center text-xs font-bold py-1 ${day === "日" ? "text-red-500" : day === "土" ? "text-blue-500" : "text-gray-500"}`}>
                    {day}
                  </div>
                ))}
                {Array.from({ length: calendarDates[0]?.getDay() || 0 }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
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

        {selectedDate && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-brand mb-3 border-b-2 border-brand pb-1">
              3. 時間を選ぶ（{format(selectedDate, "M月d日(E)", { locale: ja })}）
            </h2>

            {isDateBeyondLastSlot ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">📅</div>
                <p className="font-bold text-gray-700 mb-1">まだ日程が追加されていません</p>
                <p className="text-sm text-gray-500">日程追加まで少々お待ちください。</p>
              </div>
            ) : slotsForSelectedDate.length === 0 ? (
              <div className="bg-gray-50 border rounded-xl p-6 text-center">
                <p className="text-gray-500 text-sm">
                  {format(selectedDate, "M月d日", { locale: ja })}は
                  {lessonType === "man-to-man" ? "マンツーマン（50分）" : "マンツーマン（25分）"}レッスンの枠がありません。
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

        {selectedSlot && (
          <section className="mb-8 animate-fade-in">
            <h2 className="text-lg font-bold text-brand mb-3 border-b-2 border-brand pb-1">4. 事前ヒアリング</h2>

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

      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="max-w-2xl mx-auto flex gap-4 items-center">
            <div className="flex-1 text-sm font-bold text-gray-700">
              <div>{format(new Date(selectedSlot.startTime), "M/d(E) H:mm", { locale: ja })}</div>
              <div className="text-brand">
                {lessonType === "man-to-man" ? "マンツーマン（50分）" : "マンツーマン（25分）"}
              </div>
            </div>
            <button
              onClick={handleBooking}
              disabled={isSubmitting}
              className={`flex-1 ${isSubmitting ? "bg-gray-400" : "bg-accent hover:translate-y-[-2px]"} text-white py-3 rounded-xl font-bold shadow-md transition-all`}
            >
              {isSubmitting ? "処理中..." : "予約を確定する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
