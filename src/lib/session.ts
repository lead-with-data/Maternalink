import crypto from 'node:crypto';

const SECRET = process.env.JWT_SECRET || 'secure-maternalink-edge-2026-hackathon-token-key-string';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'NURSE' | 'LHW' | 'PATIENT';
  districtId: string | null;
  facilityId: string | null;
}

export function createSession(user: SessionUser): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

  // Set expiry to 7 days from now
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifySession(token: string): SessionUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null; // Signature mismatch
  }

  try {
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return {
      id: decodedPayload.id,
      name: decodedPayload.name,
      email: decodedPayload.email,
      role: decodedPayload.role,
      districtId: decodedPayload.districtId,
      facilityId: decodedPayload.facilityId,
    };
  } catch {
    return null;
  }
}
