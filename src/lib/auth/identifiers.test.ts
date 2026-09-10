import { describe, expect, it } from 'vitest';

import { classifyLoginIdentifier, normalizeAuthIdentifiers, normalizePhone } from './identifiers';

describe('auth identifiers', () => {
  it('normalizes username and email independently', () => {
    expect(normalizeAuthIdentifiers({ username: ' Operator_01 ', email: ' OWNER@Example.COM ' })).toMatchObject({
      username: 'Operator_01',
      usernameNormalized: 'operator_01',
      email: 'owner@example.com',
      emailNormalized: 'owner@example.com'
    });
  });

  it('normalizes Vietnamese local and country-code phone to one key', () => {
    expect(normalizePhone('+84 912-345-678')?.normalized).toBe('0912345678');
    expect(normalizePhone('0912 345 678')?.normalized).toBe('0912345678');
  });

  it('classifies login without ambiguous cross-type OR lookup', () => {
    expect(classifyLoginIdentifier('Owner@Example.com')).toEqual({ kind: 'email', normalized: 'owner@example.com' });
    expect(classifyLoginIdentifier('+84 912 345 678')).toEqual({ kind: 'phone', normalized: '0912345678' });
    expect(classifyLoginIdentifier('Operator_01')).toEqual({ kind: 'username', normalized: 'operator_01' });
  });

  it('maps the old single login value to username compatibility', () => {
    expect(normalizeAuthIdentifiers({ legacyLogin: 'operator01' })).toMatchObject({
      username: 'operator01',
      usernameNormalized: 'operator01',
      email: null,
      phone: null
    });
  });
});
