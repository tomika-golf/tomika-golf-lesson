"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BlockedDate = { id: string; date: string; reason: string | null };

export default function BlockedDatesPage() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch_ = () =>
    fetch('/api/admin/blocked-dates').then(r => r.json()).then(d => {
      if (d.success) setBlockedDates(d.blockedDates);
    }).finally(() => setLoading(false));

  useEffect(() => { fetch_(); }, []);

  const add = async () => {
    if (!date) return alert('日付を選択してください');
    setSaving(true);
    const res = await fetch('/api/admin/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, reason }),
    }).then(r => r.json());
    if (res.success) { setDate(''); setReason(''); fetch_(); }
    else alert('エラー: ' + res.error);
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('この休業日を削除しますか？')) return;
    await fetch('/api/admin/blocked-dates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetch_();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
          <h1 className="text-xl font-bold">休業日・不在日の設定</h1>
        </div>
      </header>

      <main className="p-4 max-w-xl mx-auto space-y-6 mt-4">
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-700">休業日を追加</h2>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">日付</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-600" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">理由（任意）</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="例：出張、法事など"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-600" />
          </div>
          <button onClick={add} disabled={saving}
            className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl disabled:opacity-50">
            {saving ? '追加中...' : '追加する'}
          </button>
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-gray-700">設定中の休業日</h2>
          {loading ? <p className="text-gray-500 text-sm text-center py-4">読み込み中...</p>
            : blockedDates.length === 0 ? <p className="text-gray-500 text-sm bg-white p-4 rounded-xl border text-center">設定されている休業日はありません</p>
            : blockedDates.map(b => (
              <div key={b.id} className="bg-white rounded-xl border shadow-sm p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{new Date(b.date + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {b.reason && <p className="text-sm text-gray-500 mt-0.5">{b.reason}</p>}
                </div>
                <button onClick={() => remove(b.id)} className="text-red-500 text-sm font-bold hover:text-red-700">削除</button>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
