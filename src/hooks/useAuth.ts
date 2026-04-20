"use client";

import { useState, useEffect } from "react";
import liff from "@line/liff";
import { createClient } from "@/lib/supabase/client";

export type UserProfile = {
  lineId: string;
  displayName: string;
  pictureUrl?: string;
  supabaseUserId?: string;
};

export function useAuth() {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    async function initAuth() {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error("【設定エラー】LIFF_ID が設定されていません。");
        }

        // ステップ1: LIFFの初期化
        // "Unable to load client features" は古いLINEとの互換用CDNスクリプトの
        // 読み込み失敗であり、認証（getProfile/getIDToken）自体には影響しない。
        // このエラーは無視して続行する。それ以外のエラーは致命的として扱う。
        try {
          await liff.init({ liffId });
        } catch (initErr: unknown) {
          const msg = initErr instanceof Error ? initErr.message : String(initErr);
          if (msg.includes("Unable to load client features")) {
            console.warn("LIFF: legacy extension の読み込みに失敗しましたが認証は続行します");
          } else {
            throw new Error(`【ステップ1】LIFF初期化エラー: ${msg}`);
          }
        }

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // ステップ2: LINEプロフィールの取得
        let liffProfile;
        try {
          liffProfile = await liff.getProfile();
        } catch (profileErr: unknown) {
          const msg = profileErr instanceof Error ? profileErr.message : String(profileErr);
          throw new Error(`【ステップ2】プロフィール取得エラー: ${msg}`);
        }

        // ステップ3: IDトークンの取得
        const idToken = liff.getIDToken();
        if (!idToken) {
          throw new Error("【ステップ3】IDトークンが取得できませんでした。LIFFの設定でopenidスコープが有効か確認してください。");
        }

        // ステップ4: サーバー経由でSupabaseセッションを作成
        // （signInWithIdTokenのLINE OIDC設定不要な独自方式）
        const supabase = createClient();
        let authData;
        try {
          const res = await fetch('/api/auth/line-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lineId: liffProfile.userId,
              displayName: liffProfile.displayName,
            }),
          });
          const json = await res.json();
          if (!res.ok || !json.session) {
            throw new Error(json.error || 'セッション取得失敗');
          }
          const { error: setErr } = await supabase.auth.setSession(json.session);
          if (setErr) throw setErr;
          setAccessToken(json.session.access_token);
          authData = { user: { id: json.userId } };
        } catch (supaErr: unknown) {
          const msg = supaErr instanceof Error ? supaErr.message : JSON.stringify(supaErr);
          throw new Error(`【ステップ4】Supabase認証エラー: ${msg}`);
        }

        setProfile({
          lineId: liffProfile.userId,
          displayName: liffProfile.displayName,
          pictureUrl: liffProfile.pictureUrl,
          supabaseUserId: authData.user?.id,
        });

        // ステップ5: プロフィール同期
        try {
          const syncHeaders: HeadersInit = { "Content-Type": "application/json" };
          if (json.session?.access_token) syncHeaders["Authorization"] = `Bearer ${json.session.access_token}`;
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: syncHeaders,
            body: JSON.stringify({
              lineId: liffProfile.userId,
              displayName: liffProfile.displayName,
              supabaseUserId: authData.user?.id,
            }),
          });
        } catch (syncErr: unknown) {
          console.error("プロフィール同期エラー（致命的ではない）:", syncErr);
        }

      } catch (err: unknown) {
        console.error("Auth Init Error:", err);
        const msg = err instanceof Error ? err.message : "認証エラーが発生しました";
        setError(msg);
      } finally {
        setIsReady(true);
      }
    }

    initAuth();
  }, []);

  return { isReady, profile, error, accessToken };
}
