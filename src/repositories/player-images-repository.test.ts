import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  playerFindUnique: vi.fn(),
  playerFindMany: vi.fn(),
  transaction: vi.fn(),
  imageUpdateMany: vi.fn(),
  imageCreate: vi.fn(),
  imageDeleteMany: vi.fn(),
  playerUpdate: vi.fn(),
  playerUpdateMany: vi.fn(),
  listS3ObjectKeysByPrefix: vi.fn(),
  deleteS3Object: vi.fn(),
  createTenantImageKey: vi.fn(),
  uploadS3Object: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session_players: {
      findUnique: mocks.playerFindUnique,
      findMany: mocks.playerFindMany
    },
    $transaction: mocks.transaction
  }
}));
vi.mock('@/lib/s3-storage', () => ({
  createTenantImageKey: mocks.createTenantImageKey,
  uploadS3Object: mocks.uploadS3Object,
  listS3ObjectKeysByPrefix: mocks.listS3ObjectKeysByPrefix,
  deleteS3Object: mocks.deleteS3Object
}));

import { deleteAllPlayerImages, deletePlayerAvatar, uploadPlayerAvatar } from './player-images-repository';

describe('player image destructive operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteS3Object.mockResolvedValue(undefined);
    mocks.imageUpdateMany.mockResolvedValue({ count: 1 });
    mocks.imageCreate.mockResolvedValue({});
    mocks.imageDeleteMany.mockResolvedValue({ count: 1 });
    mocks.playerUpdate.mockResolvedValue({});
    mocks.playerUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      session_player_images: {
        updateMany: mocks.imageUpdateMany,
        create: mocks.imageCreate,
        deleteMany: mocks.imageDeleteMany
      },
      session_players: {
        update: mocks.playerUpdate,
        updateMany: mocks.playerUpdateMany
      }
    }));
  });

  it('writes Legacy Club ID to a newly uploaded player image record', async () => {
    mocks.playerFindUnique.mockResolvedValue({
      id: 'player-1', session_id: 'session-1', avatar_s3_key: null
    });
    mocks.createTenantImageKey.mockReturnValue('avatar_player/new.webp');
    mocks.uploadS3Object.mockResolvedValue({
      key: 'avatar_player/new.webp',
      publicUrl: 'https://cdn.example/new.webp'
    });

    await uploadPlayerAvatar({
      playerId: 'player-1',
      buffer: Buffer.from('avatar'),
      contentType: 'image/webp',
      fileName: 'avatar.webp',
      fileSize: 6
    });

    expect(mocks.imageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        session_player_id: 'player-1'
      })
    });
    expect(mocks.playerFindUnique).toHaveBeenCalledWith({
      where: { id: 'player-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
    expect(mocks.createTenantImageKey).toHaveBeenCalledWith(
      'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      'avatar_player/session_session-1/player_player-1',
      'avatar.webp'
    );
  });

  it('rejects an unknown player without touching S3 or starting a transaction', async () => {
    mocks.playerFindUnique.mockResolvedValue(null);

    await expect(deletePlayerAvatar('missing-player')).rejects.toMatchObject({
      message: 'Không tìm thấy người chơi.',
      status: 404
    });
    expect(mocks.deleteS3Object).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('deletes the stored avatar before marking its active image deleted and clearing player references', async () => {
    mocks.playerFindUnique.mockResolvedValue({
      id: 'player-1',
      session_id: 'session-1',
      avatar_s3_key: 'avatar_player/session_1/player_1/old.webp'
    });

    await expect(deletePlayerAvatar('player-1')).resolves.toEqual({
      avatarUrl: null,
      avatarS3Key: null
    });

    expect(mocks.deleteS3Object).toHaveBeenCalledWith('avatar_player/session_1/player_1/old.webp');
    expect(mocks.imageUpdateMany).toHaveBeenCalledWith({
      where: {
        session_player_id: 'player-1',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        status: 'ACTIVE'
      },
      data: { status: 'DELETED', updated_at: expect.any(Date) }
    });
    expect(mocks.playerUpdate).toHaveBeenCalledWith({
      where: { id: 'player-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: {
        avatar_s3_key: null,
        avatar_url: null,
        avatar_updated_at: expect.any(Date)
      }
    });
    expect(mocks.deleteS3Object.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.transaction.mock.invocationCallOrder[0]
    );
  });

  it('clears database references without an S3 call when the player has no stored key', async () => {
    mocks.playerFindUnique.mockResolvedValue({
      id: 'player-1', session_id: 'session-1', avatar_s3_key: null
    });

    await deletePlayerAvatar('player-1');

    expect(mocks.deleteS3Object).not.toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.playerUpdate).toHaveBeenCalledOnce();
  });

  it('deletes only the keys referenced by current-tenant players and then clears scoped records', async () => {
    mocks.playerFindMany.mockResolvedValue([
      { avatar_s3_key: 'avatar_player/shared.webp' },
      { avatar_s3_key: 'avatar_player/db.webp' },
      { avatar_s3_key: 'other/foreign.webp' }
    ]);

    await expect(deleteAllPlayerImages()).resolves.toEqual({ deletedImages: 3 });

    expect(mocks.deleteS3Object.mock.calls.map(([key]) => key)).toEqual([
      'avatar_player/shared.webp',
      'avatar_player/db.webp',
      'other/foreign.webp'
    ]);
    expect(mocks.playerFindMany).toHaveBeenCalledWith({
      where: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        avatar_s3_key: { not: null }
      },
      select: { avatar_s3_key: true }
    });
    expect(mocks.imageDeleteMany).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
    expect(mocks.playerUpdateMany).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: {
        avatar_s3_key: null,
        avatar_url: null,
        avatar_updated_at: expect.any(Date)
      }
    });
  });

  it('does not mutate image records when an S3 deletion fails', async () => {
    mocks.playerFindMany.mockResolvedValue([{ avatar_s3_key: 'avatar_player/a.webp' }]);
    mocks.deleteS3Object.mockRejectedValue(new Error('S3 unavailable'));

    await expect(deleteAllPlayerImages()).rejects.toThrow('S3 unavailable');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
