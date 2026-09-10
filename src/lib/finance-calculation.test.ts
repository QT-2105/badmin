import { describe, expect, it } from 'vitest';

import {
  getFinanceTotals,
  getSignedAmount,
  normalizeAdjustmentType
} from './finance-calculation';

describe('finance calculation', () => {
  it('normalizes unknown adjustment values to NORMAL', () => {
    expect(normalizeAdjustmentType('DEDUCTION')).toBe('DEDUCTION');
    expect(normalizeAdjustmentType('normal')).toBe('NORMAL');
    expect(normalizeAdjustmentType(null)).toBe('NORMAL');
  });

  it('keeps stored money positive and applies deduction only while totaling', () => {
    expect(getSignedAmount(100000, 'NORMAL')).toBe(100000);
    expect(getSignedAmount(100000, 'DEDUCTION')).toBe(-100000);
  });

  it('totals income and expense independently with adjustment semantics', () => {
    expect(getFinanceTotals([
      { transactionType: 'INCOME', adjustmentType: 'NORMAL', totalAmount: 500000 },
      { transactionType: 'INCOME', adjustmentType: 'DEDUCTION', totalAmount: 50000 },
      { transactionType: 'EXPENSE', adjustmentType: 'NORMAL', totalAmount: 200000 },
      { transactionType: 'EXPENSE', adjustmentType: 'DEDUCTION', totalAmount: 25000 }
    ])).toEqual({ income: 450000, expense: 175000 });
  });
});
