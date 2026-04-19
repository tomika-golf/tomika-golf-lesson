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
  ticket_man_to_man: number;
  ticket_group: number;
  admin_memo: string | null;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchData(); }, [customerId]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
  };

  const getKarte = (r: Reservation) => r.review_notes?.[0] ?? null;

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">データが見つかりません。</div>;

  const completed = reservations.filter(r => r.status === "completed");
  const upcoming = reservations.filter(r => r.status === "confirmed");
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
          {profile.name_kana && <p className="text-sm text-gray-500">{profile.name_kana}</p>}
          {profile.phone && <p className="text-sm text-gray-700">📞 {profile.phone}</p>}
          <div className="flex gap-4">
            <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2 text-center">
              <p className="text-xs font-bold text-green-700">マンツーマン</p>
              <p className="text-2xl font-black text-green-700">{profile.ticket_man_to_man}<span className="text-sm ml-1">枚</span></p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-2 text-center">
              <p className="text-xs font-bold text-orange-600">グループ</p>
              <p className="text-2xl font-black text-orange-600">{profile.ticket_group}<span className="text-sm ml-1">枚</span></p>
            </div>
          </div>
          {profile.admin_memo && (
            <p className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-lg p-3">
              📌 管理メモ: {profile.admin_memo}
            </p>
          )}
        </section>

        {/* 予約中のレッスン */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-gray-300 pb-1">📅 予約中</h2>
            <div className="space-y-3">
              {upcoming.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded inline-block mb-1 ${r.lesson_type === 'man-to-man' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                      {r.lesson_type === 'man-to-man' ? 'マンツーマン' : 'グループ'}
                    </span>
                    <p className="font-bold text-gray-800">{formatDate(r.start_time)}</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-bold">予約中</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 受講済み（カルテ一覧） */}
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
                  <div key={r.id} className={`bg-white rounded-xl border-l-4 shadow-sm p-4 ${r.lesson_type === 'man-to-man' ? 'border-green-600' : 'border-orange-500'}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${r.lesson_type === 'man-to-man' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                            {r.lesson_type === 'man-to-man' ? 'マンツーマン' : 'グループ'}
                          </span>
                          <p className="text-sm font-bold text-gray-700">{formatDate(r.start_time)}</p>
                        </div>

                        {karte ? (
                          <div className="mt-2 bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500 mb-1">
                              📋 カルテ {karte.is_draft ? <span className="text-orange-500">（下書き）</span> : <span className="text-green-600">（公開済）</span>}
                            </p>
                            <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">{karte.karte_good}</p>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">カルテ未作成</p>
                        )}
                      </div>

                      <div className="shrink-0">
                        <Link
                          href={`/dashboard/reservations/${r.id}/karte`}
                          className="block text-center text-xs font-bold px-3 py-2 rounded-lg shadow bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                          {karte ? "編集" : "作成"}
                        </Link>
                      </div>
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
                  <span className="text-xs text-gray-400">キャンセル</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
