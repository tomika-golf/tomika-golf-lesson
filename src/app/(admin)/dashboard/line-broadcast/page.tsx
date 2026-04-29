"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = { id: string; name: string; line_user_id: string | null };

export default function LineBroadcastPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sendAll, setSendAll] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/customers').then(r => r.json()).then(d => {
      if (d.success) setCustomers(d.customers.filter((c: Customer) => c.line_user_id));
    }).finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const send = async () => {
    if (!message.trim()) return alert('メッセージを入力してください');
    const targets = sendAll ? customers : customers.filter(c => selectedIds.includes(c.id));
    if (!confirm(`${targets.length}名にLINEを送信します。よろしいですか？`)) return;
    setSending(true);
    setResult(null);
    const res = await fetch('/api/admin/line-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userIds: sendAll ? [] : selectedIds }),
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

      <main className="p-4 max-w-xl mx-auto space-y-5 mt-4">
        {result && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
            <p className="font-bold text-green-700">✅ 送信完了</p>
            <p className="text-sm text-green-600 mt-1">{result.total}名中 {result.sent}名に送信しました</p>
          </div>
        )}

        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">メッセージ</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:border-gray-600"
              placeholder="送信するメッセージを入力..." />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">送信対象</label>
            <div className="flex gap-3">
              <button onClick={() => setSendAll(true)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 ${sendAll ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600'}`}>
                全員（{customers.length}名）
              </button>
              <button onClick={() => setSendAll(false)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 ${!sendAll ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600'}`}>
                選択した人のみ
              </button>
            </div>
          </div>

          {!sendAll && (
            <div className="border rounded-xl divide-y max-h-64 overflow-y-auto">
              {loading ? <p className="text-center text-gray-500 text-sm p-4">読み込み中...</p>
                : customers.map(c => (
                  <label key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 accent-gray-800" />
                    <span className="text-sm font-bold text-gray-800">{c.name} 様</span>
                  </label>
                ))}
            </div>
          )}

          <button onClick={send} disabled={sending || !message.trim()}
            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50">
            {sending ? '送信中...' : `📩 LINEを送信する`}
          </button>
        </div>
      </main>
    </div>
  );
}
