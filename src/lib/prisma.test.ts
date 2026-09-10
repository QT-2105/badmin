import { describe, expect, it } from 'vitest';

import { buildRuntimeDatabaseUrl } from './prisma';

describe('Prisma runtime database role', () => {
  it('keeps the configured connection unchanged when no effective role is requested', () => {
    const value = 'postgresql://owner:secret@example.test/neondb?sslmode=require';
    expect(buildRuntimeDatabaseUrl(value)).toBe(value);
  });

  it('adds a server-owned PostgreSQL role option without removing existing options', () => {
    const result = new URL(buildRuntimeDatabaseUrl(
      'postgresql://owner:secret@example.test/neondb?sslmode=require&options=-c%20statement_timeout%3D5000',
      'badmin_uat_app'
    ));
    expect(result.searchParams.get('sslmode')).toBe('require');
    expect(result.searchParams.get('options')).toBe('-c statement_timeout=5000 -c role=badmin_uat_app');
  });

  it('rejects invalid or duplicate role configuration', () => {
    expect(() => buildRuntimeDatabaseUrl('postgresql://owner:secret@example.test/neondb', 'owner;reset role'))
      .toThrow('BADMIN_RUNTIME_DB_ROLE không hợp lệ.');
    expect(() => buildRuntimeDatabaseUrl(
      'postgresql://owner:secret@example.test/neondb?options=-c%20role%3Dexisting',
      'badmin_uat_app'
    )).toThrow('DATABASE_URL đã cấu hình runtime role');
  });
});
