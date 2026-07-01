"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import AiChat from "@/components/AiChat";

type Profile = {
  name: string;
};

type Reservation = {
  id: string;
  start_time: string;
  end_time: string;
  lesson_type: "man-to-man" | "group" | "short";
  status: "confirmed" | "completed" | "cancelled";
};

export default function MyPage() {
  const router = useRouter();
  const { isReady, error: authError, accessToken } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [emergencyTarget, setEmergencyTarget] = useState<Reservation | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfile = async () => {
    try {
      const headers: HeadersInit = {};
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/user/profile", { headers });
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
    if (!isReady) return;
    fetchProfile();
  }, [isReady, accessToken]);

  const executeCancel = async (reservation: Reservation) => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers,
        body: JSON.stringify({ reservationId: reservation.id, cancelReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("予約をキャンセルしました。");
        fetchProfile();
      } else {
        showToast(data.error || "キャンセルに失敗しました。", false);
      }
    } catch {
      showToast("通信エラーが発生しました。", false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">LINE認証中です...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3 p-8">
        <p className="text-2xl">⚠️</p>
        <p className="font-bold text-gray-700 text-center">ログインに失敗しました</p>
        <p className="text-xs text-red-500 text-center bg-red-50 p-3 rounded-lg max-w-sm break-all">{authError}</p>
        <p className="text-sm text-gray-500 text-center mt-2">LINEアプリからアクセスしてください。</p>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">情報の取得に失敗しました。</div>;

  const now = new Date();
  const upcomingReservations = reservations.filter((r) => r.status === "confirmed");
  const completedCount = reservations.filter((r) => r.status === "completed").length;
  const pastReservations = reservations.filter((r) => r.status === "completed" || r.status === "cancelled");

  return (
    <div className="min-h-screen bg-background pb-20">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl space-y-4">
            <p className="font-bold text-gray-800 text-center">予約をキャンセルしますか？</p>
            <p className="text-xs text-gray-500 text-center">キャンセル期限は開始の3時間前までです</p>
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">キャンセル理由</p>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              >
                <option value="">選択してください</option>
                <option value="体調不良">体調不良</option>
                <option value="天気・天候">天気・天候</option>
                <option value="仕事・用事">仕事・用事</option>
                <option value="家族の都合">家族の都合</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCancelTarget(null); setCancelReason(''); }} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-600">戻る</button>
              <button onClick={() => { executeCancel(cancelTarget); setCancelTarget(null); setCancelReason(''); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold">キャンセルする</button>
            </div>
          </div>
        </div>
      )}

      {/* 3時間以内：直接LINE連絡案内ダイアログ */}
      {emergencyTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl space-y-4">
            <p className="text-3xl text-center">📱</p>
            <p className="font-bold text-gray-800 text-center">LINEで直接ご連絡ください</p>
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              レッスン開始3時間前を過ぎているため、システムからのキャンセルはできません。
            </p>
            <p className="text-sm text-orange-700 bg-orange-50 rounded-xl p-3 text-center font-bold leading-relaxed">
              LINEのトーク画面からコーチに直接メッセージをお送りください。
            </p>
            <button
              onClick={() => setEmergencyTarget(null)}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <header className="bg-brand text-white px-6 py-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-sm border border-white px-3 py-1 rounded">戻る</button>
        <h1 className="text-xl font-bold">マイページ</h1>
        <Link href="/booking" className="text-sm bg-accent px-3 py-1 rounded shadow">予約する</Link>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* 受講回数表示 */}
        <div className="text-center py-4">
          <p className="text-xl font-bold text-gray-800">{profile.name} 様、こんにちは！</p>
          {completedCount > 0 && (
            <p className="text-sm text-brand font-bold mt-1">⛳ 受講回数：{completedCount}回</p>
          )}
        </div>

        <AiChat accessToken={accessToken} />

        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-brand pb-1 flex items-center gap-2">
            📅 予約中のレッスン
          </h2>
          {upcomingReservations.length === 0 ? (
            <p className="text-gray-500 text-sm bg-white p-4 rounded-lg border">現在、予約しているレッスンはありません。</p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((r) => {
                const isPastDeadline = (new Date(r.start_time).getTime() - now.getTime()) < 3 * 60 * 60 * 1000;
                return (
                  <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold px-2 py-1 rounded inline-block mb-2 bg-green-100 text-brand">
                        {r.lesson_type === "man-to-man" ? "マンツーマン（50分）" : r.lesson_type === "short" ? "マンツーマン（15分）" : "マンツーマン（25分）"}
                      </span>
                      <p className="font-bold text-gray-800 text-lg">
                        {new Date(r.start_time).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })} {new Date(r.start_time).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                    </div>
                    <button
                      onClick={() => isPastDeadline ? setEmergencyTarget(r) : setCancelTarget(r)}
                      className="text-sm border-2 border-gray-300 text-gray-500 font-bold px-3 py-2 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
                      {new Date(r.start_time).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })} {new Date(r.start_time).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                    <p className="text-xs font-bold mt-1 text-gray-500">
                      {r.status === "completed" ? "✅ 受講完了" : "❌ キャンセル"}
                    </p>
                  </div>
                  {r.status === "completed" && (
                    <Link href={`/mypage/karte/${r.id}`} className="text-xs bg-brand text-white font-bold px-3 py-2 rounded shadow">
                      カルテを見る
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 pb-8 text-center text-xs text-gray-400">
          <div className="flex justify-center gap-4">
            <Link href="/privacy" className="underline hover:text-gray-600">プライバシーポリシー</Link>
            <Link href="/terms" className="underline hover:text-gray-600">利用規約</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
