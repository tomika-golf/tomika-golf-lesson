import { NextResponse } from 'next/server';
import { formatKarteInput, KARTE_SYSTEM_PROMPT } from '@/utils/ai-prompts';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.KARTE_CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'KARTE_CLAUDE_API_KEYが設定されていません。VercelのEnvironment Variablesに追加してください。' },
        { status: 500 }
      );
    }

    const { notes } = await request.json();

    const safeNotes = notes?.trim() || '';
    if (!safeNotes) {
      return NextResponse.json({ error: 'メモが空です' }, { status: 400 });
    }

    const userMessage = formatKarteInput(safeNotes);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: KARTE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    return NextResponse.json({ success: true, text });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Karte generate error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
