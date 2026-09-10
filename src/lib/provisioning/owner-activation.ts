import { AppError } from '@/lib/app-error';
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { assertClubCode, hashActivationToken } from './contract';
import { activateProvisionedOwner } from '@/repositories/owner-activation-repository';

export async function activateOwner(input: { clubCode: string; token: string; password: string }) {
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`Mật khẩu cần tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`, 400);
  }
  if (!input.token || input.token.length > 512) throw new AppError('Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.', 400);
  try {
    const result = await activateProvisionedOwner({
      clubCode: assertClubCode(input.clubCode),
      activationTokenHash: hashActivationToken(input.token),
      passwordHash: await hashPassword(input.password)
    });
    if (!result) throw new Error('activation rejected');
    return result;
  } catch (error) {
    if (error instanceof AppError && error.message.startsWith('Mật khẩu')) throw error;
    throw new AppError('Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.', 400);
  }
}
