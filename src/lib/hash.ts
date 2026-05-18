import crypto from 'node:crypto';

const SALT = 'maternalink-edge-2026-hackathon-security-salt';

export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + SALT)
    .digest('hex');
}
