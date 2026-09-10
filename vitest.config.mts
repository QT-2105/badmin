import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      BADMIN_LEGACY_CLUB_ID: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      BADMIN_ALLOW_LEGACY_TENANT_FALLBACK: 'true'
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
