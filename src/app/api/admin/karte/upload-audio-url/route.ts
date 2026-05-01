import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { fileName, mimeType: _mimeType } = await request.json();
    const supabase = createAdminClient();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from('audio-temp')
      .createSignedUploadUrl(path);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ signedUrl: data.signedUrl, path });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
