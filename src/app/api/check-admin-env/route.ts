import { NextResponse } from 'next/server';

// 環境変数確認用（確認後削除）
export async function GET() {
  const u1 = process.env.ADMIN_1_USERNAME;
  const u2 = process.env.ADMIN_2_USERNAME;
  return NextResponse.json({
    ADMIN_SECRET: !!process.env.ADMIN_SECRET,
    ADMIN_1_USERNAME: u1 ?? '未設定',
    ADMIN_1_USERNAME_文字数: u1?.length ?? 0,
    ADMIN_1_PASSWORD_set: !!process.env.ADMIN_1_PASSWORD,
    ADMIN_1_PASSWORD_文字数: process.env.ADMIN_1_PASSWORD?.length ?? 0,
    ADMIN_2_USERNAME: u2 ?? '未設定',
    ADMIN_2_USERNAME_文字数: u2?.length ?? 0,
    ADMIN_2_PASSWORD_set: !!process.env.ADMIN_2_PASSWORD,
    ADMIN_2_PASSWORD_文字数: process.env.ADMIN_2_PASSWORD?.length ?? 0,
  });
}
