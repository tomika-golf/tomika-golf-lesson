"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  name: string;
  name_kana: string | null;
  ticket_man_to_man: number;
  ticket_group: number;
};

type Slot = {
  startTime: string;
  endTime: string;
  lessonType: "man-to-man" | "group";
  isBlockedByTimeToStart: boolean;
};

export default function AdminBookingPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [lessonType, setLessonType] = useState<"man-to-man" | "group">("man-to-man");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/customers").then(r => r.json()),
      fetch("/api/calendar/slots").then(r => r.json()),
    ]).then(([cData, sData]) => {
      if (cData.success) setCustomers(cData.customers);
      if (sData.success) setSlots(sData.slots);
    }).finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name?.toLowerCase().includes(q) || c.name_kana?.toLowerCase().includes(q);
  });

  const availableSlots = slots.filter(s => {
    if (s.isBlockedByTimeToStart) return false;
    if (s.lessonType !== lessonType) return false;
    if (filterDate) {
      const slotDate = new Date(s.startTime).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
      if (!slotDate.includes(filterDate)) return false;
    }
    return true;
  });

  // 日付ごとにグループ化
  const slotsByDate: Record<string, Slot[]> = {};
  for (const slot of availableSlots) {
    const d = new Date(slot.startTime);
    const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    if (!slotsByDate[key]) slotsByDate[key] = [];
    slotsByDate[key].push(slot);
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedSlot) return;
    if (!window.confirm(`${selectedCustomer.name} 様\n${new Date(selectedSlot.startTime).toLocaleDateString()} ${formatTime(selectedSlot.startTime)}\n${lessonType === "man-to-man" ? "マンツーマン（50分）" : "マンツーマン（25分）"}\n\nこの内容で予約を入れますか？`)) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedCustomer.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          lessonType,
          memo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${selectedCustomer.name} 様の予約を登録しました。`);
        router.push("/dashboard");
      } else {
        alert("エラー: " + data.error);
      }
    } catch {
      alert("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
          <h1 className="text-xl font-bold">代理予約</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-6 mt-4">

        {/* STEP 1: お客さんを選ぶ */}
        <section className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">1</span>
            お客さんを選ぶ
          </h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="名前で検索..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mb-3 focus:outline-none focus:border-gray-600 text-sm"
          />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${selectedCustomer?.id === c.id ? "border-gray-800 bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}
              >
                <span className="font-bold text-gray-800">{c.name}</span>
                {c.name_kana && <span className="text-xs text-gray-400 ml-2">{c.name_kana}</span>}
                <span className="float-right text-xs text-gray-500">
                  50分 {c.ticket_man_to_man}枚 / 25分 {c.ticket_group}枚
                </span>
              </button>
            ))}
          </div>
          {selectedCustomer && (
            <p className="mt-3 text-sm font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              ✅ {selectedCustomer.name} 様を選択中
            </p>
          )}
        </section>

        {/* STEP 2: レッスン種別 */}
        <section className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">2</span>
            レッスン種別を選ぶ
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => { setLessonType("man-to-man"); setSelectedSlot(null); }}
              className={`flex-1 py-3 rounded-xl font-bold border-2 transition ${lessonType === "man-to-man" ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
            >
              マンツーマン（50分）
            </button>
            <button
              onClick={() => { setLessonType("group"); setSelectedSlot(null); }}
              className={`flex-1 py-3 rounded-xl font-bold border-2 transition ${lessonType === "group" ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
            >
              マンツーマン（25分）
            </button>
          </div>
        </section>

        {/* STEP 3: 日時を選ぶ */}
        <section className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">3</span>
            日時を選ぶ
          </h2>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-2 mb-4 focus:outline-none focus:border-gray-600 text-sm"
          />
          {Object.keys(slotsByDate).length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">選択可能な枠がありません。</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                <div key={date}>
                  <p className="text-sm font-bold text-gray-500 mb-2">{date}</p>
                  <div className="flex flex-wrap gap-2">
                    {dateSlots.map(slot => (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${selectedSlot?.startTime === slot.startTime ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-700 hover:border-gray-500"}`}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedSlot && (
            <p className="mt-3 text-sm font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              ✅ {new Date(selectedSlot.startTime).toLocaleDateString()} {formatTime(selectedSlot.startTime)} を選択中
            </p>
          )}
        </section>

        {/* STEP 4: メモ（任意） */}
        <section className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">4</span>
            メモ（任意）
          </h2>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            rows={2}
            placeholder="管理者メモ（お客様には表示されません）"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-600"
          />
        </section>

        {/* 確定ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!selectedCustomer || !selectedSlot || submitting}
          className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl shadow-lg hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "登録中..." : "予約を確定する"}
        </button>
      </main>
    </div>
  );
}
