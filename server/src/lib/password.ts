const ITERATIONS = 100_000

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const b64 = (buf: ArrayBufferLike) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  return `${b64(salt.buffer)}:${b64(bits)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts.length !== 2) return false
  const [saltB64, hashB64] = parts
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0))
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const newHash = new Uint8Array(bits)
  const storedHash = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0))
  if (newHash.length !== storedHash.length) return false
  let diff = 0
  for (let i = 0; i < newHash.length; i++) diff |= newHash[i] ^ storedHash[i]
  return diff === 0
}
