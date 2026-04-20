import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ version: 'v4', deployed: new Date().toISOString() });
}
