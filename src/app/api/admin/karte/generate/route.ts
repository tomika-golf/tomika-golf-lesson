import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { formatKarteInput, KARTE_SYSTEM_PROMPT } from '@/utils/ai-prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    const safeNotes = notes?.trim() || '';
    if (!safeNotes) {
      return NextResponse.json({ error: 'メモが空です' }, { status: 400 });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: KARTE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: formatKarteInput(safeNotes) }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ success: true, text });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Karte generate error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
