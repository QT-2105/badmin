import { describe, expect, it } from 'vitest';

import {
  isRuntimeActiveStatus,
  isRuntimeReadonlyStatus,
  normalizeSessionStatus,
  toDatabaseSessionStatus
} from './session-status';

describe('session runtime status contract', () => {
  it('normalizes current and legacy database values', () => {
    expect(normalizeSessionStatus('NOT_STARTED')).toBe('PENDING');
    expect(normalizeSessionStatus('LIVE')).toBe('ACTIVE');
    expect(normalizeSessionStatus('IN_PROGRESS')).toBe('ACTIVE');
    expect(normalizeSessionStatus('FINISHED')).toBe('COMPLETED');
    expect(normalizeSessionStatus('CANCELLED')).toBe('CANCELLED');
  });

  it('marks only completed and cancelled sessions as runtime readonly', () => {
    expect(isRuntimeReadonlyStatus('COMPLETED')).toBe(true);
    expect(isRuntimeReadonlyStatus('FINISHED')).toBe(true);
    expect(isRuntimeReadonlyStatus('CANCELLED')).toBe(true);
    expect(isRuntimeReadonlyStatus('LIVE')).toBe(false);
    expect(isRuntimeReadonlyStatus('NOT_STARTED')).toBe(false);
  });

  it('keeps active detection and database status mapping stable', () => {
    expect(isRuntimeActiveStatus('LIVE')).toBe(true);
    expect(isRuntimeActiveStatus('FINISHED')).toBe(false);
    expect(toDatabaseSessionStatus('PENDING')).toBe('NOT_STARTED');
    expect(toDatabaseSessionStatus('ACTIVE')).toBe('LIVE');
    expect(toDatabaseSessionStatus('COMPLETED')).toBe('FINISHED');
  });
});
