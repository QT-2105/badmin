import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { RuntimeVersionConflictError, getRuntimeSnapshot, syncRuntimeSnapshot } from '@/repositories/runtime-snapshot-repository';
import { AppError } from '@/lib/app-error';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') ?? undefined;
    await requireApiPermission(request, 'session.view', {
      feature: 'session.runtime',
      activeSessionId: sessionId,
      allowActiveSessionContinuation: true
    });
    const snapshot = await getRuntimeSnapshot(sessionId);
    if (sessionId && !snapshot.session) throw new AppError('Không tìm thấy ca điều phối.', 404);

    return NextResponse.json(snapshot);
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải snapshot điều phối');
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await requireApiPermission(request, 'session.operate', {
      feature: 'session.runtime',
      activeSessionId: payload?.sessionId,
      allowActiveSessionContinuation: true
    });
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
