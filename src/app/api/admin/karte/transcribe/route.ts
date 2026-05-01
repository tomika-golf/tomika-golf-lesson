import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 300;

const PROMPT = 'この音声はゴルフレッスン中のコーチと生徒の会話です。ゴルフ用語が含まれます。話されている内容をそのまま文字起こしして、発言内容のみを出力してください。余計な説明や前置きは不要です。';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY未設定' }, { status: 500 });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // 大きいファイル: Supabase Storage経由 → Gemini File API
      const { storagePath, mimeType } = await request.json();
      const supabase = createAdminClient();

      const { data: blob, error } = await supabase.storage.from('audio-temp').download(storagePath);
      if (error || !blob) throw new Error('ダウンロード失敗: ' + error?.message);

      const bytes = await blob.arrayBuffer();
      const fileUri = await uploadToGeminiFileApi(apiKey, bytes, mimeType || 'audio/mp4');

      const result = await model.generateContent([
        { fileData: { mimeType: mimeType || 'audio/mp4', fileUri } },
        { text: PROMPT },
      ]);
      const text = result.response.text().trim();

      // 両方のストレージから即時削除
      supabase.storage.from('audio-temp').remove([storagePath]).catch(console.error);
      deleteGeminiFile(apiKey, fileUri).catch(console.error);

      if (!text) return NextResponse.json({ error: '文字起こし結果が空でした' }, { status: 500 });
      return NextResponse.json({ success: true, text });
    } else {
      // 小さいファイル（4MB以下）: 従来のinlineData方式
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File | null;
      if (!audioFile) return NextResponse.json({ error: '音声ファイルが必要です' }, { status: 400 });

      const bytes = await audioFile.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mimeType = audioFile.type || 'audio/mp4';

      const result = await model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        { text: PROMPT },
      ]);
      const text = result.response.text().trim();
      if (!text) return NextResponse.json({ error: '文字起こし結果が空でした' }, { status: 500 });
      return NextResponse.json({ success: true, text });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[transcribe] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function uploadToGeminiFileApi(apiKey: string, bytes: ArrayBuffer, mimeType: string): Promise<string> {
  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}&uploadType=resumable`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(bytes.byteLength),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: 'audio' } }),
    }
  );
  if (!initRes.ok) throw new Error(`Gemini File API init failed: ${await initRes.text()}`);

  const uploadUrl = initRes.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) throw new Error('Upload URL not returned');

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(bytes.byteLength),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: bytes,
  });
  if (!uploadRes.ok) throw new Error(`Gemini File upload failed: ${await uploadRes.text()}`);

  const fileData = await uploadRes.json();
  const fileUri = fileData.file?.uri;
  if (!fileUri) throw new Error('File URI not returned');

  // ACTIVEになるまで待機
  const fileId = fileUri.match(/files\/([^?/]+)/)?.[1];
  if (fileId) {
    let activated = false;
    for (let i = 0; i < 30; i++) {
      const stateRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileId}?key=${apiKey}`);
      const { state } = await stateRes.json();
      if (state === 'ACTIVE') { activated = true; break; }
      if (state === 'FAILED') throw new Error('Gemini file processing failed');
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!activated) throw new Error('Gemini file did not become ACTIVE within 60s');
  }

  return fileUri;
}

async function deleteGeminiFile(apiKey: string, fileUri: string): Promise<void> {
  const fileId = fileUri.match(/files\/([^?/]+)/)?.[1];
  if (!fileId) return;
  await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileId}?key=${apiKey}`, { method: 'DELETE' });
}
