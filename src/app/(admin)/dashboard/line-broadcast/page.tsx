"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = { id: string; name: string; line_user_id: string };
type Filter = 'all' | 'has_lesson' | 'last_month';

const FILTER_OPTIONS: { value: Filter; label: string; description: string }[] = [
  { value: 'all', label: '全員', description: 'LINEを連携済みの全登録者' },
  { value: 'has_lesson', label: 'レッスン経験あり', description: '1回以上レッスンを受けた方' },
  { value: 'last_month', label: '直近1ヶ月', description: '直近30日以内にレッスンを受けた方' },
];

export default function LineBroadcastPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sendAll, setSendAll] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setSelectedIds([]);
    setResult(null);
    fetch(`/api/admin/line-broadcast-targets?filter=${filter}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCustomers(d.customers); })
      .finally(() => setLoading(false));
  }, [filter]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const targets = sendAll ? customers : customers.filter(c => selectedIds.includes(c.id));

  const send = async () => {
    if (!message.trim()) return alert('メッセージを入力してください');
    if (targets.length === 0) return alert('送信対象が選択されていません');
    if (!confirm(`${targets.length}名にLINEを送信します。よろしいですか？`)) return;
    setSending(true);
    setResult(null);
    const res = await fetch('/api/admin/line-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userIds: targets.map(c => c.id) }),
    }).then(r => r.json());
    if (res.success) setResult({ sent: res.sent, total: res.total });
    else alert('エラー: ' + res.error);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
        <h1 className="text-xl font-bold">LINE一斉送信</h1>
      </header>

      <main className="p-4 max-w-xl mx-auto space-y-4 mt-4">
        {result && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
            <p className="font-bold text-green-700">✅ 送信完了</p>
            <p className="text-sm text-green-600 mt-1">{result.total}名中 {result.sent}名に送信しました</p>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <p className="text-xs font-bold text-gray-500">送信対象グループ</p>
          <div className="grid grid-cols-3 gap-2">
            {FILTER_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setFilter(opt.value)}
                className={`py-2 px-1 rounded-xl font-bold text-xs border-2 ${filter === opt.value ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">{FILTER_OPTIONS.find(o => o.value === filter)?.description}</p>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            {loading
              ? <p className="text-sm text-gray-500">読み込み中...</p>
              : <p className="text-sm font-bold text-blue-700">対象者: <span className="text-xl">{customers.length}</span> 名</p>
            }
          </div>
        </div>

        {/* Message & Targets */}
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">メッセージ</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:border-gray-600"
              placeholder="送信するメッセージを入力..." />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">送信範囲</label>
            <div className="flex gap-3">
              <button onClick={() => setSendAll(true)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 ${sendAll ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600'}`}>
                全員（{customers.length}名）
              </button>
              <button onClick={() => { setSendAll(false); setSelectedIds([]); }}
                className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 ${!sendAll ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600'}`}>
                個別選択
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500">
                {sendAll ? '送信予定者一覧' : `選択中: ${selectedIds.length}名`}
              </label>
              {!sendAll && (
                <div className="flex gap-3">
                  <button onClick={() => setSelectedIds(customers.map(c => c.id))} className="text-xs text-blue-600 hover:underline">全選択</button>
                  <button onClick={() => setSelectedIds([])} className="text-xs text-gray-400 hover:underline">クリア</button>
                </div>
              )}
            </div>
            <div className="border rounded-xl divide-y max-h-64 overflow-y-auto">
              {loading
                ? <p className="text-center text-gray-500 text-sm p-4">読み込み中...</p>
                : customers.length === 0
                  ? <p className="text-center text-gray-400 text-sm p-4">対象者がいません</p>
                  : customers.map(c => (
                    <label key={c.id}
                      className={`flex items-center gap-3 px-4 py-3 ${!sendAll ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
                      {!sendAll
                        ? <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)}
                            className="w-4 h-4 accent-gray-800 flex-shrink-0" />
                        : <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                      }
                      <span className="text-sm font-bold text-gray-800">{c.name} 様</span>
                    </label>
                  ))
              }
            </div>
          </div>

          <button onClick={send} disabled={sending || !message.trim() || targets.length === 0}
            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50 text-sm">
            {sending ? '送信中...' : `📩 ${targets.length}名にLINEを送信する`}
          </button>
        </div>
      </main>
    </div>
  );
}
