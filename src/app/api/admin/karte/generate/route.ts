import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { formatKarteInput, KARTE_SYSTEM_PROMPT } from '@/utils/ai-prompts';
import { createAdminClient } from '@/lib/supabase/admin';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateWithRetry(systemPrompt: string, userContent: string, maxRetries = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: unknown) {
      const isOverloaded =
        error instanceof Anthropic.APIError && (error.status === 529 || error.status === 529);
      if (isOverloaded && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 3000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('リトライ上限に達しました');
}

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    const safeNotes = notes?.trim() || '';
    if (!safeNotes) {
      return NextResponse.json({ error: 'メモが空です' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: settings } = await admin.from('ai_settings').select('prompt_template').eq('id', 1).single();
    const systemPrompt = settings?.prompt_template || KARTE_SYSTEM_PROMPT;

    const text = await generateWithRetry(systemPrompt, formatKarteInput(safeNotes));

    return NextResponse.json({ success: true, text });
  } catch (error: unknown) {
    const isOverloaded = error instanceof Anthropic.APIError && error.status === 529;
    const msg = isOverloaded
      ? 'AIサーバーが混雑しています。しばらくしてから再度お試しください。'
      : error instanceof Error
        ? error.message
        : String(error);
    console.error('Karte generate error:', msg);
    return NextResponse.json({ error: msg }, { status: isOverloaded ? 503 : 500 });
  }
}
