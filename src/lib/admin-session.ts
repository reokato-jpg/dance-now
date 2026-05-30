/**
 * Stateless signed session for admin auth.
 * Uses Web Crypto API — compatible with both Edge Runtime (middleware) and Node.js (API routes).
 *
 * Cookie format: `${token}|${expiresAt}|${hmacHex}`
 *   token     – 64-char hex (32 random bytes)
 *   expiresAt – Unix ms string
 *   hmacHex   – HMAC-SHA256(ADMIN_SESSION_SECRET, token + "|" + expiresAt)
 *
 * Invalidate all sessions by rotating ADMIN_SESSION_SECRET in Vercel env.
 */

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// ---------------------------------------------------------------------------
// Low-level Web Crypto helpers (no Node.js "crypto" import needed)
// ---------------------------------------------------------------------------

async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createSessionCookie(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET not set");

  const token = randomHex(32);
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const hmac = await hmacSha256Hex(secret, `${token}|${expiresAt}`);
  return `${token}|${expiresAt}|${hmac}`;
}

export async function verifySessionCookie(value: string): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;

  // No secret configured → dev-only fallback (plain "authenticated" string)
  if (!secret) return value === "authenticated";

  try {
    const idx1 = value.indexOf("|");
    const idx2 = value.lastIndexOf("|");
    if (idx1 === -1 || idx1 === idx2) return false;

    const token = value.slice(0, idx1);
    const expiresAtStr = value.slice(idx1 + 1, idx2);
    const hmac = value.slice(idx2 + 1);

    if (Date.now() > Number(expiresAtStr)) return false;

    const expected = await hmacSha256Hex(secret, `${token}|${expiresAtStr}`);
    return timingSafeEqual(hmac, expected);
  } catch {
    return false;
  }
}

/**
 * Server-side admin guard for /api/admin/* route handlers.
 * Dynamic-imports next/headers so this file stays Edge-compatible for middleware.
 */
export async function requireAdmin(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const value = store.get("admin_session")?.value ?? "";
  return verifySessionCookie(value);
}
