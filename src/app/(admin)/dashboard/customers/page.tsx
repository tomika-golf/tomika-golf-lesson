"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  name_kana: string | null;
  phone: string | null;
  ticket_man_to_man: number;
  ticket_group: number;
  admin_memo: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then(r => r.json())
      .then(data => {
        if (data.success) setCustomers(data.customers);
      })
      .finally(() => setLoading(false));
  }, []);

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
              <Link
                key={c.id}
                href={`/dashboard/customers/${c.id}`}
                className="block bg-white rounded-xl border shadow-sm p-4 hover:border-gray-400 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-lg text-gray-800">{c.name} 様</p>
                    {c.name_kana && <p className="text-xs text-gray-400">{c.name_kana}</p>}
                    {c.phone && <p className="text-sm text-gray-500 mt-1">📞 {c.phone}</p>}
                    {c.admin_memo && (
                      <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-2">
                        📌 {c.admin_memo}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-xs text-gray-500 mb-1">チケット残数</p>
                    <p className="text-sm">
                      <span className="font-bold text-green-700">マンツー {c.ticket_man_to_man}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="font-bold text-orange-600">グループ {c.ticket_group}</span>
                    </p>
                    <p className="text-xs text-blue-600 font-bold mt-2">カルテを見る →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
