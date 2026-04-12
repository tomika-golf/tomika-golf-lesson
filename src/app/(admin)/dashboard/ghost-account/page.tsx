"use client";

import { useState } from "react";

export default function GhostAccountPage() {
  const [name, setName] = useState("");
  const [nameKana, setNameKana] = useState("");
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/ghost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nameKana, phone, memo }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("✅ ゴーストアカウントを作成しました！");
        setName("");
        setNameKana("");
        setPhone("");
        setMemo("");
      } else {
        setMessage(`❌ エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ 通信エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-brand mb-6 border-b-2 border-brand pb-2">
        👻 ゴーストアカウント（代理）作成
      </h1>
      <p className="text-gray-600 mb-6 text-sm">
        LINEをご利用にならないお客様の代わりに、管理者が代理で予約を取るための専用アカウントを作成します。
      </p>

      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.includes("❌") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">お名前（必須）</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-3 rounded-md focus:ring-brand focus:border-brand"
            placeholder="例：山田 太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">フリガナ</label>
          <input
            type="text"
            value={nameKana}
            onChange={(e) => setNameKana(e.target.value)}
            className="w-full border p-3 rounded-md focus:ring-brand focus:border-brand"
            placeholder="例：ヤマダ タロウ"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">電話番号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border p-3 rounded-md focus:ring-brand focus:border-brand"
            placeholder="例：090-1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">管理者メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full border p-3 rounded-md focus:ring-brand focus:border-brand"
            rows={3}
            placeholder="右打ち・初心者など特記事項があれば"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${
            isSubmitting ? "bg-gray-400" : "bg-brand hover:bg-green-800"
          }`}
        >
          {isSubmitting ? "作成中..." : "アカウントを作成する"}
        </button>
      </form>
    </div>
  );
}
