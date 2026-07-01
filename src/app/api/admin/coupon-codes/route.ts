import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('coupon_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, codes: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, description } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ success: false, error: 'コードを入力してください' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('coupon_codes')
      .insert({ code: code.trim(), description: description?.trim() || null })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'そのコードはすでに登録されています' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, coupon: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'IDが必要です' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('coupon_codes').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
