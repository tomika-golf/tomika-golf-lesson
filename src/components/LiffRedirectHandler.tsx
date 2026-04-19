"use client";

import { useEffect } from "react";
import liff from "@line/liff";

/**
 * LINEの認証後リダイレクトを処理するコンポーネント。
 *
 * LIFFのエンドポイントURLがトップページ(/)の場合、LINE認証後に
 * /?liff.state=/booking のようなURLでここへ戻ってくる。
 * liff.init()を呼ぶことでLIFFがliff.stateを読み取り、
 * 本来のページ(/booking や /mypage)へ自動的にリダイレクトする。
 */
export function LiffRedirectHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasLiffState = params.has("liff.state");
    const hasCode = params.has("code");

    // liff.state または code が URL にある = LINE認証後の戻り
    if (!hasLiffState && !hasCode) return;

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) return;

    liff.init({ liffId }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      // CDN読み込みエラーは無視（認証処理には影響しない）
      if (!msg.includes("Unable to load client features")) {
        console.error("LiffRedirectHandler: init error", err);
      }
    });
  }, []);

  return null;
}
