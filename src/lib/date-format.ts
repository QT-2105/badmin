export function toDateInput(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function toTimeInput(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(11, 16);
  }
  const match = String(value).match(/\d{1,2}:\d{2}/);
  return match ? match[0].padStart(5, '0') : '';
}

export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function todayDateInput(timeZone = 'Asia/Ho_Chi_Minh'): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

export function isPastDateInput(value: string, today = todayDateInput()): boolean {
  return Boolean(value) && value < today;
}

export function parseTimeInput(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

export function formatPlayDateTitle(value: string): string {
  const date = parseDateInput(value);
  if (Number.isNaN(date.getTime())) return value;

  const weekdayLabels = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return `${weekdayLabels[date.getUTCDay()]} | ${value}`;
}

export function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString('vi-VN');
}
