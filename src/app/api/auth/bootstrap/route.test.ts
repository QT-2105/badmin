import { describe, expect, it } from 'vitest';

import { GET, POST } from './route';

describe('global bootstrap retirement', () => {
  it('always reports provisioning as the only supported owner creation path', async () => {
    const response = await GET();
    await expect(response.json()).resolves.toEqual({ needsBootstrap: false, provisioningRequired: true });
  });

  it('rejects global OWNER creation without reading request credentials', async () => {
    const response = await POST();
    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: 'Khởi tạo OWNER toàn cục đã bị vô hiệu hóa. Vui lòng sử dụng quy trình đăng ký và kích hoạt CLB.'
    });
  });
});
