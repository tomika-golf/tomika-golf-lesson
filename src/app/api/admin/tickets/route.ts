import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'チケット機能は廃止されました' },
    { status: 410 }
  );
}
