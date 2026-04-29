"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AiSettingsPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/ai-settings').then(r => r.json()).then(d => {
      if (d.success) setPrompt(d.prompt);
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/ai-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then(r => r.json());
    if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else alert('エラー: ' + res.error);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
        <h1 className="text-xl font-bold">AIプロンプト管理</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto mt-4 space-y-4">
        {saved && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-3 text-center text-green-700 font-bold text-sm">
            ✅ 保存しました
          </div>
        )}
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <p className="text-xs text-gray-500">カルテ作成AIに送るシステムプロンプトを編集できます。変更はすぐに反映されます。</p>
          {loading ? <p className="text-gray-500 text-sm text-center py-8">読み込み中...</p> : (
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-mono h-96 resize-none focus:outline-none focus:border-gray-600"
            />
          )}
          <button onClick={save} disabled={saving || loading}
            className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl disabled:opacity-50">
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </main>
    </div>
  );
}
