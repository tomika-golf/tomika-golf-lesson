import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('late_requests')
    .select('id, user_id, start_time, lesson_type, status, created_at, profiles(name)')
    .eq('status', 'pending')
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, requests: data || [] });
}
