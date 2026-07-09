import { describe, expect, it } from 'vitest';
import { formatINR, parseINR, sumPaise } from '../utils/currency';

describe('currency utilities', () => {
  it('formats paise as INR with rupees precision', () => {
    expect(formatINR(123450)).toBe('₹1,234.50');
  });

  it('parses numeric input to paise', () => {
    expect(parseINR('1,234.50')).toBe(123450);
    expect(parseINR('1000')).toBe(100000);
  });

  it('sums paise values safely', () => {
    expect(sumPaise([100000, 250000, 125000])).toBe(475000);
  });
});
