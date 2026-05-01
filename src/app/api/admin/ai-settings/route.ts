import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin.from('ai_settings').select('prompt_template, customer_prompt_template').eq('id', 1).single();
  return NextResponse.json({
    success: true,
    prompt: data?.prompt_template ?? '',
    customerPrompt: data?.customer_prompt_template ?? '',
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const admin = createAdminClient();

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };

  if ('prompt' in body) {
    if (!body.prompt?.trim()) return NextResponse.json({ error: 'プロンプトを入力してください' }, { status: 400 });
    updates.prompt_template = body.prompt;
  }
  if ('customerPrompt' in body) {
    if (!body.customerPrompt?.trim()) return NextResponse.json({ error: 'プロンプトを入力してください' }, { status: 400 });
    updates.customer_prompt_template = body.customerPrompt;
  }

  const { error } = await admin.from('ai_settings').update(updates).eq('id', 1);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
