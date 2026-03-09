import { describe, it, expect } from 'vitest';
import {
  detectCardBrand,
  formatCardNumber,
  validateLuhn,
  validateExpiry,
  formatExpiry,
  formatCurrency,
} from '../../utils/card.utils';

describe('detectCardBrand', () => {
  it('returns "unknown" for empty string', () => {
    expect(detectCardBrand('')).toBe('unknown');
  });

  it('returns "visa" for numbers starting with 4', () => {
    expect(detectCardBrand('4')).toBe('visa');
    expect(detectCardBrand('4111111111111111')).toBe('visa');
    expect(detectCardBrand('4 111 1111 1111 1111')).toBe('visa');
  });

  it('returns "mastercard" for 51-55 prefixes', () => {
    expect(detectCardBrand('5111111111111111')).toBe('mastercard');
    expect(detectCardBrand('5211111111111111')).toBe('mastercard');
    expect(detectCardBrand('5511111111111111')).toBe('mastercard');
  });

  it('returns "mastercard" for 2221-2720 range (4-digit prefix)', () => {
    expect(detectCardBrand('2221000000000000')).toBe('mastercard');
    expect(detectCardBrand('2500000000000000')).toBe('mastercard');
    expect(detectCardBrand('2720000000000000')).toBe('mastercard');
  });

  it('returns "unknown" for prefix 56-59 (not mastercard)', () => {
    expect(detectCardBrand('5611111111111111')).toBe('unknown');
  });

  it('returns "unknown" for prefix outside 2221-2720', () => {
    expect(detectCardBrand('2220000000000000')).toBe('unknown');
    expect(detectCardBrand('2721000000000000')).toBe('unknown');
  });

  it('returns "unknown" for unrecognised prefixes', () => {
    expect(detectCardBrand('6011111111111117')).toBe('unknown');
    expect(detectCardBrand('9')).toBe('unknown');
  });

  it('returns "unknown" for fewer than 4 non-visa/mc digits', () => {
    expect(detectCardBrand('222')).toBe('unknown');
  });
});

describe('formatCardNumber', () => {
  it('formats a 16-digit number with spaces every 4 digits', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatCardNumber('4111-1111-1111-1111')).toBe('4111 1111 1111 1111');
  });

  it('limits output to 16 digits', () => {
    expect(formatCardNumber('41111111111111119')).toBe('4111 1111 1111 1111');
  });

  it('returns empty string for empty input', () => {
    expect(formatCardNumber('')).toBe('');
  });

  it('handles partial numbers correctly', () => {
    expect(formatCardNumber('4111')).toBe('4111');
    expect(formatCardNumber('41111111')).toBe('4111 1111');
    expect(formatCardNumber('411111111111')).toBe('4111 1111 1111');
  });
});

describe('validateLuhn', () => {
  it('returns true for a valid Luhn number', () => {
    expect(validateLuhn('4111111111111111')).toBe(true);
    expect(validateLuhn('5500005555555559')).toBe(true);
  });

  it('returns false for an invalid Luhn number', () => {
    expect(validateLuhn('4111111111111112')).toBe(false);
  });

  it('returns false for numbers shorter than 13 digits', () => {
    expect(validateLuhn('411111111111')).toBe(false);
  });

  it('returns false for numbers longer than 19 digits', () => {
    expect(validateLuhn('41111111111111111111')).toBe(false);
  });

  it('handles spaces in the number', () => {
    expect(validateLuhn('4111 1111 1111 1111')).toBe(true);
  });
});

describe('validateExpiry', () => {
  it('returns false for month 0 (below range)', () => {
    expect(validateExpiry('00', '30')).toBe(false);
  });

  it('returns false for month 13 (above range)', () => {
    expect(validateExpiry('13', '30')).toBe(false);
  });

  it('returns false for year before 2024', () => {
    expect(validateExpiry('12', '23')).toBe(false);
  });

  it('returns false for an expired card', () => {
    expect(validateExpiry('01', '24')).toBe(false);
  });

  it('returns true for a clearly future expiry', () => {
    expect(validateExpiry('12', '99')).toBe(true);
  });

  it('returns true for a valid future month and year', () => {
    expect(validateExpiry('06', '30')).toBe(true);
  });
});

describe('formatExpiry', () => {
  it('returns raw digits when fewer than 3 digits', () => {
    expect(formatExpiry('1')).toBe('1');
    expect(formatExpiry('12')).toBe('12');
  });

  it('inserts slash after 2 digits when 3 or more digits present', () => {
    expect(formatExpiry('123')).toBe('12/3');
    expect(formatExpiry('1230')).toBe('12/30');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatExpiry('12/30')).toBe('12/30');
  });

  it('limits output to 4 digits (MM/YY)', () => {
    expect(formatExpiry('123456')).toBe('12/34');
  });

  it('returns empty string for empty input', () => {
    expect(formatExpiry('')).toBe('');
  });
});

describe('formatCurrency', () => {
  it('returns a non-empty string for a positive amount', () => {
    const result = formatCurrency(100000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the numeric value in the formatted string', () => {
    // 100000 cents = 1000 COP; the string must contain "1" and "000"
    const result = formatCurrency(100000);
    expect(result).toMatch(/1[.,\s]?000/);
  });

  it('formats zero without throwing', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0/);
  });

  it('formats large amounts', () => {
    const result = formatCurrency(500000000);
    expect(result).toMatch(/\d/);
    expect(result.length).toBeGreaterThan(0);
  });
});
