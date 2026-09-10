import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import { createTenantImageKey, deleteS3Object, uploadS3Object } from '@/lib/s3-storage';
import { requireTenantContext } from '@/lib/tenant-context';

export async function uploadPlayerAvatar(input: {
  playerId: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
  fileSize: number;
}): Promise<{ avatarUrl: string | null; avatarS3Key: string | null }> {
  const { clubId } = requireTenantContext('player_image.create');
  const player = await prisma.session_players.findUnique({ where: { id: input.playerId, club_id: clubId } });
  if (!player) throw new AppError('Không tìm thấy người chơi.', 404);

  const key = createTenantImageKey(clubId, `avatar_player/session_${player.session_id}/player_${player.id}`, input.fileName);
  const uploaded = await uploadS3Object({
    key,
    body: input.buffer,
    contentType: input.contentType
  });

  await prisma.$transaction(async (tx) => {
    await tx.session_player_images.updateMany({
      where: { session_player_id: input.playerId, club_id: clubId, status: 'ACTIVE' },
      data: { status: 'REPLACED', updated_at: new Date() }
    });
    await tx.session_player_images.create({
      data: {
        club_id: clubId,
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
      where: { id: input.playerId, club_id: clubId },
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
  const { clubId } = requireTenantContext('player_image.delete');
  const player = await prisma.session_players.findUnique({ where: { id: playerId, club_id: clubId } });
  if (!player) throw new AppError('Không tìm thấy người chơi.', 404);

  if (player.avatar_s3_key) {
    await deleteS3Object(player.avatar_s3_key);
  }

  await prisma.$transaction(async (tx) => {
    await tx.session_player_images.updateMany({
      where: { session_player_id: playerId, club_id: clubId, status: 'ACTIVE' },
      data: { status: 'DELETED', updated_at: new Date() }
    });
    await tx.session_players.update({
      where: { id: playerId, club_id: clubId },
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
  const { clubId } = requireTenantContext('player_image.delete_all');
  const playersWithAvatar = await prisma.session_players.findMany({
    where: { club_id: clubId, avatar_s3_key: { not: null } },
    select: { avatar_s3_key: true }
  });

  const s3Keys = new Set<string>();
  playersWithAvatar.forEach((player) => {
    if (player.avatar_s3_key) s3Keys.add(player.avatar_s3_key);
  });

  for (const key of s3Keys) {
    await deleteS3Object(key);
  }

  await prisma.$transaction(async (tx) => {
    await tx.session_player_images.deleteMany({ where: { club_id: clubId } });
    await tx.session_players.updateMany({
      where: { club_id: clubId },
      data: {
        avatar_s3_key: null,
        avatar_url: null,
        avatar_updated_at: new Date()
      }
    });
  });

  return { deletedImages: s3Keys.size };
}
