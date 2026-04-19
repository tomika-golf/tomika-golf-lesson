import { NextResponse } from 'next/server';

// 環境変数が設定されているか確認用（値は表示しない）
// 確認が終わったら削除すること
export async function GET() {
  return NextResponse.json({
    ADMIN_SECRET: !!process.env.ADMIN_SECRET,
    ADMIN_1_USERNAME: process.env.ADMIN_1_USERNAME ? `"${process.env.ADMIN_1_USERNAME}"` : '未設定',
    ADMIN_1_PASSWORD_set: !!process.env.ADMIN_1_PASSWORD,
    ADMIN_2_USERNAME: process.env.ADMIN_2_USERNAME ? `"${process.env.ADMIN_2_USERNAME}"` : '未設定',
    ADMIN_2_PASSWORD_set: !!process.env.ADMIN_2_PASSWORD,
  });
}
