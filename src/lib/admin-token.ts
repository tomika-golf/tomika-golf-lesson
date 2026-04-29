const ALGO = { name: 'HMAC', hash: 'SHA-256' } as const;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALGO,
    false,
    ['sign', 'verify']
  );
}

export async function signAdminToken(username: string, role: string): Promise<string> {
  const secret = process.env.ADMIN_SECRET!;
  const payload = btoa(JSON.stringify({ u: username, r: role, e: Date.now() + TTL_MS }));
  const key = await getKey(secret);
  const buf = await crypto.subtle.sign(ALGO.name, key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${payload}.${hex}`;
}

export async function getAdminTokenRole(token: string): Promise<string | null> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, hex] = parts;
  try {
    const sigBytes = new Uint8Array(hex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify(ALGO.name, key, sigBytes, new TextEncoder().encode(payload));
    if (!valid) return null;
    const { e, r } = JSON.parse(atob(payload));
    if (e <= Date.now()) return null;
    return r ?? 'full';
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  return (await getAdminTokenRole(token)) !== null;
}
