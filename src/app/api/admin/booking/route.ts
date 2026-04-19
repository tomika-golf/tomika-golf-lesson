import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { userId, startTime, endTime, lessonType, memo } = await request.json();

    if (!userId || !startTime || !endTime || !lessonType) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('reservations')
      .insert({
        user_id: userId,
        status: 'confirmed',
        lesson_type: lessonType,
        start_time: startTime,
        end_time: endTime,
        options: [],
        customer_memo: memo || '',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, reservation: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Admin booking error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
