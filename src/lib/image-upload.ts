import { AppError } from '@/lib/app-error';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export async function readImageFileFromFormData(formData: FormData, fieldName = 'file'): Promise<{
  buffer: Buffer;
  contentType: string;
  fileName: string;
  fileSize: number;
}> {
  const file = formData.get(fieldName);
  if (!(file instanceof File)) {
    throw new AppError('Vui lòng chọn hình ảnh.');
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new AppError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new AppError('Ảnh không được vượt quá 3MB.');
  }

  const arrayBuffer = await file.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: file.type,
    fileName: file.name || 'image.webp',
    fileSize: file.size
  };
}
