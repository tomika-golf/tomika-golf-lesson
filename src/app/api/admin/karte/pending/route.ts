import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { subDays } from 'date-fns';

export const revalidate = 0;

export async function GET() {
  try {
    const admin = createAdminClient();

    // 過去60日以内の完了済み予約を取得
    const since = subDays(new Date(), 60).toISOString();

    const { data: reservations, error } = await admin
      .from('reservations')
      .select('id, start_time, lesson_type, profiles(name)')
      .eq('status', 'completed')
      .gte('start_time', since)
      .order('start_time', { ascending: false });

    if (error) throw error;

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ success: true, pending: [] });
    }

    // カルテが存在するものを取得
    const ids = reservations.map((r: any) => r.id);
    const { data: notes } = await admin
      .from('review_notes')
      .select('reservation_id, is_draft')
      .in('reservation_id', ids);

    // 公開済みカルテがないものだけ返す
    const publishedIds = new Set(
      (notes || []).filter((n: any) => !n.is_draft).map((n: any) => n.reservation_id)
    );

    const pending = reservations
      .filter((r: any) => !publishedIds.has(r.id))
      .map((r: any) => ({
        ...r,
        has_draft: (notes || []).some((n: any) => n.reservation_id === r.id && n.is_draft),
      }));

    return NextResponse.json({ success: true, pending });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
