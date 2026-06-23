import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import { createImageKey, deleteS3Object, listS3ObjectKeysByPrefix, uploadS3Object } from '@/lib/s3-storage';

export async function uploadPlayerAvatar(input: {
  playerId: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
  fileSize: number;
}): Promise<{ avatarUrl: string | null; avatarS3Key: string | null }> {
  const player = await prisma.session_players.findUnique({ where: { id: input.playerId } });
  if (!player) throw new AppError('Không tìm thấy người chơi.', 404);

  const key = createImageKey(`avatar_player/session_${player.session_id}/player_${player.id}`, input.fileName);
  const uploaded = await uploadS3Object({
    key,
    body: input.buffer,
    contentType: input.contentType
  });

  await prisma.$transaction(async (tx) => {
    await tx.session_player_images.updateMany({
      where: { session_player_id: input.playerId, status: 'ACTIVE' },
      data: { status: 'REPLACED', updated_at: new Date() }
    });
    await tx.session_player_images.create({
      data: {
        session_player_id: input.playerId,
        s3_key: uploaded.key,
        public_url: uploaded.publicUrl,
        file_name: input.fileName,
        content_type: input.contentType,
        file_size: input.fileSize,
        status: 'ACTIVE'
      }
    });
    await tx.session_players.update({
      where: { id: input.playerId },
      data: {
        avatar_s3_key: uploaded.key,
        avatar_url: uploaded.publicUrl,
        avatar_updated_at: new Date()
      }
    });
  });

  if (player.avatar_s3_key && player.avatar_s3_key !== uploaded.key) {
    await deleteS3Object(player.avatar_s3_key).catch(() => undefined);
  }

  return {
    avatarUrl: uploaded.publicUrl,
    avatarS3Key: uploaded.key
  };
}

export async function deletePlayerAvatar(playerId: string): Promise<{ avatarUrl: null; avatarS3Key: null }> {
  const player = await prisma.session_players.findUnique({ where: { id: playerId } });
  if (!player) throw new AppError('Không tìm thấy người chơi.', 404);

  if (player.avatar_s3_key) {
    await deleteS3Object(player.avatar_s3_key);
  }

  await prisma.$transaction(async (tx) => {
    await tx.session_player_images.updateMany({
      where: { session_player_id: playerId, status: 'ACTIVE' },
      data: { status: 'DELETED', updated_at: new Date() }
    });
    await tx.session_players.update({
      where: { id: playerId },
      data: {
        avatar_s3_key: null,
        avatar_url: null,
        avatar_updated_at: new Date()
      }
    });
  });

  return {
    avatarUrl: null,
    avatarS3Key: null
  };
}

export async function deleteAllPlayerImages(): Promise<{ deletedImages: number }> {
  const [prefixKeys, playersWithAvatar] = await Promise.all([
    listS3ObjectKeysByPrefix('avatar_player/'),
    prisma.session_players.findMany({
      where: { avatar_s3_key: { not: null } },
      select: { avatar_s3_key: true }
    })
  ]);

  const s3Keys = new Set(prefixKeys);
  playersWithAvatar.forEach((player) => {
    if (player.avatar_s3_key?.startsWith('avatar_player/')) s3Keys.add(player.avatar_s3_key);
  });

  for (const key of s3Keys) {
    await deleteS3Object(key);
  }

  await prisma.$transaction(async (tx) => {
    await tx.session_player_images.deleteMany();
    await tx.session_players.updateMany({
      data: {
        avatar_s3_key: null,
        avatar_url: null,
        avatar_updated_at: new Date()
      }
    });
  });

  return { deletedImages: s3Keys.size };
}
