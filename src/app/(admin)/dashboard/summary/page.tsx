"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Reservation = {
  start_time: string;
  status: "confirmed" | "completed" | "cancelled";
  lesson_type: "man-to-man" | "group";
};

type MonthlySummary = {
  month: string;
  completed: number;
  cancelled: number;
  confirmed: number;
  total: number;
};

export default function SummaryPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then(r => r.json())
      .then(data => { if (data.success) setReservations(data.reservations); })
      .finally(() => setLoading(false));
  }, []);

  const summaries: MonthlySummary[] = (() => {
    const map = new Map<string, MonthlySummary>();
    for (const r of reservations) {
      const d = new Date(r.start_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, { month: key, completed: 0, cancelled: 0, confirmed: 0, total: 0 });
      }
      const s = map.get(key)!;
      s.total++;
      if (r.status === "completed") s.completed++;
      else if (r.status === "cancelled") s.cancelled++;
      else if (r.status === "confirmed") s.confirmed++;
    }
    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
  })();

  const totalCompleted = summaries.reduce((sum, s) => sum + s.completed, 0);
  const totalCancelled = summaries.reduce((sum, s) => sum + s.cancelled, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
          <h1 className="text-xl font-bold">月次サマリー</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4 mt-4">
        {loading ? (
          <p className="text-center text-gray-500 py-8">読み込み中...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
                <p className="text-3xl font-black text-green-600">{totalCompleted}</p>
                <p className="text-sm text-gray-500 mt-1">累計受講回数</p>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
                <p className="text-3xl font-black text-red-500">{totalCancelled}</p>
                <p className="text-sm text-gray-500 mt-1">累計キャンセル数</p>
              </div>
            </div>

            {summaries.length === 0 ? (
              <p className="text-center text-gray-500 py-8 bg-white rounded-xl border">データがありません。</p>
            ) : (
              <div className="space-y-3">
                {summaries.map(s => {
                  const [year, month] = s.month.split("-");
                  const absenceRate = s.total > 0 ? Math.round((s.cancelled / s.total) * 100) : 0;
                  return (
                    <div key={s.month} className="bg-white rounded-xl border shadow-sm p-4">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-black text-gray-800 text-lg">{year}年{parseInt(month)}月</p>
                        <span className="text-sm text-gray-400">{s.total}件</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-xl font-black text-green-600">{s.completed}</p>
                          <p className="text-xs text-gray-500">受講完了</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                          <p className="text-xl font-black text-red-500">{s.cancelled}</p>
                          <p className="text-xs text-gray-500">キャンセル</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-xl font-black text-blue-600">{s.confirmed}</p>
                          <p className="text-xs text-gray-500">予約済み</p>
                        </div>
                      </div>
                      {s.cancelled > 0 && (
                        <p className="text-xs text-gray-400 mt-2 text-right">キャンセル率 {absenceRate}%</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
