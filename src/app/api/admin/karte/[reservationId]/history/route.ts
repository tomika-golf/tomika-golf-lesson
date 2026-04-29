import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_: Request, ctx: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await ctx.params;
  const admin = createAdminClient();

  const { data: note } = await admin
    .from('review_notes')
    .select('id')
    .eq('reservation_id', reservationId)
    .single();

  if (!note) return NextResponse.json({ success: true, history: [] });

  const { data: history, error } = await admin
    .from('review_notes_history')
    .select('*')
    .eq('review_note_id', note.id)
    .order('saved_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, history: history || [] });
}
