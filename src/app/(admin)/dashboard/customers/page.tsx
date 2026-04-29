"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  name_kana: string | null;
  phone: string | null;
  admin_memo: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingMemo, setEditingMemo] = useState<{ id: string; value: string } | null>(null);
  const [savingMemo, setSavingMemo] = useState(false);

  const fetchCustomers = () => {
    fetch("/api/admin/customers")
      .then(r => r.json())
      .then(data => { if (data.success) setCustomers(data.customers); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const saveMemo = async (customerId: string, memo: string) => {
    setSavingMemo(true);
    try {
      await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_memo: memo }),
      });
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, admin_memo: memo || null } : c));
      setEditingMemo(null);
    } finally {
      setSavingMemo(false);
    }
  };

  const filtered = customers.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.name_kana?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
          <h1 className="text-xl font-bold">カルテ管理</h1>
        </div>
        <span className="text-sm text-gray-400">{customers.length}名</span>
      </header>

      {/* #9: メモ編集モーダル */}
      {editingMemo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <p className="font-bold text-gray-800">管理メモを編集</p>
            <textarea
              value={editingMemo.value}
              onChange={e => setEditingMemo({ ...editingMemo, value: e.target.value })}
              className="w-full border rounded-xl px-3 py-2 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="メモを入力..."
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingMemo(null)} className="flex-1 py-2 border-2 border-gray-300 rounded-xl font-bold text-gray-600 text-sm">キャンセル</button>
              <button
                onClick={() => saveMemo(editingMemo.id, editingMemo.value)}
                disabled={savingMemo}
                className="flex-1 py-2 bg-gray-800 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {savingMemo ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="p-4 max-w-3xl mx-auto space-y-4 mt-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="名前・フリガナ・電話番号で検索..."
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-gray-600 bg-white shadow-sm"
        />

        {loading ? (
          <p className="text-center text-gray-500 py-8">読み込み中...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8 bg-white rounded-xl border">
            {search ? "検索結果がありません。" : "お客様データがありません。"}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-white rounded-xl border shadow-sm p-4 hover:border-gray-300 transition">
                <div className="flex justify-between items-start gap-2">
                  <Link href={`/dashboard/customers/${c.id}`} className="flex-1 min-w-0">
                    <p className="font-black text-lg text-gray-800">{c.name} 様</p>
                    {c.name_kana && <p className="text-xs text-gray-400">{c.name_kana}</p>}
                    {c.phone && <p className="text-sm text-gray-500 mt-1">📞 {c.phone}</p>}
                    {c.admin_memo && (
                      <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-2 line-clamp-1">
                        📌 {c.admin_memo}
                      </p>
                    )}
                  </Link>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Link href={`/dashboard/customers/${c.id}`} className="text-xs text-blue-600 font-bold">カルテを見る →</Link>
                    {/* #9: メモ編集ボタン */}
                    <button
                      onClick={() => setEditingMemo({ id: c.id, value: c.admin_memo ?? "" })}
                      className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
                    >
                      ✏️ メモ編集
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
