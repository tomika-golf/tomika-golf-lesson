import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all | has_lesson | last_month

    const admin = createAdminClient();

    const { data: allProfiles, error: profileError } = await admin
      .from('profiles')
      .select('id, name, line_user_id')
      .not('line_user_id', 'is', null)
      .order('name', { ascending: true });

    if (profileError) throw profileError;
    const profiles = allProfiles || [];

    if (filter === 'all') {
      return NextResponse.json({ success: true, customers: profiles, total: profiles.length });
    }

    const now = new Date().toISOString();
    let reservationQuery = admin
      .from('reservations')
      .select('user_id')
      .neq('status', 'cancelled')
      .lte('start_time', now);

    if (filter === 'last_month') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      reservationQuery = reservationQuery.gte('start_time', thirtyDaysAgo);
    }

    const { data: reservations, error: resError } = await reservationQuery;
    if (resError) throw resError;

    const lessonUserIds = new Set((reservations || []).map((r: { user_id: string }) => r.user_id));
    const filtered = profiles.filter(p => lessonUserIds.has(p.id));

    return NextResponse.json({ success: true, customers: filtered, total: filtered.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
