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
  profiles: {
    name: string;
    phone: string;
    ticket_man_to_man: number;
    ticket_group: number;
  };
};

export default function AdminDashboard() {
  const router = useRouter();
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dashboard/login");
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/admin/reservations");
      const data = await res.json();
      if (data.success) {
        setReservations(data.reservations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleComplete = async (res: AdminReservation) => {
    if (!window.confirm(`${res.profiles?.name} 様のレッスンを完了とし、チケットを消費しますか？`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: res.id,
          status: "completed",
          userId: res.user_id,
          lessonType: res.lesson_type,
        }),
      });
      const data = await response.json();

      if (data.success) {
        alert("受講完了処理が成功し、チケットが消費されました！");
        fetchReservations();
      } else {
        alert("エラー: " + data.error);
      }
    } catch (err) {
      alert("通信エラーが発生しました。");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold">管理者ダッシュボード</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/dashboard/customers" className="bg-blue-600 px-3 py-2 rounded shadow">📋 カルテ管理</Link>
          <Link href="/dashboard/ghost-account" className="bg-gray-600 px-3 py-2 rounded">👻 ゴースト作成</Link>
          <Link href="/dashboard/booking" className="bg-brand px-3 py-2 rounded shadow">📅 代理予約</Link>
          <button onClick={handleLogout} className="bg-red-700 px-3 py-2 rounded">ログアウト</button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6 mt-4">
        {/* レッスン予定一覧 */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
            📍 本日以降の予約一覧
          </h2>

          <div className="space-y-4">
            {reservations.length === 0 ? (
              <p className="text-gray-500 bg-white p-6 rounded text-center">現在、予定されているレッスンはありません。</p>
            ) : (
              reservations.map((r) => (
                <div key={r.id} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${r.status === 'completed' ? 'border-gray-400 opacity-60' : r.lesson_type === 'man-to-man' ? 'border-brand' : 'border-accent'}`}>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    
                    {/* 左側：顧客情報と日時 */}
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
                      
                      {/* メモやオプション */}
                      {(r.options?.length > 0 || r.customer_memo) && (
                        <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700">
                          {r.options?.length > 0 && <p className="font-bold text-accent mb-1">オプション: {r.options.join(', ')}</p>}
                          {r.customer_memo && <p>💬 {r.customer_memo}</p>}
                        </div>
                      )}
                    </div>

                    {/* 右側：チケット状態とアクション操作 */}
                    <div className="flex flex-col items-end justify-between min-w-[200px] border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
                      <div className="text-right w-full mb-3 md:mb-0">
                        <p className="text-xs text-gray-500 font-bold mb-1">現在の保有チケット</p>
                        <p className="text-sm text-gray-700">
                          マンツー: <span className="font-bold text-brand">{r.profiles?.ticket_man_to_man || 0}</span>枚 / 
                          グループ: <span className="font-bold text-accent">{r.profiles?.ticket_group || 0}</span>枚
                        </p>
                      </div>

                      <div className="w-full">
                        {r.status === 'confirmed' ? (
                          <button 
                            onClick={() => handleComplete(r)}
                            className="w-full py-3 bg-accent text-white font-bold rounded-lg shadow hover:bg-orange-600 transition"
                          >
                            ✅ 受講完了 (チケット消費)
                          </button>
                        ) : r.status === 'completed' ? (
                          <div className="w-full flex-col flex gap-2">
                            <div className="w-full text-center py-2 bg-gray-100 text-gray-500 font-bold rounded-lg px-2 text-sm">
                              受講済
                            </div>
                            <Link href={`/dashboard/reservations/${r.id}/karte`} className="w-full text-center py-2 bg-blue-600 text-white font-bold rounded-lg px-2 text-sm shadow hover:bg-blue-700 transition">
                              📝 AIカルテを作成・編集
                            </Link>
                          </div>
                        ) : (
                          <div className="w-full text-center py-3 bg-red-50 text-red-500 font-bold rounded-lg">
                            ❌ キャンセルされました
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
