"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  name: string;
  ticket_man_to_man: number;
  ticket_group: number;
};

type Reservation = {
  id: string;
  start_time: string;
  end_time: string;
  lesson_type: "man-to-man" | "group";
  status: "confirmed" | "completed" | "cancelled";
};

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setReservations(data.reservations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCancel = async (reservation: Reservation) => {
    if (!window.confirm("この予約をキャンセルしますか？\n（キャンセル期限は開始の3時間前までです）")) {
      return;
    }

    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: reservation.id }),
      });
      const data = await res.json();
      
      if (data.success) {
        alert("予約をキャンセルしました。");
        fetchProfile(); // データを再取得して表示を更新
      } else {
        alert("エラー: " + data.error);
      }
    } catch (err) {
      alert("通信エラーが発生しました。");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">情報の取得に失敗しました。</div>;

  const upcomingReservations = reservations.filter((r) => r.status === "confirmed");
  const pastReservations = reservations.filter((r) => r.status === "completed" || r.status === "cancelled");

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-brand text-white px-6 py-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold">マイページ</h1>
        <Link href="/booking" className="text-sm bg-accent px-3 py-1 rounded shadow">予約する</Link>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-4">
          <p className="text-xl font-bold text-gray-800">{profile.name} 様、こんにちは！</p>
        </div>

        {/* チケット残数カード */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
          <div className="flex-1 bg-green-50 p-4 rounded-xl text-center border border-green-100">
            <p className="text-xs font-bold text-brand mb-1">マンツーマン</p>
            <p className="text-3xl font-black text-brand tracking-tighter">
              {profile.ticket_man_to_man} <span className="text-sm font-bold ml-1">枚</span>
            </p>
          </div>
          <div className="flex-1 bg-orange-50 p-4 rounded-xl text-center border border-orange-100">
            <p className="text-xs font-bold text-accent mb-1">グループ</p>
            <p className="text-3xl font-black text-accent tracking-tighter">
              {profile.ticket_group} <span className="text-sm font-bold ml-1">枚</span>
            </p>
          </div>
        </section>

        {/* 次回のレッスン予約一覧 */}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-brand pb-1 flex items-center gap-2">
            📅 予約中のレッスン
          </h2>
          {upcomingReservations.length === 0 ? (
            <p className="text-gray-500 text-sm bg-white p-4 rounded-lg border">現在、予約しているレッスンはありません。</p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded inline-block mb-2 ${r.lesson_type === 'man-to-man' ? 'bg-green-100 text-brand' : 'bg-orange-100 text-accent'}`}>
                      {r.lesson_type === 'man-to-man' ? 'マンツーマン' : 'グループ'}
                    </span>
                    <p className="font-bold text-gray-800 text-lg">
                      {new Date(r.start_time).toLocaleDateString()} {new Date(r.start_time).getHours()}:00
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCancel(r)}
                    className="text-sm border-2 border-gray-300 text-gray-500 font-bold px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 過去のレッスンとカルテ */}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-gray-400 pb-1 flex items-center gap-2">
            ⛳ 過去の履歴とカルテ
          </h2>
          {pastReservations.length === 0 ? (
            <p className="text-gray-500 text-sm bg-white p-4 rounded-lg border">過去の受講履歴はまだありません。</p>
          ) : (
            <div className="space-y-3">
              {pastReservations.map((r) => (
                <div key={r.id} className="bg-gray-50 p-4 rounded-xl border flex justify-between items-center opacity-80">
                  <div>
                    <p className="font-bold text-gray-600 text-sm">
                      {new Date(r.start_time).toLocaleDateString()} {new Date(r.start_time).getHours()}:00
                    </p>
                    <p className="text-xs font-bold mt-1 text-gray-500">
                      {r.status === 'completed' ? '✅ 受講完了' : '❌ キャンセル'}
                    </p>
                  </div>
                  {r.status === 'completed' && (
                     <Link href={`/mypage/karte/${r.id}`} className="text-xs bg-brand text-white font-bold px-3 py-2 rounded shadow">
                        カルテを見る
                     </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
