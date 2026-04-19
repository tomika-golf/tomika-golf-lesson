import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .select('id, name, name_kana, phone, ticket_man_to_man, ticket_group, admin_memo')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, customers: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
