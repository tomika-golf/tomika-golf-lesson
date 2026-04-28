"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

type KarteData = {
  karte_good: string;
  karte_improve: string;
  karte_homework: string;
  is_draft: boolean;
  reservations: {
    start_time: string;
    lesson_type: string;
  };
};

export default function CustomerKartePage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken, isReady } = useAuthContext();
  const reservationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [karteData, setKarteData] = useState<KarteData | null>(null);

  useEffect(() => {
    if (!isReady) return;

    const fetchKarte = async () => {
      try {
        const headers: HeadersInit = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

        const res = await fetch(`/api/user/karte?reservationId=${reservationId}`, { headers });
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
  }, [isReady, accessToken, reservationId]);

  if (!isReady || loading) return <div className="p-10 text-center text-gray-500">カルテを取得中...</div>;

  const lessonDate = karteData?.reservations?.start_time
    ? new Date(karteData.reservations.start_time).toLocaleDateString("ja-JP", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-brand text-white px-6 py-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold">レッスンカルテ</h1>
        <button onClick={() => router.back()} className="text-sm bg-green-800 px-3 py-1 rounded shadow">戻る</button>
      </header>

      <main className="p-4 max-w-2xl mx-auto mt-4 space-y-4">
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
          <>
            <p className="text-center text-sm text-gray-500 font-bold">{lessonDate} のレッスンカルテ</p>

            {karteData.karte_good && (
              <div className="bg-white rounded-2xl shadow-sm border border-brand/20 p-5">
                <h2 className="text-sm font-bold text-brand mb-3 flex items-center gap-2">
                  <span className="bg-brand text-white text-xs px-2 py-0.5 rounded-full">課題</span>
                </h2>
                <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">{karteData.karte_good}</p>
              </div>
            )}

            {karteData.karte_improve && (
              <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-5">
                <h2 className="text-sm font-bold text-orange-600 mb-3 flex items-center gap-2">
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">改善策</span>
                </h2>
                <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">{karteData.karte_improve}</p>
              </div>
            )}

            {karteData.karte_homework && (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-5">
                <h2 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">練習方法</span>
                </h2>
                <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">{karteData.karte_homework}</p>
              </div>
            )}

            <div className="pt-4 text-center">
              <p className="text-brand font-bold text-sm">いつもご利用ありがとうございます！</p>
              <p className="text-xs text-gray-400 mt-1">富加ゴルフ レッスンチーム</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
