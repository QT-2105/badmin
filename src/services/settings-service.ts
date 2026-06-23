async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallback);
  }

  return (await res.json()) as T;
}

export async function resetMatchHistory(): Promise<{ deletedMatches: number; deletedParticipants: number }> {
  const res = await fetch('/api/match-history/reset', { method: 'DELETE' });
  return readJson<{ deletedMatches: number; deletedParticipants: number }>(res, 'Không thể xóa lịch sử trận đấu');
}

export async function deleteAllPlayerImages(): Promise<{ deletedImages: number }> {
  const res = await fetch('/api/settings/player-images', { method: 'DELETE' });
  return readJson<{ deletedImages: number }>(res, 'Không thể xóa dữ liệu hình ảnh người chơi');
}
