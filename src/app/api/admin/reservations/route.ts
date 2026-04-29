import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercelサーバーはタイムゾーンが UTC のため、日本時間（JST = UTC+9）で当日0時を計算する
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

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service Role Key is missing' }, { status: 500 });
    }

    // 過去の予約も含む全てか、本日の始まり以降の予約だけにするか
    // ここでは運用しやすいように「昨日以降」の予約をざっくり全部取ってフロントで分けるアプローチ
    const cutoff = startOfDayJST().toISOString();

    const { data: reservations, error: reservationsError } = await supabaseAdmin
      .from('reservations')
      .select('*, profiles(name, name_kana, phone, ticket_man_to_man, ticket_group)')
      .gte('start_time', cutoff)
      .order('start_time', { ascending: true });

    if (reservationsError) throw reservationsError;

    // review_notesを別クエリで取得してマージ
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

// 予約のステータス更新（完了処理など）
export async function PATCH(request: Request) {
  try {
    const { reservationId, status, userId, lessonType } = await request.json();

    // 1. 予約ステータスを更新する
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ status })
      .eq('id', reservationId);

    if (updateError) throw updateError;

    // 2. もしステータスが「completed（完了）」に変更されたなら、チケットを1枚消費する
    if (status === 'completed' && userId) {
      // 現在のプロフィール情報を取得
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('ticket_man_to_man, ticket_group')
        .eq('id', userId)
        .single();
      
      if (profile) {
        let updateData = {};
        if (lessonType === 'man-to-man' && profile.ticket_man_to_man > 0) {
          updateData = { ticket_man_to_man: profile.ticket_man_to_man - 1 };
        } else if (lessonType === 'group' && profile.ticket_group > 0) {
          updateData = { ticket_group: profile.ticket_group - 1 };
        }

        // チケットを減らす（チケットが0の場合はマイナスにはならずそのまま）
        if (Object.keys(updateData).length > 0) {
          await supabaseAdmin.from('profiles').update(updateData).eq('id', userId);
        }
      }

      // 【ステップ7予告】ここでAIカルテの「下書き」を自動生成するトリガーを引きます
      // await createKarteDraft(reservationId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Update Error:', error);
    return NextResponse.json({ success: false, error: '更新に失敗しました' }, { status: 500 });
  }
}
