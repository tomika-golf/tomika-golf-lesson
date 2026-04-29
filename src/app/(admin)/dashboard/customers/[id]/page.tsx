"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type ReviewNote = {
  id: string;
  reservation_id: string;
  karte_good: string;
  video_url: string | null;
  is_draft: boolean;
};

type Reservation = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  lesson_type: "man-to-man" | "group";
  status: "confirmed" | "completed" | "cancelled";
  customer_memo: string | null;
  review_notes: ReviewNote[] | null;
};

type Profile = {
  id: string;
  name: string;
  name_kana: string | null;
  phone: string | null;
  admin_memo: string | null;
};

function lessonLabel(type: "man-to-man" | "group") {
  return type === "man-to-man" ? "マンツーマン（50分）" : "マンツーマン（25分）";
}

function getAdminRole(): string {
  if (typeof document === 'undefined') return 'full';
  const match = document.cookie.match(/admin_role=([^;]+)/);
  return match?.[1] ?? 'full';
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState('full');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  const fetchData = () => {
    fetch(`/api/admin/customers/${customerId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile);
          setReservations(data.reservations);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setAdminRole(getAdminRole());
    fetchData();
  }, [customerId]);

  const handleNameSave = async () => {
    if (newName.trim().length < 2) return;
    setNameLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingName(false);
        fetchData();
      } else {
        alert("エラー: " + data.error);
      }
    } catch {
      alert("通信エラーが発生しました。");
    } finally {
      setNameLoading(false);
    }
  };

  const handleComplete = async (r: Reservation) => {
    if (!window.confirm(`このレッスンを受講済みとして処理し、カルテ作成ページへ移動します。よろしいですか？`)) return;
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: r.id, status: "completed" }),
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/dashboard/reservations/${r.id}/karte`);
      } else {
        alert("エラー: " + data.error);
      }
    } catch {
      alert("通信エラーが発生しました。");
    }
  };

  const handleAbsent = async (r: Reservation) => {
    if (!window.confirm(`このレッスンを欠席・無断キャンセルとして処理します。よろしいですか？`)) return;
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: r.id, status: "cancelled" }),
      });
      const data = await response.json();
      if (data.success) fetchData();
      else alert("エラー: " + data.error);
    } catch {
      alert("通信エラーが発生しました。");
    }
  };

  // #7: ステータス修正（完了↔キャンセルの事後変更）
  const handleCorrectStatus = async (r: Reservation, newStatus: "completed" | "cancelled") => {
    const label = newStatus === "completed" ? "受講済みに修正" : "欠席・キャンセルに修正";
    const note = newStatus === "completed" ? "カルテ作成ページへ移動します。" : "受講記録は残りません。";
    if (!window.confirm(`ステータスを「${label}」に変更します。${note}\nよろしいですか？`)) return;
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: r.id, status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        if (newStatus === "completed") {
          router.push(`/dashboard/reservations/${r.id}/karte`);
        } else {
          fetchData();
        }
      } else {
        alert("エラー: " + data.error);
      }
    } catch {
      alert("通信エラーが発生しました。");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const getKarte = (r: Reservation) => r.review_notes?.[0] ?? null;

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">データが見つかりません。</div>;

  const now = new Date();
  const completed = reservations.filter(r => r.status === "completed");
  const overdue = reservations.filter(r => r.status === "confirmed" && new Date(r.end_time) < now);
  const upcoming = reservations.filter(r => r.status === "confirmed" && new Date(r.end_time) >= now);
  const cancelled = reservations.filter(r => r.status === "cancelled");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/customers" className="text-gray-400 hover:text-white text-sm">← 一覧</Link>
          <h1 className="text-xl font-bold">{profile.name} 様</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-6 mt-4">

        {/* プロフィールカード */}
        <section className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          {/* 名前編集 */}
          <div className="flex items-center justify-between gap-3">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-600"
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  disabled={nameLoading || newName.trim().length < 2}
                  className="text-sm bg-gray-800 text-white px-4 py-1.5 rounded-lg font-bold disabled:opacity-50 whitespace-nowrap"
                >
                  {nameLoading ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={() => { setEditingName(false); setNewName(''); }}
                  className="text-sm text-gray-500 px-3 py-1.5 border rounded-lg"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="font-bold text-gray-800">{profile.name}</p>
                <button
                  onClick={() => { setEditingName(true); setNewName(profile.name); }}
                  className="text-xs text-gray-500 border border-gray-300 hover:border-gray-500 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
                >
                  ✏️ 名前を修正
                </button>
              </div>
            )}
          </div>
          {profile.name_kana && <p className="text-sm text-gray-500">{profile.name_kana}</p>}
          {profile.phone && <p className="text-sm text-gray-700">📞 {profile.phone}</p>}
          {profile.admin_memo && (
            <p className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-lg p-3">
              📌 管理メモ: {profile.admin_memo}
            </p>
          )}
        </section>

        {/* 対応待ち：期日超過の未処理予約 */}
        {overdue.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-orange-700 mb-3 border-b-2 border-orange-300 pb-1 flex items-center gap-2">
              ⚠️ 対応待ち
              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{overdue.length}件</span>
            </h2>
            <div className="space-y-3">
              {overdue.map(r => (
                <div key={r.id} className="bg-orange-50 rounded-xl border-l-4 border-orange-400 shadow-sm p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded inline-block mb-1 ${r.lesson_type === "man-to-man" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                        {lessonLabel(r.lesson_type)}
                      </span>
                      <p className="font-bold text-gray-800">{formatDate(r.start_time)}</p>
                    </div>
                    {adminRole !== 'staff' ? (
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <button onClick={() => handleComplete(r)} className="w-full py-2 bg-green-600 text-white font-bold rounded-lg shadow text-sm hover:bg-green-700 transition">
                          ✅ 受講した → カルテ作成へ
                        </button>
                        <button onClick={() => handleAbsent(r)} className="w-full py-2 bg-gray-200 text-gray-600 font-bold rounded-lg text-xs hover:bg-gray-300 transition">
                          ❌ 欠席・無断キャンセル
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">確認のみ</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 予約中のレッスン */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-gray-300 pb-1">📅 予約中</h2>
            <div className="space-y-3">
              {upcoming.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded inline-block mb-1 ${r.lesson_type === "man-to-man" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                      {lessonLabel(r.lesson_type)}
                    </span>
                    <p className="font-bold text-gray-800">{formatDate(r.start_time)}</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-bold">予約中</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 受講済み（カルテ一覧）*/}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-brand pb-1">
            📝 受講済みレッスン・カルテ
          </h2>
          {completed.length === 0 ? (
            <p className="text-gray-500 text-sm bg-white p-4 rounded-xl border">受講済みのレッスンはまだありません。</p>
          ) : (
            <div className="space-y-3">
              {completed.map(r => {
                const karte = getKarte(r);
                return (
                  <div key={r.id} className={`bg-white rounded-xl border-l-4 shadow-sm p-4 ${r.lesson_type === "man-to-man" ? "border-green-600" : "border-orange-500"}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${r.lesson_type === "man-to-man" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                            {lessonLabel(r.lesson_type)}
                          </span>
                          <p className="text-sm font-bold text-gray-700">{formatDate(r.start_time)}</p>
                        </div>
                        {karte ? (
                          <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1">
                            <p className="text-xs font-bold text-gray-500">
                              📋 カルテ {karte.is_draft ? <span className="text-orange-500">（下書き）</span> : <span className="text-green-600">（公開済）</span>}
                            </p>
                            {karte.karte_good && <p className="text-xs text-gray-600 line-clamp-2"><span className="font-bold">課題：</span>{karte.karte_good}</p>}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">📋 カルテ未作成</p>
                        )}
                      </div>
                      {adminRole !== 'staff' && (
                        <div className="shrink-0 flex flex-col gap-1">
                          <Link href={`/dashboard/reservations/${r.id}/karte`} className="block text-center text-xs font-bold px-3 py-2 rounded-lg shadow bg-blue-600 text-white hover:bg-blue-700 transition">
                            {karte ? "編集" : "作成"}
                          </Link>
                          {/* #7: ステータス修正ボタン */}
                          <button
                            onClick={() => handleCorrectStatus(r, "cancelled")}
                            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition"
                          >
                            修正
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* キャンセル履歴 */}
        {cancelled.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-500 mb-3 border-b border-gray-200 pb-1">❌ キャンセル履歴</h2>
            <div className="space-y-2">
              {cancelled.map(r => (
                <div key={r.id} className="bg-gray-50 rounded-xl border p-3 flex justify-between items-center opacity-70">
                  <p className="text-sm text-gray-600">{formatDate(r.start_time)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">キャンセル</span>
                    {/* #7: キャンセル→受講済みに修正 */}
                    {adminRole !== 'staff' && (
                      <button
                        onClick={() => handleCorrectStatus(r, "completed")}
                        className="text-xs text-gray-400 hover:text-green-600 px-2 py-1 rounded hover:bg-green-50 transition"
                      >
                        修正
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
