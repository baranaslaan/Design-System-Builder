// Shared OAuth helpers used by the /api/figma/* route handlers.
//
// Figma OAuth2 flow:
//   Auth URL:   https://www.figma.com/oauth
//   Token URL:  https://api.figma.com/v1/oauth/token        (PKCE, client_secret optional)
//   Scopes:     "file_variables:read file_variables:write"
//
// We persist ONLY the refresh_token (server-side, httpOnly cookie). The short-lived
// access token is exchanged on demand by /api/figma/proxy and cached in a separate
// short-TTL cookie so we don't refresh on every call.

export const FIGMA_AUTH_URL  = "https://www.figma.com/oauth"
export const FIGMA_TOKEN_URL = "https://api.figma.com/v1/oauth/token"
export const FIGMA_SCOPES    = "file_variables:read file_variables:write files:read"

export const COOKIE_REFRESH  = "fg_rt"
export const COOKIE_ACCESS   = "fg_at"
export const COOKIE_STATE    = "fg_state"

export interface FigmaTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number      // seconds
  user_id?: string
}

export function getClientCreds() {
  const id     = process.env.FIGMA_CLIENT_ID
  const secret = process.env.FIGMA_CLIENT_SECRET
  if (!id || !secret) {
    throw new Error("FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET must be set in environment.")
  }
  return { id, secret }
}

export function getRedirectUri(origin: string): string {
  return process.env.FIGMA_REDIRECT_URI ?? `${origin}/api/figma/oauth/callback`
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<FigmaTokenResponse> {
  const { id, secret } = getClientCreds()
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    redirect_uri: redirectUri,
    code,
    grant_type: "authorization_code",
  })
  const res = await fetch(FIGMA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) throw new Error(`Figma token exchange failed: ${res.status} ${await res.text()}`)
  return res.json() as Promise<FigmaTokenResponse>
}

export async function refreshAccessToken(refreshToken: string): Promise<FigmaTokenResponse> {
  const { id, secret } = getClientCreds()
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })
  const res = await fetch(FIGMA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) throw new Error(`Figma token refresh failed: ${res.status} ${await res.text()}`)
  return res.json() as Promise<FigmaTokenResponse>
}

export function randomState(bytes = 16): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("")
}
