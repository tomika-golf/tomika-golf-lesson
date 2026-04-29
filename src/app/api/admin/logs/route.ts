import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');
    const admin = createAdminClient();

    if (reservationId) {
      // #14: 特定予約のステータス変更履歴
      const { data, error } = await admin
        .from('reservation_status_logs')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, logs: data || [] });
    }

    // #15: 管理者操作ログ（直近100件）
    const { data, error } = await admin
      .from('admin_operation_logs')
      .select('*')
      .order('performed_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ success: true, logs: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
