import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const GOLF_CLUB_LABEL = '富加町ゴルフ部';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ success: false, error: 'コードを入力してください' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: '認証に失敗しました' }, { status: 401 });
    }

    // クーポンコードの存在確認
    const { data: coupon } = await admin
      .from('coupon_codes')
      .select('id')
      .eq('code', code.trim())
      .single();

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'コードが正しくありません' }, { status: 400 });
    }

    // 現在のラベルを取得
    const { data: profile } = await admin
      .from('profiles')
      .select('labels')
      .eq('id', user.id)
      .single();

    const currentLabels: string[] = Array.isArray(profile?.labels) ? profile.labels : [];

    if (currentLabels.includes(GOLF_CLUB_LABEL)) {
      return NextResponse.json({ success: true, alreadyAssigned: true });
    }

    // ラベルを追加
    const { error: updateError } = await admin
      .from('profiles')
      .update({ labels: [...currentLabels, GOLF_CLUB_LABEL] })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, alreadyAssigned: false });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
