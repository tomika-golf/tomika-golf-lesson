import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const admin = createAdminClient();

    const { error } = await admin.from('profiles').update(body).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const admin = createAdminClient();

    const [profileRes, reservationsRes] = await Promise.all([
      admin.from('profiles').select('*').eq('id', id).single(),
      admin.from('reservations').select('*').eq('user_id', id).order('start_time', { ascending: false }),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (reservationsRes.error) throw reservationsRes.error;

    // review_notesを別クエリで取得してマージ
    const ids = (reservationsRes.data || []).map((r: any) => r.id);
    const { data: notes } = ids.length > 0
      ? await admin.from('review_notes').select('*').in('reservation_id', ids)
      : { data: [] };

    const reservations = (reservationsRes.data || []).map((r: any) => ({
      ...r,
      review_notes: (notes || []).filter((n: any) => n.reservation_id === r.id),
    }));

    return NextResponse.json({
      success: true,
      profile: profileRes.data,
      reservations,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
