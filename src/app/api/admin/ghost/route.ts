import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ゴースト用アカウント（auth.users）を強制的に作成するため、
// 特別に強力な権限を持つ「Service Role Key」を使用します。
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が設定されていません。管理者に連絡してください。' }, { status: 500 });
    }

    const { name, nameKana, phone, memo } = await request.json();

    // 1. ゴーストアカウント用の「架空のメールアドレス」と「パスワード」を作成
    // （お客様には一切見えず、LINE連携の代わりとして内部的に使うだけのものです）
    const timestamp = Date.now();
    const ghostEmail = `ghost_${timestamp}@ghost.tomika-golf.local`;
    const ghostPassword = `ghost_pass_${timestamp}`;

    // 2. 強制的にユーザー（auth.users）を作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ghostEmail,
      password: ghostPassword,
      email_confirm: true, // 認証メール送信をスキップ
    });

    if (authError || !authData.user) {
      console.error('Ghost Auth Error:', authError);
      return NextResponse.json({ error: 'ゴーストの認証データ作成に失敗しました' }, { status: 500 });
    }

    // 3. profiles テーブルに名前などの入力内容を保存
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: name,
        name_kana: nameKana,
        phone: phone,
        admin_memo: memo,
        role: 'customer', // 扱いは通常のお客様と同じ
      });

    if (profileError) {
      console.error('Ghost Profile Error:', profileError);
      return NextResponse.json({ error: 'ゴーストのプロフィール作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error: any) {
    console.error('Ghost API Error:', error);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
