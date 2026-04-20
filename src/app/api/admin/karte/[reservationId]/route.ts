import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _: Request,
  ctx: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await ctx.params;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('review_notes')
      .select('*')
      .eq('reservation_id', reservationId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, karte: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
