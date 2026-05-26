import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'electra_fallback_secret_key_for_development_2026'
);

/**
 * Hashes a plaintext password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plaintext password against a stored hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a payload into a JWT string using jose HS256 algorithm.
 */
export async function signJWT(payload: Record<string, any>, expiry: string = '24h'): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT string using jose and extracts the payload.
 * Returns null if validation fails.
 */
export async function verifyJWT<T extends Record<string, any>>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as T;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a user's role is permitted.
 */
export function authorizeRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}
