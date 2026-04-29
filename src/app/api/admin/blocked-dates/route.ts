import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('blocked_dates')
    .select('*')
    .order('date', { ascending: true });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, blockedDates: data });
}

export async function POST(request: Request) {
  const { date, reason } = await request.json();
  if (!date) return NextResponse.json({ error: '日付を指定してください' }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from('blocked_dates').insert({ date, reason: reason || null });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const admin = createAdminClient();
  const { error } = await admin.from('blocked_dates').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
