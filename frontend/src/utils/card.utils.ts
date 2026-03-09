import { CardBrand } from '../types';

/**
 * Detecta si una tarjeta es VISA o Mastercard según su número.
 */
export function detectCardBrand(number: string): CardBrand {
  const cleaned = number.replace(/\D/g, '');

  if (cleaned.length === 0) return 'unknown';
  
  if (/^4/.test(cleaned)) return 'visa';
  
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  
  if (cleaned.length >= 4) {
    const prefix = parseInt(cleaned.substring(0, 4), 10);
    if (prefix >= 2221 && prefix <= 2720) return 'mastercard';
  }

  return 'unknown';
}

/**
 * Formatea el número de tarjeta con espacios cada 4 dígitos.
 * "4111111111111111" → "4111 1111 1111 1111"
 *
 */
export function formatCardNumber(value: string): string {

  const digits = value.replace(/\D/g, '');
  
  const limited = digits.slice(0, 16);
  
  const groups = limited.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

/**
 * Valida el número de tarjeta con el algoritmo de Luhn.
 */
export function validateLuhn(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Verifica que la tarjeta no esté vencida.
 *
 * @param month - mes en formato "MM" (ej: "12")
 * @param year  - año en formato "YY" (ej: "28") → lo convertimos a "2028"
 */
export function validateExpiry(month: string, year: string): boolean {
  const m = parseInt(month, 10);
  const y = parseInt(`20${year}`, 10);
  
  if (m < 1 || m > 12) return false;
  
  if (isNaN(y) || y < 2024) return false;

  const now = new Date();
  
  const expiryDate = new Date(y, m, 0);

  return expiryDate >= now;
}

/**
 * Formatea la fecha de vencimiento mientras el usuario escribe.
 */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return digits;
}

/**
 * Convierte centavos a pesos colombianos formateados.
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}