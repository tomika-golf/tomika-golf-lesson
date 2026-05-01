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
  notes: string;
  aiResult: string;
  videoUrl: string;
};

function getDraftKey(id: string) {
  return `karte_draft_${id}`;
}

export default function KarteInputPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  const [notes, setNotes] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStep, setTranscribeStep] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [karteStatus, setKarteStatus] = useState<"none" | "draft" | "published">("none");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);

  const isSpeechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    async function load() {
      try {
        const resData = await fetch("/api/admin/reservations").then(r => r.json());
        if (resData.success) {
          const target = resData.reservations.find((r: Reservation) => r.id === reservationId);
          setReservation(target || null);
        }

        // DBのカルテを最優先で確認
        const karteData = await fetch(`/api/admin/karte/${reservationId}`).then(r => r.json());
        if (karteData.success && karteData.karte) {
          const k = karteData.karte;
          let text = '';
          if (k.karte_improve || k.karte_homework) {
            // 新形式：3フィールドから復元
            const parts: string[] = [];
            if (k.karte_good) parts.push(`【課題】\n${k.karte_good}`);
            if (k.karte_improve) parts.push(`【改善策】\n${k.karte_improve}`);
            if (k.karte_homework) parts.push(`【練習方法】\n${k.karte_homework}`);
            text = parts.join('\n\n');
          } else {
            // 旧形式：karte_goodに全文が入っている
            text = k.karte_good || '';
          }
          setAiResult(text);
          setVideoUrl(k.video_url || "");
          setKarteStatus(k.is_draft ? "draft" : "published");
          return;
        }

        // DBになければlocalStorageを確認
        const raw = localStorage.getItem(getDraftKey(reservationId));
        if (raw) {
          const draft: DraftData = JSON.parse(raw);
          setNotes(draft.notes || "");
          setAiResult(draft.aiResult || "");
          setVideoUrl(draft.videoUrl || "");
          setDraftSavedAt("一時保存データを復元しました");
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reservationId]);

  const saveDraft = useCallback(() => {
    const draft: DraftData = { notes, aiResult, videoUrl };
    localStorage.setItem(getDraftKey(reservationId), JSON.stringify(draft));
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    setDraftSavedAt(`${now} に一時保存しました`);
  }, [notes, aiResult, videoUrl, reservationId]);

  const toggleRecording = () => {
    if (!isSpeechSupported) {
      alert("このブラウザは音声入力に対応していません。Chrome / Safari をお使いください。");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

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
      setNotes(prev => prev + (prev ? "\n" : "") + transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;
    setIsTranscribing(true);
    try {
      let res: Response;

      // Supabase直接アップロード（CORS問題）を回避し、サーバー経由で処理
      setTranscribeStep(`送信中... (${(audioFile.size / 1024 / 1024).toFixed(1)}MB、時間がかかります)`);
      const form = new FormData();
      form.append('audio', audioFile);
      setTranscribeStep('文字起こし中（1〜2分かかります）...');
      res = await fetch('/api/admin/karte/transcribe', { method: 'POST', body: form });

      const data = await res.json();
      if (data.success) {
        setNotes(prev => prev ? prev + '\n\n【文字起こし】\n' + data.text : '【文字起こし】\n' + data.text);
        setAudioFile(null);
      } else {
        alert('文字起こしエラー: ' + data.error);
      }
    } catch (err) {
      alert('エラー: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsTranscribing(false);
      setTranscribeStep('');
    }
  };

  const handleAiGenerate = async () => {
    if (!notes.trim()) {
      alert("メモを入力してください。");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/karte/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
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

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  const loadHistory = async () => {
    const data = await fetch(`/api/admin/karte/${reservationId}/history`).then(r => r.json());
    if (data.success) setHistory(data.history);
    setShowHistory(true);
  };

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
        body: JSON.stringify({ reservationId, content: aiResult, videoUrl, isDraft }),
      });
      const data = await res.json();
      if (data.success) {
        if (!isDraft) {
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

      {karteStatus !== "none" && (
        <div className={`border-b px-4 py-2 text-xs font-bold text-center ${karteStatus === "published" ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-600"}`}>
          {karteStatus === "published" ? "✅ このカルテは公開済みです" : "📝 このカルテは下書き保存中です"}
        </div>
      )}

      {draftSavedAt && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700 text-center">
          💾 {draftSavedAt}
        </div>
      )}

      <main className="p-4 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">

        {/* 左列：メモ入力 */}
        <section className="space-y-5">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-700">✏️ レッスンメモ</h2>
              {isSpeechSupported && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center gap-1 text-sm font-bold px-3 py-2 rounded-lg transition ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  🎙️ {isRecording ? "録音停止" : "音声入力"}
                </button>
              )}
            </div>

            {isRecording && (
              <p className="text-xs text-red-500 mb-2 animate-pulse">● 録音中... 話し終わったら「録音停止」を押してください</p>
            )}

            {/* 音声ファイルから文字起こし */}
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-blue-700">🎵 ボイスメモから文字起こし</p>
              <div className="text-xs text-blue-600 bg-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                <p className="font-bold mb-1">📱 iPhoneの手順</p>
                <p>① ボイスメモアプリ → 録音を選ぶ → 「・・・」→「共有」→「ファイルに保存」</p>
                <p>② 下の「ファイルを選ぶ」→「ファイルを参照」→ 保存したファイルを選ぶ</p>
              </div>
              <div className="flex gap-2 items-center">
                <label className="flex-1 cursor-pointer">
                  <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-3 transition ${audioFile ? 'border-blue-400 bg-white' : 'border-dashed border-blue-300 bg-white hover:bg-blue-50'}`}>
                    <span className="text-xl">{audioFile ? '🎵' : '📂'}</span>
                    <span className="text-sm text-gray-600 truncate">
                      {audioFile ? `${audioFile.name}（${(audioFile.size / 1024 / 1024).toFixed(1)}MB）` : 'ファイルを選ぶ'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".m4a,.mp3,.wav,.aac,.ogg,.webm,.mp4,.caf,audio/*"
                    className="hidden"
                    onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  onClick={handleTranscribe}
                  disabled={!audioFile || isTranscribing}
                  className="whitespace-nowrap py-3 px-4 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-blue-700 transition"
                >
                  {isTranscribing ? '変換中...' : 'AI文字起こし'}
                </button>
              </div>
              {isTranscribing && (
                <p className="text-xs text-blue-600 animate-pulse">● {transcribeStep}（長い録音ほど時間がかかります）</p>
              )}
            </div>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
              rows={10}
              placeholder="レッスン内容を自由にメモしてください。&#10;例：スイングの軌道が改善された。バックスイングで右膝が伸びすぎる。次回は壁に頭をつけて素振り。"
            />

            <div className="flex gap-2 mt-4">
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
                  <input type="file" accept="video/*" onChange={handleVideoFile} className="hidden" />
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
            {karteStatus !== "none" && (
              <button onClick={loadHistory} className="w-full py-2 border-2 border-gray-300 text-gray-500 font-bold rounded-xl text-sm hover:bg-gray-50">
                🕐 編集履歴を見る
              </button>
            )}
          </div>

          {/* 編集履歴モーダル */}
          {showHistory && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-black text-gray-800">🕐 編集履歴</p>
                  <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
                </div>
                <div className="overflow-y-auto space-y-3 flex-1">
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">履歴がありません</p>
                  ) : history.map((h, i) => (
                    <div key={h.id} className="border rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">{new Date(h.saved_at).toLocaleString('ja-JP')}</p>
                        {h.saved_by && <p className="text-xs text-gray-400">{h.saved_by}</p>}
                      </div>
                      {h.karte_good && <p className="text-xs text-gray-700 line-clamp-2"><span className="font-bold">課題：</span>{h.karte_good}</p>}
                      <button
                        onClick={() => {
                          const parts: string[] = [];
                          if (h.karte_good) parts.push(`【課題】\n${h.karte_good}`);
                          if (h.karte_improve) parts.push(`【改善策】\n${h.karte_improve}`);
                          if (h.karte_homework) parts.push(`【練習方法】\n${h.karte_homework}`);
                          setAiResult(parts.join('\n\n'));
                          setShowHistory(false);
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        この内容を復元する
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
