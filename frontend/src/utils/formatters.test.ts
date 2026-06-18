import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatDate, today, startOfMonth, endOfMonth } from './formatters';

describe('formatters', () => {
  describe('formatNumber', () => {
    it('formats with 1 decimal by default', () => {
      expect(formatNumber(100.5)).toBe('100.5');
    });

    it('formats with specified decimals', () => {
      expect(formatNumber(100.123, 2)).toBe('100.12');
    });

    it('pads with zeros', () => {
      expect(formatNumber(100, 1)).toBe('100.0');
    });
  });

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const result = formatDate('2026-06-15');
      expect(result).toContain('Jun');
      expect(result).toContain('2026');
    });
  });

  describe('today', () => {
    it('returns ISO date format', () => {
      const t = today();
      expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t).toBe(new Date().toISOString().split('T')[0]);
    });
  });

  describe('startOfMonth / endOfMonth', () => {
    it('returns first day of month', () => {
      const start = startOfMonth(new Date('2026-06-15'));
      expect(start).toBe('2026-06-01');
    });

    it('returns last day of month', () => {
      const end = endOfMonth(new Date('2026-06-15'));
      expect(end).toBe('2026-06-30');
    });

    it('handles months with 31 days', () => {
      const end = endOfMonth(new Date('2026-01-01'));
      expect(end).toBe('2026-01-31');
    });

    it('handles February in non-leap year', () => {
      const end = endOfMonth(new Date('2026-02-01'));
      expect(end).toBe('2026-02-28');
    });
  });
});
