import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUsernameFromCookie } from '@/lib/admin-token';

function startOfDayJST(): Date {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jst.setUTCHours(0, 0, 0, 0);
  return new Date(jst.getTime() - 9 * 60 * 60 * 1000);
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service Role Key is missing' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    // #8: ?includeOld=true のとき日付フィルターを外して過去の未処理予約も取得
    const includeOld = searchParams.get('includeOld') === 'true';

    let query = supabaseAdmin
      .from('reservations')
      .select('*, profiles(name, name_kana, phone)')
      .order('start_time', { ascending: includeOld ? false : true });

    if (!includeOld) {
      query = query.gte('start_time', startOfDayJST().toISOString());
    } else {
      // 過去の未処理（confirmed）のみ・直近90日以内
      const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .eq('status', 'confirmed')
        .lt('end_time', new Date().toISOString())
        .gte('start_time', cutoff90);
    }

    const { data: reservations, error: reservationsError } = await query;
    if (reservationsError) throw reservationsError;

    const ids = (reservations || []).map((r: any) => r.id);
    const { data: notes } = ids.length > 0
      ? await supabaseAdmin.from('review_notes').select('id, reservation_id, is_draft').in('reservation_id', ids)
      : { data: [] };

    const merged = (reservations || []).map((r: any) => ({
      ...r,
      review_notes: (notes || []).filter((n: any) => n.reservation_id === r.id),
    }));

    return NextResponse.json({ success: true, reservations: merged });
  } catch (error: any) {
    console.error('Admin Fetch Error:', error);
    return NextResponse.json({ success: false, error: '予約情報の取得に失敗しました' }, { status: 500 });
  }
}

// 予約のステータス更新
export async function PATCH(request: Request) {
  try {
    const { reservationId, status } = await request.json();
    const adminUsername = getAdminUsernameFromCookie(request.headers.get('cookie'));

    // 変更前のステータスを取得
    const { data: current } = await supabaseAdmin
      .from('reservations')
      .select('status')
      .eq('id', reservationId)
      .single();

    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ status })
      .eq('id', reservationId);

    if (updateError) throw updateError;

    // #14: ステータス変更履歴を記録
    if (current?.status && current.status !== status) {
      await supabaseAdmin.from('reservation_status_logs').insert({
        reservation_id: reservationId,
        changed_by: adminUsername,
        old_status: current.status,
        new_status: status,
      });
    }

    // #15: 操作ログを記録
    await supabaseAdmin.from('admin_operation_logs').insert({
      admin_username: adminUsername,
      action: 'status_changed',
      target_id: reservationId,
      detail: `${current?.status ?? '?'} → ${status}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Update Error:', error);
    return NextResponse.json({ success: false, error: '更新に失敗しました' }, { status: 500 });
  }
}
