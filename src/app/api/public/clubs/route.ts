import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { searchLoginVisibleClubs } from '@/repositories/control-club-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get('q') ?? '';
    const clubs = await searchLoginVisibleClubs(query);
    return NextResponse.json({
      clubs: clubs.map(({ code, name }) => ({ code, name }))
    });
  } catch (error) {
    return apiError(error, 'Không thể tìm CLB');
  }
}
