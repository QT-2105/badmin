import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { RuntimeVersionConflictError, getRuntimeSnapshot, syncRuntimeSnapshot } from '@/repositories/runtime-snapshot-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, 'session.view');
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') ?? undefined;
    const snapshot = await getRuntimeSnapshot(sessionId);

    return NextResponse.json(snapshot);
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải snapshot điều phối');
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission(request, 'session.operate');
    const payload = await request.json();
    const version = await syncRuntimeSnapshot(payload);

    return NextResponse.json({ ok: true, version });
  } catch (error) {
    if (error instanceof RuntimeVersionConflictError) {
      return NextResponse.json(
        { error: error.message, currentVersion: error.currentVersion },
        { status: 409 }
      );
    }
    return authErrorResponse(error) ?? apiError(error, 'Không thể lưu snapshot điều phối');
  }
}
