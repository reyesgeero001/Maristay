import { createHash, randomBytes } from 'crypto';

/** bcrypt work factor (2^10 rounds) — the bcrypt default, ~70 ms per hash. */
export const BCRYPT_ROUNDS = 10;

/** Password policy shared by registration, staff creation and the seed script. */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE =
  'password must be 8–72 characters long and contain at least one letter and one number';

/**
 * Digital key credentials are 32 random bytes (256 bits of entropy), so a fast
 * SHA-256 digest is sufficient to store them safely and lets the smart-lock
 * simulation look a key up by its hash. (Low-entropy secrets like passwords
 * use bcrypt instead.)
 */
export function generateDigitalKeyCode(): string {
  return `MSK-${randomBytes(32).toString('base64url')}`;
}

export function hashDigitalKeyCode(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex');
}
