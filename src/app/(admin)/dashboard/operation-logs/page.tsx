"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Log = {
  id: string;
  admin_username: string;
  action: string;
  target_id: string | null;
  detail: string | null;
  performed_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  status_changed: "ステータス変更",
  karte_published: "カルテ公開",
  karte_edited: "カルテ編集",
  karte_draft_saved: "下書き保存",
};

const ACTION_COLORS: Record<string, string> = {
  status_changed: "bg-orange-100 text-orange-700",
  karte_published: "bg-green-100 text-green-700",
  karte_edited: "bg-blue-100 text-blue-700",
  karte_draft_saved: "bg-gray-100 text-gray-600",
};

export default function OperationLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/logs")
      .then(r => r.json())
      .then(data => { if (data.success) setLogs(data.logs); })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← ダッシュボード</Link>
        <h1 className="text-xl font-bold">操作ログ</h1>
      </header>

      <main className="p-4 max-w-3xl mx-auto mt-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-400 bg-white rounded-xl p-8">操作ログがまだありません。</div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-bold">{log.admin_username}</span>
                    {log.detail && <span className="text-gray-500 ml-2">— {log.detail}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.performed_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
