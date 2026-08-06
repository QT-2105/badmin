const ALLOWED_PLAYER_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_PLAYER_AVATAR_EDGE = 1024;
const MIN_PLAYER_AVATAR_EDGE = 320;

export async function preparePlayerAvatarForUpload(file: File): Promise<File> {
  if (!ALLOWED_PLAYER_IMAGE_TYPES.has(file.type)) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
  }

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('Ảnh gốc không được vượt quá 25MB.');
  }

  const image = await loadImage(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  if (file.size <= MAX_UPLOAD_IMAGE_BYTES && longestEdge <= MAX_PLAYER_AVATAR_EDGE) {
    return file;
  }

  let scale = Math.min(1, MAX_PLAYER_AVATAR_EDGE / longestEdge);
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let quality = 0.84;
  let blob = await renderWebp(image, width, height, quality);

  while (blob.size > MAX_UPLOAD_IMAGE_BYTES && quality > 0.52) {
    quality = Math.max(0.52, quality - 0.08);
    blob = await renderWebp(image, width, height, quality);
  }

  while (blob.size > MAX_UPLOAD_IMAGE_BYTES && Math.max(width, height) > MIN_PLAYER_AVATAR_EDGE) {
    scale *= 0.82;
    width = Math.max(1, Math.round(image.naturalWidth * scale));
    height = Math.max(1, Math.round(image.naturalHeight * scale));
    blob = await renderWebp(image, width, height, quality);
  }

  if (blob.size > MAX_UPLOAD_IMAGE_BYTES) {
    throw new Error('Không thể tối ưu ảnh xuống dưới 3MB. Vui lòng chọn ảnh khác.');
  }

  return new File([blob], `${fileNameWithoutExtension(file.name) || 'avatar'}.webp`, {
    type: 'image/webp',
    lastModified: Date.now()
  });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error();
    return image;
  } catch {
    throw new Error('Không thể đọc hình ảnh đã chọn.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function renderWebp(image: HTMLImageElement, width: number, height: number, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý hình ảnh.');
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('Không thể tối ưu hình ảnh đã chọn.');
  return blob;
}

function fileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim();
}
