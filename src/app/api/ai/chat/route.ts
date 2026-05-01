import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/admin';
import { CUSTOMER_CHAT_SYSTEM_PROMPT, formatKarteDataForPrompt } from '@/utils/ai-prompts';

export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY が設定されていません' }, { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const admin = createAdminClient();

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const { message }: { message: string } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: 'メッセージが必要です' }, { status: 400 });
    }

    const { data: reservations } = await admin
      .from('reservations')
      .select('id, start_time')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('start_time', { ascending: false });

    let karteData: { id: string; date: string; good: string; improve: string; homework: string }[] = [];

    if (reservations && reservations.length > 0) {
      const reservationIds = reservations.map((r) => r.id);

      const { data: notes } = await admin
        .from('review_notes')
        .select('id, karte_good, karte_improve, karte_homework, reservation_id')
        .in('reservation_id', reservationIds)
        .eq('is_draft', false);

      if (notes && notes.length > 0) {
        karteData = notes.map((note) => {
          const reservation = reservations.find((r) => r.id === note.reservation_id);
          const date = reservation
            ? new Date(reservation.start_time).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '不明';
          return {
            id: note.reservation_id,
            date,
            good: note.karte_good || '',
            improve: note.karte_improve || '',
            homework: note.karte_homework || '',
          };
        });
      }
    }

    const { data: aiSettings } = await admin.from('ai_settings').select('customer_prompt_template').eq('id', 1).single();
    const basePrompt = aiSettings?.customer_prompt_template?.trim() || CUSTOMER_CHAT_SYSTEM_PROMPT;
    const systemInstruction = basePrompt + formatKarteDataForPrompt(karteData);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite', systemInstruction });

    const result = await model.generateContent(message);
    const rawText = result.response.text().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: {
      answer: string;
      referenced_kartes: { id: string; date: string; summary: string }[];
      match_type: string;
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { answer: rawText, referenced_kartes: [], match_type: 'none' };
    }

    return NextResponse.json({ success: true, ...parsed });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('AI Chat Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
