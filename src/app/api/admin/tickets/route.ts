import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { userId, type, count } = await request.json();
    // type: 'man_to_man' or 'group'
    // count: Number of tickets to add (e.g. 1)

    // ユーザーの現在のプロフィールを取得
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('ticket_man_to_man, ticket_group')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (type === 'man_to_man') {
      updateData.ticket_man_to_man = (profile.ticket_man_to_man || 0) + count;
    } else {
      updateData.ticket_group = (profile.ticket_group || 0) + count;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ticket Update Error:', error);
    return NextResponse.json({ success: false, error: 'チケット情報の更新に失敗しました' }, { status: 500 });
  }
}
