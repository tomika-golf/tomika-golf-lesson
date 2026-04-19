"use client";

import { useState, useEffect } from "react";
// フルバンドル (@line/liff) は初期化時に LINE の CDN から legacy extension スクリプトを
// 動的読み込みする。この読み込みが失敗すると "Unable to load client features" になる。
// core + 必要なプラグインのみを使う構成に切り替えることで CDN 依存を排除する。
import liff from "@line/liff/core";
import GetProfileModule from "@line/liff/get-profile";
import GetIDTokenModule from "@line/liff/get-id-token";
import IsLoggedInModule from "@line/liff/is-logged-in";
import LoginModule from "@line/liff/login";
import { createClient } from "@/lib/supabase/client";

// モジュールレベルで1度だけプラグイン登録
liff.use(new GetProfileModule());
liff.use(new GetIDTokenModule());
liff.use(new IsLoggedInModule());
liff.use(new LoginModule());

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
        } catch (initErr: unknown) {
          const msg = initErr instanceof Error ? initErr.message : String(initErr);
          throw new Error(`【ステップ1】LIFF初期化エラー: ${msg}`);
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
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

  return { isReady, profile, error };
}
