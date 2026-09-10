import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ searchLoginVisibleClubs: vi.fn() }));

vi.mock('@/repositories/control-club-repository', () => ({
  searchLoginVisibleClubs: mocks.searchLoginVisibleClubs
}));

import { GET } from './route';

describe('GET /api/public/clubs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns only public code and name fields', async () => {
    mocks.searchLoginVisibleClubs.mockResolvedValue([{
      id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'ACTIVE'
    }]);
    const response = await GET(new Request('http://localhost/api/public/clubs?q=TT'));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      clubs: [{ code: 'tt-badminton', name: 'TT Badminton' }]
    });
    expect(mocks.searchLoginVisibleClubs).toHaveBeenCalledWith('TT');
  });
});
