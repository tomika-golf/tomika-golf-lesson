"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CouponCode = {
  id: string;
  code: string;
  description: string | null;
  created_at: string;
};

export default function CouponCodesPage() {
  const [codes, setCodes] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchCodes = () => {
    setLoading(true);
    fetch("/api/admin/coupon-codes")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCodes(data.codes || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupon-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim(), description: newDesc.trim() || null }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCode("");
        setNewDesc("");
        fetchCodes();
      } else {
        setError(data.error || "エラーが発生しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`コード「${code}」を削除しますか？\n削除後はこのコードでラベルを取得できなくなります。`)) return;
    try {
      const res = await fetch(`/api/admin/coupon-codes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCodes();
      } else {
        alert("エラー: " + data.error);
      }
    } catch {
      alert("通信エラーが発生しました");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
          <h1 className="text-xl font-bold">🏷️ クーポンコード管理</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6 mt-4">

        {/* 説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-bold mb-1">ご利用方法</p>
          <p>有効なコードをお客様にお伝えください。お客様が初回登録時にコードを入力すると、「富加町ゴルフ部」ラベルが自動的に付与されます。</p>
        </div>

        {/* 新規追加フォーム */}
        <section className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-700 mb-4">新しいコードを追加</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">コード <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => { setNewCode(e.target.value); setError(""); }}
                placeholder="例：104"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">メモ（任意）</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="例：○○イベント配布用"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={adding || !newCode.trim()}
              className="w-full bg-gray-800 text-white font-bold py-2 rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
            >
              {adding ? "追加中..." : "追加する"}
            </button>
          </form>
        </section>

        {/* コード一覧 */}
        <section className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-700 mb-4">有効なコード一覧</h2>
          {loading ? (
            <p className="text-gray-500 text-sm text-center py-4">読み込み中...</p>
          ) : codes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">登録されているコードはありません</p>
          ) : (
            <div className="space-y-2">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 bg-gray-50">
                  <div>
                    <span className="font-bold text-gray-800 text-base">{c.code}</span>
                    {c.description && (
                      <span className="ml-3 text-sm text-gray-500">{c.description}</span>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">登録日: {formatDate(c.created_at)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id, c.code)}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
