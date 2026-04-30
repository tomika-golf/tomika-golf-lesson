import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY未設定' }, { status: 500 });

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    if (!audioFile) return NextResponse.json({ error: '音声ファイルが必要です' }, { status: 400 });

    const bytes = await audioFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = audioFile.type || 'audio/mp4';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      { text: 'この音声はゴルフレッスン中のコーチと生徒の会話です。ゴルフ用語が含まれます。話されている内容をそのまま文字起こしして、発言内容のみを出力してください。余計な説明や前置きは不要です。' },
    ]);

    const text = result.response.text().trim();
    if (!text) return NextResponse.json({ error: '文字起こし結果が空でした' }, { status: 500 });

    return NextResponse.json({ success: true, text });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[transcribe] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
