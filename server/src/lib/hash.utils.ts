import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function generateHash(str: string) {
  const strHash = await bcrypt.hash(str, 10);
  return strHash;
}

export function compareHash(str: string, hash: string) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(str, hash, function (err, isMatch) {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
}

/**
 * Hash a plaintext OTP for secure storage / lookup.
 * Uses SHA-256 — deterministic (no salt) so the hash can be looked up
 * directly in the DB. OTPs are short-lived (10 min) and low-entropy by
 * design; bcrypt is unnecessary here.
 */
export function hashOtp(plainOtp: string): string {
  return crypto.createHash('sha256').update(plainOtp).digest('hex');
}
