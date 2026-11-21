import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from './types.ts';

const RUNTIME_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  return envSecret && envSecret.length >= 16 ? envSecret : RUNTIME_FALLBACK_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

export function verifyTimingSafeString(input: string, expected: string): boolean {
  const a = Buffer.from(input, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    // Compare dummy equal-length buffer to keep timing constant
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export interface SessionPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number;
}

export function signSessionToken(payload: Omit<SessionPayload, 'exp'>, ttlSeconds = 60 * 60 * 24 * 7): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(encoded).digest('base64url');
  if (!verifyTimingSafeString(sig, expectedSig)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.sub || !parsed.role || !parsed.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  authUser?: SessionPayload;
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    const payload = verifySessionToken(token);
    if (payload) {
      req.authUser = payload;
    }
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification requise.' });
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session invalide ou expirée.' });
    return;
  }
  req.authUser = payload;
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.authUser || (req.authUser.role !== 'admin' && req.authUser.role !== 'manager')) {
      res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
      return;
    }
    next();
  });
}

// Sliding-window rate limiter per IP + route bucket
const rateBuckets = new Map<string, number[]>();

export function rateLimit(bucket: string, maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const timestamps = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      res.status(429).json({
        error: 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.',
      });
      return;
    }
    timestamps.push(now);
    rateBuckets.set(key, timestamps);
    next();
  };
}
