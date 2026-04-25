"use client";

import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { isReady, accessToken } = useAuthContext();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("2文字以上のお名前を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const res = await fetch("/api/user/name", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        // フルリロードして認証状態をリセット（needsRegistrationをクリア）
        window.location.href = "/mypage";
      } else {
        setError(data.error || "エラーが発生しました");
        setIsSubmitting(false);
      }
    } catch {
      setError("通信エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-4xl mb-3">⛳</p>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">ようこそ！</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            はじめに、ご本名を教えてください。<br />
            レッスンの予約管理に使用します。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              お名前（本名）
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="例：山田 太郎"
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-base outline-none focus:border-green-500 transition-colors"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || name.trim().length < 2}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
              isSubmitting || name.trim().length < 2
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "登録中..." : "登録する"}
          </button>
        </form>
      </div>
    </div>
  );
}
