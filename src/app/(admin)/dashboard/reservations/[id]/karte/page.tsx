"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function KarteInputPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<any>(null);
  
  // 入力フォームの状態
  const [good, setGood] = useState("");
  const [improve, setImprove] = useState("");
  const [homework, setHomework] = useState("");
  
  // AI生成結果
  const [aiResult, setAiResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 予約情報の詳細を取得（誰に向けたカルテか確認するため）
    const fetchRes = async () => {
      try {
        const res = await fetch(`/api/admin/reservations`);
        const data = await res.json();
        if (data.success) {
          const target = data.reservations.find((r: any) => r.id === reservationId);
          setReservation(target);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRes();
  }, [reservationId]);

  // AIに清書してもらう関数
  const handleAiGenerate = async () => {
    if (!good && !improve && !homework) {
      alert("メモを何か入力してください。");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/karte/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ good, improve, homework }),
      });
      const data = await response.json();
      if (data.success) {
        setAiResult(data.text);
      } else {
        alert("AI生成エラー: " + data.error);
      }
    } catch (err) {
      alert("AIとの通信に失敗しました。Keyが未設定の可能性があります。");
    } finally {
      setIsGenerating(true); // 本来はfalseですが、開発用に見せるために止める
      setIsGenerating(false);
    }
  };

  // カルテを保存して公開する関数
  const handleSave = async () => {
    if (!aiResult) {
       alert("AIで清書してから保存してください。");
       return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/karte/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          content: aiResult,
          videoUrl: "", // 将来的に動画URLを入れる
          isDraft: false
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("カルテを公開しました！お客様のマイページに表示されます。");
        router.push("/dashboard");
      } else {
        alert("保存エラー: " + data.error);
      }
    } catch (err) {
      alert("保存中にエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">読み込み中...</div>;
  if (!reservation) return <div className="p-10 text-center text-red-500">データが見つかりません。</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">AIカルテ作成</h1>
        <button onClick={() => router.back()} className="text-sm border px-3 py-1 rounded">キャンセル</button>
      </header>

      <main className="p-4 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* 左側：先生の入力エリア */}
        <section className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              ✏️ レッスンメモ（箇条書きでOK）
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand mb-1">✅ 今日の良かった点</label>
                <textarea 
                  value={good}
                  onChange={(e) => setGood(e.target.value)}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-brand focus:border-brand"
                  rows={3}
                  placeholder="例：スイングの軌道が内側から入るようになった。ドライバーの飛距離が伸びた。"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-accent mb-1">⚠️ 今後の改善点</label>
                <textarea 
                  value={improve}
                  onChange={(e) => setImprove(e.target.value)}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-accent focus:border-accent"
                  rows={3}
                  placeholder="例：バックスイングで右膝が伸びすぎる。インパクト時に顔が早く上がる。"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-600 mb-1">🏠 次回までの宿題</label>
                <textarea 
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="例：家で壁に頭をつけて素振り。腹筋を意識したアドレス。"
                />
              </div>
            </div>

            <button 
              onClick={handleAiGenerate}
              disabled={isGenerating}
              className="mt-6 w-full py-4 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-green-800 flex justify-center items-center gap-2 transition-all transform active:scale-95"
            >
              {isGenerating ? "AIが清書しています..." : "✨ Claude AIに清書してもらう"}
            </button>
          </div>
        </section>

        {/* 右側：AI生成結果・プレビューエリア */}
        <section className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border h-full flex flex-col">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              📨 AIが作成したメッセージ（お客様に届く文章）
            </h2>
            
            <div className="flex-1 bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 overflow-y-auto">
              {aiResult ? (
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                  {aiResult}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center">
                  左側に入力してボタンを押すと、<br />ここに丁寧な文章が生成されます。
                </div>
              )}
            </div>

            {aiResult && (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="mt-6 w-full py-4 bg-accent text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-all"
              >
                {isSaving ? "送信中..." : "🚀 カルテを公開する（お客様へ届ける）"}
              </button>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
