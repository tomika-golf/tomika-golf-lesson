import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkBookingRules } from '@/utils/booking-rules';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startTime, endTime, lessonType, options, memo } = body;

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ success: false, error: '認証に失敗しました' }, { status: 401 });
    }

    const userId = user.id;

    const [profileResult, reservationsResult] = await Promise.all([
      admin.from('profiles').select('ticket_man_to_man, ticket_group').eq('id', userId).single(),
      admin.from('reservations').select('status, lesson_type').eq('user_id', userId),
    ]);

    const userProfile = profileResult.data || { ticket_man_to_man: 0, ticket_group: 0 };
    const userReservations = reservationsResult.data || [];

    const ruleCheck = checkBookingRules({
      lessonType,
      isOverride: false,
      userProfile,
      userReservations,
    });

    if (!ruleCheck.isAllowed) {
      return NextResponse.json({ success: false, error: ruleCheck.errorMessage }, { status: 400 });
    }

    const { data, error } = await admin
      .from('reservations')
      .insert({
        user_id: userId,
        status: 'confirmed',
        lesson_type: lessonType,
        start_time: startTime,
        end_time: endTime,
        options: options || [],
        customer_memo: memo || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json({ success: false, error: '予約の保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reservation: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Booking API Error:', msg);
    return NextResponse.json({ success: false, error: '予期せぬエラーが発生しました' }, { status: 500 });
  }
}
