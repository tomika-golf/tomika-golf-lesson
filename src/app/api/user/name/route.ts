import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: '2文字以上のお名前を入力してください' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    const { error } = await admin
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', user.id);

    if (error) {
      console.error('Name update error:', error);
      return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Name API Error:', msg);
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}
