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
          throw new Error("NEXT_PUBLIC_LIFF_ID が設定されていません。");
        }

        // 1. LIFFの初期化
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          // LIFFブラウザ外（通常のSafariやChrome）の場合はLINEログイン画面へ飛ばす
          liff.login();
          return;
        }

        // 2. LINEプロフィールの取得
        const liffProfile = await liff.getProfile();
        
        // 3. OIDC (OpenID Connect) トークンの取得
        const idToken = liff.getIDToken();
        if (!idToken) {
          throw new Error("LINEの認証トークンが取得できませんでした。");
        }

        // 4. Supabaseへのログイン（自動ユーザー登録も含む）
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
          provider: 'line',
          token: idToken,
        });

        if (authError) {
          console.error("Supabase Auth Error:", authError);
          // ※ Supabase側でLINE連携設定が終わっていない場合はここでエラーになります
          throw new Error("データベース連携設定が未完了です。");
        }

        setProfile({
          lineId: liffProfile.userId,
          displayName: liffProfile.displayName,
          pictureUrl: liffProfile.pictureUrl,
          supabaseUserId: authData.user?.id,
        });

        // カスタムAPIへリクエストを送り、プロフィールテーブルの作成・更新を行う（名前の保存など）
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineId: liffProfile.userId,
            displayName: liffProfile.displayName,
            supabaseUserId: authData.user?.id,
          }),
        });

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
