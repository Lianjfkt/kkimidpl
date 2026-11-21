import { supabase } from './supabaseClient';

/**
 * Utilities for Authentication and Identifier Normalization
 */

/**
 * Normalizes any Indonesian phone number format (+62, 62, 08, 8) into a standardized internal auth email:
 * Examples:
 *  - "+62 812-3456-7890" -> "081234567890@kkidpl.com"
 *  - "6281234567890"     -> "081234567890@kkidpl.com"
 *  - "081234567890"      -> "081234567890@kkidpl.com"
 *  - "81234567890"       -> "081234567890@kkidpl.com"
 *
 * If the input is already a valid email address, it is returned trimmed.
 */
export function normalizePhoneToAuthEmail(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  // Check if already an email
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }

  // Strip all non-digit characters
  let digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('8')) {
    digits = '0' + digits;
  }

  return `${digits}@kkidpl.com`;
}

/**
 * Checks if a string is a valid phone number (Indonesian format)
 */
export function isPhoneNumber(input: string): boolean {
  const trimmed = (input || '').trim();
  if (!trimmed || trimmed.includes('@')) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Normalizes an Indonesian phone number to standard leading '0' digits (e.g. "081234567890")
 */
export function normalizePhoneDigits(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('8')) {
    digits = '0' + digits;
  }
  return digits;
}

/**
 * Returns JSON headers including caller's Bearer token for secure internal API routes
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // fallback if no session
  }
  return headers;
}
