# 🗺️ ファイル・構成マップ（随時更新）

このファイルは、**「どのファイルがどの画面の何をしているか」** をわかりやすくまとめた案内図です。プログラムに詳しくなくても、ここを見ればシステムの大枠がわかるようにしています。

---

## 🎨 デザイン・全体設定

| 役割（何をしているか） | ファイルの場所 |
|:---|:---|
| **全体のテーマカラーやフォント設定** | `tailwind.config.ts` |
| **全体に自動で適用される基本スタイル** | `src/app/globals.css` |
| **パッケージ一覧（使用している外部ツールのリスト）** | `package.json` |

---

## 🖥️ 画面（お客様向け）

| 画面名 | ファイルの場所 | 現在の状態 |
|:---|:---|:---:|
| **トップページ（コンセプト・入口）** | `src/app/page.tsx` | 🚧 作成中 |
| **お客様マイページ（予約一覧・チケット）** | `src/app/(customer)/mypage/page.tsx` | ✅ 完成 |
| **お客様AIカルテ閲覧画面** | `src/app/(customer)/mypage/karte/[id]/page.tsx` | ✅ 完成 |
| **予約画面（カレンダー・詳細入力）** | `src/app/(customer)/booking/page.tsx` | ✅ 完成 |
| **管理者ダッシュボード（日々の予約一覧）** | `src/app/(admin)/dashboard/page.tsx` | ✅ 完成 |
| **管理者AIカルテ作成・編集画面** | `src/app/(admin)/dashboard/reservations/[id]/karte/page.tsx` | ✅ 完成 |
| **ゴーストアカウント作成画面（管理者用）**| `src/app/(admin)/dashboard/ghost-account/page.tsx` | ✅ 完成 |

---

## 🛠️ 裏側の処理（APIなど）

| 機能名 | ファイルの場所 | 現在の状態 |
|:---|:---|:---:|
| **Google API連携用ライブラリ** | `src/lib/google-calendar.ts` | ✅ 完成 |
| **Supabase 連携クライアント** | `src/lib/supabase/...` | ✅ 完成 |
| **データベース設計（SQL）** | `supabase/migrations/` | ✅ 完成 |
| **AIプロンプト（指示文）管理** | `src/utils/ai-prompts.ts` | ✅ 完成 |
| **予約枠分割計算（スライサー）** | `src/utils/slot-slicer.ts` | ✅ 完成 |
| **ビジネスルール判定（チケット等）**| `src/utils/booking-rules.ts` | ✅ 完成 |
| **LINE＆Auth連携フック** | `src/hooks/useAuth.ts` | ✅ 完成 |
| **カレンダー予定取得API** | `src/app/api/calendar/sync/route.ts` | ✅ 完成 |
| **空き枠一覧表示API** | `src/app/api/calendar/slots/route.ts` | ✅ 完成 |
| **ユーザー情報・予約履歴取得API** | `src/app/api/user/profile/route.ts` | ✅ 完成 |
| **予約保存API** | `src/app/api/booking/route.ts` | ✅ 完成 |
| **予約キャンセルAPI** | `src/app/api/booking/cancel/route.ts` | ✅ 完成 |
| **ユーザーAIカルテ取得API** | `src/app/api/user/karte/route.ts` | ✅ 完成 |
| **管理者用 全予約データ取得・更新API** | `src/app/api/admin/reservations/route.ts` | ✅ 完成 |
| **管理者チケット付与API** | `src/app/api/admin/tickets/route.ts` | ✅ 完成 |
| **管理者AIカルテ生成API(Gemini)** | `src/app/api/admin/karte/generate/route.ts` | ✅ 完成 |
| **管理者AIカルテ保存API** | `src/app/api/admin/karte/save/route.ts` | ✅ 完成 |
| **ユーザー情報同期API** | `src/app/api/auth/sync/route.ts` | ✅ 完成 |
| **ゴーストアカウント作成API** | `src/app/api/admin/ghost/route.ts` | ✅ 完成 |

---

💡 **何かデザインや文章をちょっと変えたい時**
このマップを見て、該当する画面名（ファイルの場所）を探すと見つけやすいです！
