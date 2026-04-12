"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CustomerKartePage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [karteData, setKarteData] = useState<any>(null);

  useEffect(() => {
    const fetchKarte = async () => {
      try {
        const res = await fetch(`/api/user/karte?reservationId=${reservationId}`);
        const data = await res.json();
        
        if (data.success && data.karte) {
          setKarteData(data.karte);
        } else {
          setKarteData(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (reservationId) fetchKarte();
  }, [reservationId]);

  if (loading) return <div className="p-10 text-center text-gray-500">カルテを取得中...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-brand text-white px-6 py-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold">レッスンカルテ</h1>
        <button onClick={() => router.back()} className="text-sm bg-green-800 px-3 py-1 rounded shadow">戻る</button>
      </header>

      <main className="p-4 max-w-2xl mx-auto mt-4 space-y-6">
        {!karteData || karteData.is_draft ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border text-center">
             <div className="text-4xl mb-4">📝</div>
             <h2 className="text-lg font-bold text-gray-700 mb-2">カルテはまだありません</h2>
             <p className="text-sm text-gray-500">
               先生が今回のレッスン内容を元にカルテを作成中です。<br />
               公開されるまでもうしばらくお待ちください。
             </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand/20">
             <h2 className="text-lg font-bold text-gray-800 border-b-2 border-brand pb-2 mb-4 flex gap-2 items-center">
                ✨ {new Date(karteData.reservations.start_time).toLocaleDateString()} の振り返り
             </h2>
             
             <div className="whitespace-pre-wrap text-gray-700 leading-loose text-[15px] p-2">
               {karteData.karte_good}
             </div>

             <div className="mt-8 pt-4 border-t border-gray-100 text-center">
               <p className="text-brand font-bold">いつもご利用ありがとうございます！</p>
               <p className="text-xs text-gray-400 mt-1">富加ゴルフ レッスンチーム</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
