import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('late_requests')
    .select('id, user_id, start_time, lesson_type, status')
    .eq('status', 'pending')
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const requests = data || [];
  if (requests.length === 0) return NextResponse.json({ success: true, requests: [] });

  const userIds = [...new Set(requests.map(r => r.user_id))];
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

  const result = requests.map(r => ({
    ...r,
    profiles: profileMap[r.user_id] ?? { name: '名称未設定' },
  }));

  return NextResponse.json({ success: true, requests: result });
}
