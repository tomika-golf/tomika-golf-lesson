import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { formatKarteInput, KARTE_SYSTEM_PROMPT } from '@/utils/ai-prompts';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GeminiのAPIキーが設定されていません。' }, { status: 500 });
    }

    const { good, improve, homework } = await request.json();

    // 不要な空白や空文字の場合はハイフンにする
    const safeGood = good?.trim() || "特になし";
    const safeImprove = improve?.trim() || "特になし";
    const safeHomework = homework?.trim() || "特になし";

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 最新かつ高速・安価な gemini-1.5-flash を使用します
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: KARTE_SYSTEM_PROMPT,
    });

    const prompt = formatKarteInput(safeGood, safeImprove, safeHomework);
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error('Gemini Generate Error:', error);
    return NextResponse.json({ error: 'AIによるカルテの生成に失敗しました' }, { status: 500 });
  }
}
