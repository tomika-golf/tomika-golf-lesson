"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

export default function CouponPage() {
  const router = useRouter();
  const { isReady, accessToken } = useAuthContext();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "already" | "invalid" | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers,
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult("success");
        setTimeout(() => router.push("/mypage"), 2000);
      } else if (data.alreadyAssigned) {
        setResult("already");
        setTimeout(() => router.push("/mypage"), 2000);
      } else {
        setResult("invalid");
        setError(data.error || "コードが正しくありません");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/mypage");
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
          <p className="text-4xl mb-3">🏷️</p>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">クーポンコード</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            コーチから受け取ったコードを入力すると、<br />
            特別メニューが利用できるようになります。
          </p>
        </div>

        {result === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4">
            <p className="text-green-700 font-bold">✅ 登録完了！</p>
            <p className="text-sm text-green-600 mt-1">特別メニューが利用可能になりました。</p>
          </div>
        )}

        {result === "already" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center mb-4">
            <p className="text-blue-700 font-bold">すでに登録済みです</p>
            <p className="text-sm text-blue-600 mt-1">マイページへ移動します...</p>
          </div>
        )}

        {result !== "success" && result !== "already" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                コードを入力
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setResult(null); setError(""); }}
                placeholder="例：103"
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-base outline-none focus:border-green-500 transition-colors"
                autoComplete="off"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                isSubmitting || !code.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isSubmitting ? "確認中..." : "登録する"}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-3 rounded-xl font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
            >
              スキップ（後で登録）
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
