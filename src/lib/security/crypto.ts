// AES-256-GCM helpers for at-rest encryption of OAuth refresh tokens.
// Key source: SESSION_ENC_KEY env var (32 raw bytes, base64-encoded).
//
//   openssl rand -base64 32   ← generates a fresh key
//
// If SESSION_ENC_KEY is not set, encryption is intentionally disabled and
// callers will throw — we do NOT silently fall back to plaintext storage.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const raw = process.env.SESSION_ENC_KEY
  if (!raw) throw new Error("SESSION_ENC_KEY missing — refusing to handle secrets")
  const buf = Buffer.from(raw, "base64")
  if (buf.length !== 32) throw new Error("SESSION_ENC_KEY must decode to 32 bytes")
  cachedKey = buf
  return buf
}

// Returns "v1:<iv_b64>:<ciphertext_b64>:<tag_b64>"
export function encryptString(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString("base64")}:${ct.toString("base64")}:${tag.toString("base64")}`
}

export function decryptString(payload: string): string {
  const key = getKey()
  const parts = payload.split(":")
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("bad ciphertext format")
  const iv  = Buffer.from(parts[1], "base64")
  const ct  = Buffer.from(parts[2], "base64")
  const tag = Buffer.from(parts[3], "base64")
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const pt = Buffer.concat([decipher.update(ct), decipher.final()])
  return pt.toString("utf8")
}
