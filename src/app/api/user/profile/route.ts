import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const admin = createAdminClient();

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let userId: string | null = null;
    if (token) {
      const { data: { user } } = await admin.auth.getUser(token);
      userId = user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, name, name_kana, phone, ticket_man_to_man, ticket_group, created_at')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const { data: allReservations, error: reservationsError } = await admin
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (reservationsError) {
      throw reservationsError;
    }

    // キャンセル済みはstart_timeから1日経過したら非表示
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const reservations = (allReservations || []).filter(r =>
      r.status !== 'cancelled' || new Date(r.start_time) > cutoff
    );

    return NextResponse.json({
      success: true,
      profile: profile || { ticket_man_to_man: 0, ticket_group: 0, name: 'ゲスト' },
      reservations: reservations || [],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('User Dashboard Profile Error:', msg);
    return NextResponse.json({ success: false, error: '情報の取得に失敗しました' }, { status: 500 });
  }
}
