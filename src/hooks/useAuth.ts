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

  useEffect(() => {
    async function initAuth() {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error("【設定エラー】LIFF_ID が設定されていません。");
        }

        // ステップ1: LIFFの初期化
        try {
          await liff.init({ liffId });
        } catch (initErr: any) {
          throw new Error(`【ステップ1】LIFF初期化エラー: ${initErr.message}`);
        }

        if (!liff.isLoggedIn()) {
          // LIFFブラウザ外の場合はLINEログイン画面へ飛ばす
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // ステップ2: LINEプロフィールの取得
        let liffProfile;
        try {
          liffProfile = await liff.getProfile();
        } catch (profileErr: any) {
          throw new Error(`【ステップ2】プロフィール取得エラー: ${profileErr.message}`);
        }

        // ステップ3: IDトークンの取得
        const idToken = liff.getIDToken();
        if (!idToken) {
          throw new Error("【ステップ3】IDトークンが取得できませんでした。LIFFの設定でopenidスコープが有効か確認してください。");
        }

        // ステップ4: Supabaseへのログイン
        const supabase = createClient();
        let authData;
        try {
          const result = await supabase.auth.signInWithIdToken({
            provider: 'line',
            token: idToken,
          });
          if (result.error) {
            throw result.error;
          }
          authData = result.data;
        } catch (supaErr: any) {
          throw new Error(`【ステップ4】Supabase認証エラー: ${supaErr.message || JSON.stringify(supaErr)}`);
        }

        setProfile({
          lineId: liffProfile.userId,
          displayName: liffProfile.displayName,
          pictureUrl: liffProfile.pictureUrl,
          supabaseUserId: authData.user?.id,
        });

        // ステップ5: プロフィール同期
        try {
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lineId: liffProfile.userId,
              displayName: liffProfile.displayName,
              supabaseUserId: authData.user?.id,
            }),
          });
        } catch (syncErr: any) {
          console.error("プロフィール同期エラー（致命的ではない）:", syncErr);
        }

      } catch (err: any) {
        console.error("Auth Init Error:", err);
        setError(err.message || "認証エラーが発生しました");
      } finally {
        setIsReady(true);
      }
    }

    initAuth();
  }, []);

  return { isReady, profile, error };
}

