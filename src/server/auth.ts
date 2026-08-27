import { randomBytes, scrypt, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";

const scryptAsync = promisify(scrypt);
const SESSION_COOKIE = "hw_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — required to sign session cookies.");
  return secret;
}

// scrypt (Node's built-in, no extra dependency) with a random salt per
// password, stored alongside the hash as "salt:hash" — standard practice
// since a shared/fixed salt would make identical passwords produce
// identical hashes, defeating the point of salting.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const stored_ = Buffer.from(hashHex, "hex");
  if (derived.length !== stored_.length) return false;
  return timingSafeEqual(derived, stored_);
}

// A signed, stateless session: base64url(json) + "." + HMAC-SHA256 signature.
// No session table needed — the signature is what makes a forged/tampered
// cookie unusable without knowing AUTH_SECRET.
function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionCookie(userId: string): string {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + SESSION_MAX_AGE_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifySessionToken(token: string): { uid: string } | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return { uid: payload.uid };
  } catch {
    return null;
  }
}

// No cookie-parser dependency — the incoming Cookie header is just
// "name=value; name2=value2", cheap enough to parse inline.
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export function getUserIdFromRequest(req: Request): string | null {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  return verifySessionToken(token)?.uid ?? null;
}

export function setSessionCookie(res: Response, userId: string) {
  res.cookie(SESSION_COOKIE, createSessionCookie(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE);
}
