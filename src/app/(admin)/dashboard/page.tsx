"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AdminReservation = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  lesson_type: "man-to-man" | "group";
  status: "confirmed" | "completed" | "cancelled";
  options: string[];
  customer_memo: string;
  profiles: { name: string; phone: string };
  review_notes: { id: string; is_draft: boolean }[] | null;
};

type PendingKarte = {
  id: string;
  start_time: string;
  lesson_type: "man-to-man" | "group";
  has_draft: boolean;
  profiles: { name: string };
};

function getAdminRole(): string {
  if (typeof document === 'undefined') return 'full';
  const match = document.cookie.match(/admin_role=([^;]+)/);
  return match?.[1] ?? 'full';
}

type LateRequest = {
  id: string;
  user_id: string;
  start_time: string;
  lesson_type: 'man-to-man' | 'group';
  profiles: { name: string };
};

type LineTarget = {
  reservationId: string;
  customerName: string;
  startTime: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [pendingKartes, setPendingKartes] = useState<PendingKarte[]>([]);
  const [oldUnprocessed, setOldUnprocessed] = useState<AdminReservation[]>([]);
  const [lateRequests, setLateRequests] = useState<LateRequest[]>([]);
  const [lateActionLoading, setLateActionLoading] = useState<string | null>(null);
  const [lateLineTarget, setLateLineTarget] = useState<LateRequest | null>(null);
  const [lateLineMessage, setLateLineMessage] = useState('');
  const [lateLineSending, setLateLineSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOld, setLoadingOld] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [adminRole, setAdminRole] = useState('full');
  const [lineTarget, setLineTarget] = useState<LineTarget | null>(null);
  const [lineMessage, setLineMessage] = useState('');
  const [lineSending, setLineSending] = useState(false);
  const [lineToast, setLineToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [calendarFilter, setCalendarFilter] = useState('');

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dashboard/login");
  };

  const fetchReservations = async () => {
    try {
      const [resData, pendingData, lateData] = await Promise.all([
        fetch("/api/admin/reservations").then(r => r.json()),
        fetch("/api/admin/karte/pending").then(r => r.json()),
        fetch("/api/admin/late-requests").then(r => r.json()),
      ]);
      if (resData.success) setReservations(resData.reservations);
      if (pendingData.success) setPendingKartes(pendingData.pending);
      if (lateData.success) setLateRequests(lateData.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLateAction = async (id: string, action: 'book' | 'reject') => {
    const req = lateRequests.find(r => r.id === id);
    if (!req) return;
    const label = action === 'book' ? '予約を確定してLINEで通知します' : '予約不可のLINEを送ります';
    if (!window.confirm(`${(req.profiles as any)?.name} 様\n${label}\nよろしいですか？`)) return;
    setLateActionLoading(id + action);
    try {
      const res = await fetch(`/api/admin/late-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setLateRequests(prev => prev.filter(r => r.id !== id));
        if (action === 'book') fetchReservations();
        showLineToast(action === 'book' ? '予約を確定し、LINEで通知しました' : '予約不可のLINEを送りました');
      } else {
        alert('エラー: ' + data.error);
      }
    } catch {
      alert('通信エラーが発生しました。');
    } finally {
      setLateActionLoading(null);
    }
  };

  const sendLateLineMessage = async () => {
    if (!lateLineTarget || !lateLineMessage.trim()) return;
    setLateLineSending(true);
    try {
      const res = await fetch('/api/admin/line-user-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: lateLineTarget.user_id, message: lateLineMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setLateLineTarget(null);
        setLateLineMessage('');
        showLineToast('LINEを送信しました');
      } else {
        showLineToast(data.error || '送信失敗', false);
      }
    } catch {
      showLineToast('通信エラー', false);
    } finally {
      setLateLineSending(false);
    }
  };

  // #8: 過去の未処理予約を検索
  const fetchOldUnprocessed = async () => {
    setLoadingOld(true);
    try {
      const data = await fetch("/api/admin/reservations?includeOld=true").then(r => r.json());
      if (data.success) setOldUnprocessed(data.reservations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOld(false);
      setShowOld(true);
    }
  };

  useEffect(() => {
    setAdminRole(getAdminRole());
    fetchReservations();
  }, []);

  const handleComplete = async (res: AdminReservation) => {
    if (!window.confirm(`${res.profiles?.name} 様のレッスンを完了とし、カルテ作成ページへ移動します。よろしいですか？`)) return;
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: res.id, status: "completed" }),
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/dashboard/reservations/${res.id}/karte`);
      } else {
        alert("エラー: " + data.error);
      }
    } catch {
      alert("通信エラーが発生しました。");
    }
  };

  const showLineToast = (msg: string, ok = true) => {
    setLineToast({ msg, ok });
    setTimeout(() => setLineToast(null), 3000);
  };

  const openLineModal = (r: AdminReservation) => {
    const d = new Date(r.start_time);
    const dateStr = d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
    const timeStr = `${d.getHours()}:00`;
    setLineTarget({ reservationId: r.id, customerName: r.profiles?.name || 'お客様', startTime: `${dateStr} ${timeStr}` });
    setLineMessage('');
  };

  const sendLineMessage = async () => {
    if (!lineTarget || !lineMessage.trim()) return;
    setLineSending(true);
    try {
      const res = await fetch('/api/admin/line-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: lineTarget.reservationId, message: lineMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setLineTarget(null);
        showLineToast('LINEを送信しました');
      } else {
        showLineToast(data.error || '送信に失敗しました', false);
      }
    } catch {
      showLineToast('通信エラーが発生しました', false);
    } finally {
      setLineSending(false);
    }
  };

  const handleAbsent = async (res: AdminReservation) => {
    if (!window.confirm(`${res.profiles?.name} 様を欠席・無断キャンセルとして処理します。よろしいですか？`)) return;
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: res.id, status: "cancelled" }),
      });
      const data = await response.json();
      if (data.success) {
        fetchReservations();
        setOldUnprocessed(prev => prev.filter(r => r.id !== res.id));
      } else {
        alert("エラー: " + data.error);
      }
    } catch {
      alert("通信エラーが発生しました。");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {lineToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm ${lineToast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {lineToast.msg}
        </div>
      )}

      {/* 直前リクエスト LINEモーダル */}
      {lateLineTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <p className="font-black text-gray-800 text-lg">📩 LINEを送る</p>
            <p className="text-sm text-gray-500">{(lateLineTarget.profiles as any)?.name} 様</p>
            <textarea
              value={lateLineMessage}
              onChange={e => setLateLineMessage(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="メッセージを入力..."
            />
            <div className="flex gap-3">
              <button onClick={() => { setLateLineTarget(null); setLateLineMessage(''); }} className="flex-1 py-2 border-2 border-gray-300 rounded-xl font-bold text-gray-600 text-sm">キャンセル</button>
              <button onClick={sendLateLineMessage} disabled={lateLineSending || !lateLineMessage.trim()} className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                {lateLineSending ? '送信中...' : '送信する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lineTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div>
              <p className="font-black text-gray-800 text-lg">📩 LINEを送る</p>
              <p className="text-sm text-gray-500 mt-1">{lineTarget.customerName} 様 / {lineTarget.startTime}</p>
            </div>
            <textarea
              value={lineMessage}
              onChange={e => setLineMessage(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="メッセージを入力..."
            />
            <div className="flex gap-3">
              <button onClick={() => setLineTarget(null)} className="flex-1 py-2 border-2 border-gray-300 rounded-xl font-bold text-gray-600 text-sm">キャンセル</button>
              <button
                onClick={sendLineMessage}
                disabled={lineSending || !lineMessage.trim()}
                className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {lineSending ? '送信中...' : '送信する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gray-800 text-white px-6 py-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold">管理者ダッシュボード</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/dashboard/customers" className="bg-blue-600 px-3 py-2 rounded shadow">📋 カルテ管理</Link>
          <Link href="/dashboard/ghost-account" className="bg-gray-600 px-3 py-2 rounded">👻 ゴースト作成</Link>
          <Link href="/dashboard/booking" className="bg-brand px-3 py-2 rounded shadow">📅 代理予約</Link>
          <Link href="/dashboard/operation-logs" className="bg-gray-500 px-3 py-2 rounded">🗒️ 操作ログ</Link>
          <Link href="/dashboard/summary" className="bg-indigo-600 px-3 py-2 rounded shadow">📊 月次サマリー</Link>
          <Link href="/dashboard/blocked-dates" className="bg-gray-600 px-3 py-2 rounded">🚫 休業日</Link>
          <Link href="/dashboard/line-broadcast" className="bg-green-700 px-3 py-2 rounded shadow">📢 LINE一斉送信</Link>
          <Link href="/dashboard/ai-settings" className="bg-purple-700 px-3 py-2 rounded">🤖 AIプロンプト</Link>
          <button onClick={handleLogout} className="bg-red-700 px-3 py-2 rounded">ログアウト</button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6 mt-4">

        {/* ⚡ 直前予約リクエスト */}
        {lateRequests.length > 0 && adminRole !== 'staff' && (
          <section>
            <h2 className="text-xl font-bold text-purple-700 mb-4 border-b-2 border-purple-300 pb-2 flex items-center gap-2">
              ⚡ 直前予約リクエスト <span className="text-sm bg-purple-600 text-white px-2 py-0.5 rounded-full">{lateRequests.length}件</span>
            </h2>
            <div className="space-y-3">
              {lateRequests.map(req => {
                const d = new Date(req.start_time);
                const dateStr = d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
                const timeStr = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                const lessonLabel = req.lesson_type === 'man-to-man' ? 'マンツーマン（50分）' : 'マンツーマン（25分）';
                return (
                  <div key={req.id} className="bg-purple-50 p-5 rounded-xl shadow-sm border-l-4 border-purple-400">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-1 rounded bg-purple-100 text-purple-700">{lessonLabel}</span>
                          <span className="text-gray-600 text-sm font-bold">{dateStr} {timeStr}</span>
                        </div>
                        <h3 className="font-black text-xl text-gray-800 mt-1">{(req.profiles as any)?.name ?? '名称未設定'} 様</h3>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <button
                          onClick={() => handleLateAction(req.id, 'book')}
                          disabled={lateActionLoading !== null}
                          className="w-full py-2.5 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition text-sm disabled:opacity-50"
                        >
                          ✅ 予約する（LINE通知）
                        </button>
                        <button
                          onClick={() => handleLateAction(req.id, 'reject')}
                          disabled={lateActionLoading !== null}
                          className="w-full py-2 bg-red-100 text-red-700 font-bold rounded-lg text-sm hover:bg-red-200 transition disabled:opacity-50"
                        >
                          ❌ 予約不可（定型文LINE）
                        </button>
                        <button
                          onClick={() => { setLateLineTarget(req); setLateLineMessage(''); }}
                          className="w-full py-2 bg-green-100 text-green-700 font-bold rounded-lg text-sm hover:bg-green-200 transition"
                        >
                          📩 LINEで連絡
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ① 対応待ち：時間が過ぎたのにまだ「確定」のままの予約 */}
        {(() => {
          const now = new Date();
          const unhandled = reservations.filter(
            r => r.status === 'confirmed' && new Date(r.end_time) < now
          );
          if (unhandled.length === 0) return null;
          return (
            <section>
              <h2 className="text-xl font-bold text-orange-700 mb-4 border-b-2 border-orange-300 pb-2 flex items-center gap-2">
                ⚠️ 対応待ち <span className="text-sm bg-orange-500 text-white px-2 py-0.5 rounded-full">{unhandled.length}件</span>
              </h2>
              <div className="space-y-3">
                {unhandled.map(r => (
                  <div key={r.id} className="bg-orange-50 p-5 rounded-xl shadow-sm border-l-4 border-orange-400">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${r.lesson_type === 'man-to-man' ? 'bg-green-100 text-brand' : 'bg-orange-100 text-accent'}`}>
                            {r.lesson_type === 'man-to-man' ? 'マンツーマン' : 'グループ'}
                          </span>
                          <span className="text-gray-600 text-sm font-bold">
                            {new Date(r.start_time).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })} {new Date(r.start_time).getHours()}:00
                          </span>
                        </div>
                        <h3 className="font-black text-xl text-gray-800 mt-1">{r.profiles?.name || '名称未設定'} 様</h3>
                        {r.profiles?.phone && <p className="text-sm text-gray-500 mt-1">📞 {r.profiles.phone}</p>}
                      </div>
                      {adminRole !== 'staff' ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <button
                            onClick={() => handleComplete(r)}
                            className="w-full py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition"
                          >
                            ✅ 受講した → カルテ作成へ
                          </button>
                          <button
                            onClick={() => handleAbsent(r)}
                            className="w-full py-2 bg-gray-200 text-gray-600 font-bold rounded-lg text-sm hover:bg-gray-300 transition"
                          >
                            ❌ 欠席・無断キャンセル
                          </button>
                          <button
                            onClick={() => openLineModal(r)}
                            className="w-full py-2 bg-green-100 text-green-700 font-bold rounded-lg text-sm hover:bg-green-200 transition"
                          >
                            📩 LINEを送る
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 self-center">確認のみ（操作権限なし）</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* #8: 過去の未処理予約を検索するボタン */}
        {adminRole !== 'staff' && (
          <div className="flex justify-end">
            <button
              onClick={fetchOldUnprocessed}
              disabled={loadingOld}
              className="text-sm text-gray-500 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-40"
            >
              {loadingOld ? "検索中..." : "🔍 過去の未処理予約を検索（90日以内）"}
            </button>
          </div>
        )}

        {/* 過去の未処理一覧 */}
        {showOld && adminRole !== 'staff' && (
          <section>
            <h2 className="text-xl font-bold text-red-800 mb-4 border-b-2 border-red-300 pb-2 flex items-center gap-2">
              🕐 過去の未処理予約
              <span className="text-sm bg-red-600 text-white px-2 py-0.5 rounded-full">{oldUnprocessed.length}件</span>
            </h2>
            {oldUnprocessed.length === 0 ? (
              <p className="text-gray-500 bg-white p-4 rounded-xl text-center text-sm">過去90日以内の未処理予約はありません。</p>
            ) : (
              <div className="space-y-3">
                {oldUnprocessed.map(r => (
                  <div key={r.id} className="bg-red-50 p-4 rounded-xl shadow-sm border-l-4 border-red-400">
                    <div className="flex flex-col md:flex-row justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${r.lesson_type === 'man-to-man' ? 'bg-green-100 text-brand' : 'bg-orange-100 text-accent'}`}>
                            {r.lesson_type === 'man-to-man' ? 'マンツーマン' : 'グループ'}
                          </span>
                          <span className="text-gray-600 text-sm font-bold">
                            {new Date(r.start_time).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="font-black text-lg text-gray-800">{r.profiles?.name || '名称未設定'} 様</h3>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[180px]">
                        <button onClick={() => handleComplete(r)} className="w-full py-2 bg-green-600 text-white font-bold rounded-lg shadow text-sm hover:bg-green-700 transition">
                          ✅ 受講した → カルテ作成へ
                        </button>
                        <button onClick={() => handleAbsent(r)} className="w-full py-2 bg-gray-200 text-gray-600 font-bold rounded-lg text-xs hover:bg-gray-300 transition">
                          ❌ 欠席・無断キャンセル
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ② カルテ未作成・下書き一覧（従業員には非表示） */}
        {pendingKartes.length > 0 && adminRole !== 'staff' && (
          <section>
            <h2 className="text-xl font-bold text-red-700 mb-4 border-b-2 border-red-300 pb-2 flex items-center gap-2">
              📋 カルテ未完了 <span className="text-sm bg-red-600 text-white px-2 py-0.5 rounded-full">{pendingKartes.length}件</span>
            </h2>
            <div className="space-y-2">
              {pendingKartes.map(p => (
                <div key={p.id} className="bg-white rounded-xl border-l-4 border-red-400 shadow-sm p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{(p.profiles as any)?.name || '名称未設定'} 様</p>
                    <p className="text-sm text-gray-500">
                      {new Date(p.start_time).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                      {' '}({p.lesson_type === 'man-to-man' ? '50分' : '25分'})
                    </p>
                    {p.has_draft && <span className="text-xs text-orange-500 font-bold">📝 下書きあり</span>}
                  </div>
                  <Link
                    href={`/dashboard/reservations/${p.id}/karte`}
                    className="text-sm font-bold bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
                  >
                    {p.has_draft ? '編集・公開' : 'カルテを作成'}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ③ 今後の予約一覧 */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
            <h2 className="text-xl font-bold text-gray-800">📍 予約一覧</h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={calendarFilter}
                onChange={e => setCalendarFilter(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
              />
              {calendarFilter && (
                <button onClick={() => setCalendarFilter('')} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border rounded-lg">
                  クリア
                </button>
              )}
            </div>
          </div>
          {(() => {
            const now = new Date();
            const base = reservations.filter(
              r => r.status !== 'cancelled' && !(r.status === 'confirmed' && new Date(r.end_time) < now)
            );
            const upcoming = calendarFilter
              ? base.filter(r => new Date(r.start_time).toISOString().slice(0, 10) === calendarFilter)
              : base;
            if (upcoming.length === 0) {
              return <p className="text-gray-500 bg-white p-6 rounded text-center">{calendarFilter ? `${calendarFilter} の予約はありません。` : '現在、予定されているレッスンはありません。'}</p>;
            }
            return (
              <div className="space-y-4">
                {upcoming.map((r) => (
                  <div key={r.id} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${r.status === 'completed' ? 'border-gray-400 opacity-60' : r.lesson_type === 'man-to-man' ? 'border-brand' : 'border-accent'}`}>
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded inline-block ${r.lesson_type === 'man-to-man' ? 'bg-green-100 text-brand' : 'bg-orange-100 text-accent'}`}>
                            {r.lesson_type === 'man-to-man' ? 'マンツーマン' : 'グループ'}
                          </span>
                          <span className="text-gray-500 text-sm font-bold">
                            {new Date(r.start_time).toLocaleDateString()} {new Date(r.start_time).getHours()}:00
                          </span>
                        </div>
                        <h3 className="font-black text-xl text-gray-800 mt-2">
                          {r.profiles?.name || '名称未設定'} 様
                        </h3>
                        {r.profiles?.phone && (
                          <p className="text-sm text-gray-500 mt-1">📞 {r.profiles.phone}</p>
                        )}
                        {(r.options?.length > 0 || r.customer_memo) && (
                          <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700">
                            {r.options?.length > 0 && <p className="font-bold text-accent mb-1">オプション: {r.options.join(', ')}</p>}
                            {r.customer_memo && <p>💬 {r.customer_memo}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-end min-w-[200px] border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
                        <div className="w-full">
                          {r.status === 'confirmed' ? (
                            <div className="flex flex-col gap-2">
                              {adminRole !== 'staff' ? (
                                <>
                                  <button
                                    onClick={() => handleComplete(r)}
                                    className="w-full py-3 bg-accent text-white font-bold rounded-lg shadow hover:bg-orange-600 transition"
                                  >
                                    ✅ 受講完了
                                  </button>
                                  <Link href={`/dashboard/reservations/${r.id}/karte`} className="w-full text-center py-2 bg-gray-100 text-gray-600 font-bold rounded-lg text-sm hover:bg-gray-200 transition">
                                    📝 カルテを準備する
                                  </Link>
                                  <button
                                    onClick={() => openLineModal(r)}
                                    className="w-full py-2 bg-green-100 text-green-700 font-bold rounded-lg text-sm hover:bg-green-200 transition"
                                  >
                                    📩 LINEを送る
                                  </button>
                                </>
                              ) : (
                                <div className="w-full text-center py-2 bg-gray-50 text-gray-400 rounded-lg text-xs">
                                  確認のみ（操作権限なし）
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full flex-col flex gap-2">
                              {r.review_notes && r.review_notes.length > 0 ? (
                                <div className={`w-full text-center py-1.5 rounded-lg px-2 text-xs font-bold ${r.review_notes[0].is_draft ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'}`}>
                                  {r.review_notes[0].is_draft ? '📝 下書き保存中' : '✅ カルテ公開済'}
                                </div>
                              ) : (
                                <div className="w-full text-center py-1.5 bg-gray-100 text-gray-400 rounded-lg px-2 text-xs font-bold">
                                  📋 カルテ未作成
                                </div>
                              )}
                              {adminRole !== 'staff' && (
                                <Link href={`/dashboard/reservations/${r.id}/karte`} className="w-full text-center py-2 bg-blue-600 text-white font-bold rounded-lg px-2 text-sm shadow hover:bg-blue-700 transition">
                                  {r.review_notes && r.review_notes.length > 0 ? '📝 カルテを確認・編集' : '📝 カルテを作成'}
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      </main>
    </div>
  );
}
