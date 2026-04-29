import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin.from('ai_settings').select('prompt_template').eq('id', 1).single();
  return NextResponse.json({ success: true, prompt: data?.prompt_template ?? '' });
}

export async function PATCH(request: Request) {
  const { prompt } = await request.json();
  if (!prompt?.trim()) return NextResponse.json({ error: 'プロンプトを入力してください' }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from('ai_settings').update({ prompt_template: prompt, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
