"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Reservation = {
  id: string;
  start_time: string;
  lesson_type: "man-to-man" | "group";
  status: string;
  profiles?: { name: string };
};

type DraftData = {
  good: string;
  improve: string;
  homework: string;
  aiResult: string;
  videoUrl: string;
};

const FIELDS = ["good", "improve", "homework"] as const;
type Field = typeof FIELDS[number];

function getDraftKey(id: string) {
  return `karte_draft_${id}`;
}

export default function KarteInputPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  const [good, setGood] = useState("");
  const [improve, setImprove] = useState("");
  const [homework, setHomework] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [recordingField, setRecordingField] = useState<Field | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // 音声認識サポート確認
  const isSpeechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // ページ読み込み時：DB + ローカルストレージからデータ取得
  useEffect(() => {
    async function load() {
      try {
        // 予約情報を取得
        const resData = await fetch("/api/admin/reservations").then(r => r.json());
        if (resData.success) {
          const target = resData.reservations.find((r: Reservation) => r.id === reservationId);
          setReservation(target || null);
        }

        // ローカルストレージのドラフト確認（優先）
        const raw = localStorage.getItem(getDraftKey(reservationId));
        if (raw) {
          const draft: DraftData = JSON.parse(raw);
          setGood(draft.good || "");
          setImprove(draft.improve || "");
          setHomework(draft.homework || "");
          setAiResult(draft.aiResult || "");
          setVideoUrl(draft.videoUrl || "");
          setDraftSavedAt("一時保存データを復元しました");
          return;
        }

        // ドラフトがなければDBの既存カルテを取得
        const karteData = await fetch(`/api/admin/karte/${reservationId}`).then(r => r.json());
        if (karteData.success && karteData.karte) {
          setAiResult(karteData.karte.karte_good || "");
          setVideoUrl(karteData.karte.video_url || "");
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reservationId]);

  // 一時保存（ローカルストレージ）
  const saveDraft = useCallback(() => {
    const draft: DraftData = { good, improve, homework, aiResult, videoUrl };
    localStorage.setItem(getDraftKey(reservationId), JSON.stringify(draft));
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    setDraftSavedAt(`${now} に一時保存しました`);
  }, [good, improve, homework, aiResult, videoUrl, reservationId]);

  // 音声入力開始・停止
  const toggleRecording = (field: Field) => {
    if (!isSpeechSupported) {
      alert("このブラウザは音声入力に対応していません。Chrome / Safari をお使いください。");
      return;
    }

    if (recordingField === field) {
      // 録音停止
      recognitionRef.current?.stop();
      setRecordingField(null);
      return;
    }

    // 他のフィールドが録音中なら停止
    recognitionRef.current?.stop();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((r: any) => r[0].transcript)
        .join("");
      if (field === "good") setGood(prev => prev + (prev ? "、" : "") + transcript);
      if (field === "improve") setImprove(prev => prev + (prev ? "、" : "") + transcript);
      if (field === "homework") setHomework(prev => prev + (prev ? "、" : "") + transcript);
    };

    recognition.onend = () => {
      setRecordingField(null);
    };

    recognition.onerror = () => {
      setRecordingField(null);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecordingField(field);
  };

  // AI要約
  const handleAiGenerate = async () => {
    if (!good && !improve && !homework) {
      alert("何かメモを入力してください。");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/karte/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ good, improve, homework }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data.text);
      } else {
        alert("AI生成エラー: " + data.error);
      }
    } catch {
      alert("AIとの通信に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  // 動画ファイル選択（UI のみ、アップロードは今後実装）
  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // TODO: Supabase Storageへのアップロード実装後にURLをセット
    }
  };

  // DB保存（公開）
  const handleSave = async (isDraft: boolean) => {
    if (!aiResult) {
      alert("AIで要約してから保存してください。");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/karte/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          content: aiResult,
          videoUrl,
          isDraft,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (!isDraft) {
          // 公開時はローカルストレージのドラフトを削除
          localStorage.removeItem(getDraftKey(reservationId));
          alert("カルテを公開しました！お客様のマイページに表示されます。");
          router.push("/dashboard");
        } else {
          setDraftSavedAt("DBに下書き保存しました");
          alert("下書きとして保存しました。");
        }
      } else {
        alert("保存エラー: " + data.error);
      }
    } catch {
      alert("保存中にエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">読み込み中...</div>;

  const customerName = reservation?.profiles?.name || "お客様";
  const lessonDate = reservation
    ? new Date(reservation.start_time).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">AIカルテ作成</h1>
          {reservation && (
            <p className="text-xs text-gray-400">{customerName} 様 / {lessonDate}</p>
          )}
        </div>
        <button onClick={() => router.back()} className="text-sm border border-gray-500 px-3 py-1 rounded hover:bg-gray-700">
          キャンセル
        </button>
      </header>

      {draftSavedAt && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700 text-center">
          💾 {draftSavedAt}
        </div>
      )}

      <main className="p-4 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">

        {/* 左列：メモ入力 */}
        <section className="space-y-5">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-bold text-gray-700 mb-4">✏️ レッスンメモ</h2>

            {/* 良かった点 */}
            <NoteField
              label="✅ 今日の良かった点"
              labelColor="text-green-700"
              value={good}
              onChange={setGood}
              placeholder="例：スイングの軌道が改善された。ドライバーの飛距離が伸びた。"
              isRecording={recordingField === "good"}
              onToggleRecording={() => toggleRecording("good")}
              isSpeechSupported={isSpeechSupported}
            />

            {/* 改善点 */}
            <NoteField
              label="⚠️ 今後の改善点"
              labelColor="text-orange-600"
              value={improve}
              onChange={setImprove}
              placeholder="例：バックスイングで右膝が伸びすぎる。"
              isRecording={recordingField === "improve"}
              onToggleRecording={() => toggleRecording("improve")}
              isSpeechSupported={isSpeechSupported}
            />

            {/* 宿題 */}
            <NoteField
              label="🏠 次回までの宿題"
              labelColor="text-blue-600"
              value={homework}
              onChange={setHomework}
              placeholder="例：家で壁に頭をつけて素振り。"
              isRecording={recordingField === "homework"}
              onToggleRecording={() => toggleRecording("homework")}
              isSpeechSupported={isSpeechSupported}
            />

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="flex-1 py-3 bg-green-700 text-white font-bold rounded-xl shadow hover:bg-green-800 transition disabled:opacity-50"
              >
                {isGenerating ? "AIが要約中..." : "✨ AIで要約する"}
              </button>
              <button
                onClick={saveDraft}
                className="py-3 px-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition text-sm"
              >
                💾 一時保存
              </button>
            </div>
          </div>
        </section>

        {/* 右列：AI結果・動画・保存 */}
        <section className="space-y-5">

          {/* AI結果 */}
          <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col">
            <h2 className="font-bold text-gray-700 mb-3">📨 AIが作成したカルテ文</h2>
            <div className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[200px]">
              {aiResult ? (
                <textarea
                  value={aiResult}
                  onChange={e => setAiResult(e.target.value)}
                  className="w-full h-full min-h-[200px] p-3 bg-transparent text-sm text-gray-800 leading-relaxed resize-none focus:outline-none"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center p-4">
                  左側に入力して「AIで要約する」を<br />押すと文章が生成されます。
                </div>
              )}
            </div>
          </div>

          {/* 動画添付 */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-bold text-gray-700 mb-3">🎬 動画添付（任意）</h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">動画URL（YouTube・Google Driveなど）</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  動画ファイル添付
                  <span className="ml-2 text-orange-500 font-normal">（アップロード機能は準備中）</span>
                </label>
                <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-3 py-3 cursor-pointer hover:border-gray-400 transition">
                  <span className="text-lg">📎</span>
                  <span className="text-sm text-gray-500">
                    {videoFile ? videoFile.name : "クリックして動画ファイルを選択"}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="space-y-3">
            <button
              onClick={() => handleSave(false)}
              disabled={!aiResult || isSaving}
              className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition disabled:opacity-40"
            >
              {isSaving ? "送信中..." : "🚀 カルテを公開する（お客様へ届ける）"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!aiResult || isSaving}
              className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition disabled:opacity-40 text-sm"
            >
              下書きとして保存（お客様には非表示）
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}

// 音声入力付きメモフィールド
function NoteField({
  label, labelColor, value, onChange, placeholder, isRecording, onToggleRecording, isSpeechSupported,
}: {
  label: string;
  labelColor: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isRecording: boolean;
  onToggleRecording: () => void;
  isSpeechSupported: boolean;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className={`text-xs font-bold ${labelColor}`}>{label}</label>
        {isSpeechSupported && (
          <button
            type="button"
            onClick={onToggleRecording}
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🎙️ {isRecording ? "録音停止" : "音声入力"}
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
        rows={3}
        placeholder={placeholder}
      />
    </div>
  );
}
