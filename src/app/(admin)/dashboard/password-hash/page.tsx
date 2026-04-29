"use client";

import { useState } from "react";
import Link from "next/link";
import bcrypt from "bcryptjs";

export default function PasswordHashPage() {
  const [password, setPassword] = useState("");
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateHash = async () => {
    if (!password) return;
    setLoading(true);
    const h = await bcrypt.hash(password, 10);
    setHash(h);
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
        <h1 className="text-xl font-bold">パスワードハッシュ生成</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto mt-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-bold mb-1">このページの使い方</p>
          <p>新しいパスワードを入力してハッシュ値を生成し、Vercelの環境変数（ADMIN_1_PASSWORD等）に設定することでパスワードを安全に管理できます。</p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">新しいパスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateHash()}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="設定したいパスワードを入力"
            />
          </div>

          <button
            onClick={generateHash}
            disabled={!password || loading}
            className="w-full py-2.5 bg-gray-800 text-white font-bold rounded-lg disabled:opacity-40 hover:bg-gray-700 transition"
          >
            {loading ? "生成中..." : "ハッシュを生成"}
          </button>

          {hash && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">生成されたハッシュ値</label>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs break-all text-gray-700 border">
                  {hash}
                </div>
              </div>
              <button
                onClick={copyToClipboard}
                className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition"
              >
                {copied ? "✅ コピーしました" : "📋 クリップボードにコピー"}
              </button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs text-yellow-900 space-y-2">
                <p className="font-bold">Vercelへの設定手順</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>上のハッシュ値をコピー</li>
                  <li>Vercelダッシュボード → Settings → Environment Variables を開く</li>
                  <li>ADMIN_1_PASSWORD（または2・3）の値をハッシュ値に書き換え</li>
                  <li>Redeploy して完了</li>
                </ol>
                <p className="text-yellow-700 mt-2">※ 設定後は元のパスワードでは入れなくなります。ハッシュ値はパスワードに戻せないので、パスワード自体は別途メモしてください。</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
