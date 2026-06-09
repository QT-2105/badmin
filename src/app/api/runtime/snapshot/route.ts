import { NextResponse } from 'next/server';

import { getRuntimeSnapshot, syncRuntimeSnapshot } from '@/repositories/runtime-snapshot-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') ?? undefined;
  const snapshot = await getRuntimeSnapshot(sessionId);

  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const payload = await request.json();
  await syncRuntimeSnapshot(payload);

  return NextResponse.json({ ok: true });
}
