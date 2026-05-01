"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AiSettingsPage() {
  const [prompt, setPrompt] = useState('');
  const [customerPrompt, setCustomerPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingKarte, setSavingKarte] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savedKarte, setSavedKarte] = useState(false);
  const [savedCustomer, setSavedCustomer] = useState(false);

  useEffect(() => {
    fetch('/api/admin/ai-settings').then(r => r.json()).then(d => {
      if (d.success) {
        setPrompt(d.prompt);
        setCustomerPrompt(d.customerPrompt);
      }
    }).finally(() => setLoading(false));
  }, []);

  const saveKarte = async () => {
    setSavingKarte(true);
    const res = await fetch('/api/admin/ai-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then(r => r.json());
    if (res.success) { setSavedKarte(true); setTimeout(() => setSavedKarte(false), 3000); }
    else alert('エラー: ' + res.error);
    setSavingKarte(false);
  };

  const saveCustomer = async () => {
    setSavingCustomer(true);
    const res = await fetch('/api/admin/ai-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerPrompt }),
    }).then(r => r.json());
    if (res.success) { setSavedCustomer(true); setTimeout(() => setSavedCustomer(false), 3000); }
    else alert('エラー: ' + res.error);
    setSavingCustomer(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
        <h1 className="text-xl font-bold">AIプロンプト管理</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto mt-4 space-y-6">
        {/* カルテ作成AI */}
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📋</span>
            <h2 className="font-bold text-gray-800">カルテ作成AI（管理者用）</h2>
          </div>
          <p className="text-xs text-gray-500">レッスン後のカルテを自動生成するAIのプロンプトです。</p>
          {savedKarte && (
            <div className="bg-green-50 border border-green-300 rounded-xl p-3 text-center text-green-700 font-bold text-sm">
              ✅ 保存しました
            </div>
          )}
          {loading ? <p className="text-gray-500 text-sm text-center py-8">読み込み中...</p> : (
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-mono h-72 resize-none focus:outline-none focus:border-gray-600"
            />
          )}
          <button onClick={saveKarte} disabled={savingKarte || loading}
            className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl disabled:opacity-50">
            {savingKarte ? '保存中...' : '保存する'}
          </button>
        </div>

        {/* 顧客AIアシスタント */}
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🤖</span>
            <h2 className="font-bold text-gray-800">お客様AIアシスタント（顧客用）</h2>
          </div>
          <p className="text-xs text-gray-500">お客様がLINEアプリ内で使うAIアシスタントのプロンプトです。空欄の場合はデフォルトが使われます。</p>
          {savedCustomer && (
            <div className="bg-green-50 border border-green-300 rounded-xl p-3 text-center text-green-700 font-bold text-sm">
              ✅ 保存しました
            </div>
          )}
          {loading ? <p className="text-gray-500 text-sm text-center py-8">読み込み中...</p> : (
            <textarea
              value={customerPrompt}
              onChange={e => setCustomerPrompt(e.target.value)}
              placeholder="空欄の場合はデフォルトのプロンプトが使われます"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-mono h-72 resize-none focus:outline-none focus:border-gray-600"
            />
          )}
          <button onClick={saveCustomer} disabled={savingCustomer || loading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">
            {savingCustomer ? '保存中...' : '保存する'}
          </button>
        </div>
      </main>
    </div>
  );
}
