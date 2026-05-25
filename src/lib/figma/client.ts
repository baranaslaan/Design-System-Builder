// Browser-side Figma client. All calls route through /api/figma/proxy so the
// access token never reaches the client. Auth state is read from /api/figma/oauth/status.

import type { FigmaVariablesResponse, FigmaVariablesUpdatePayload } from "./types"

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/figma/proxy/${path}`, { ...init, credentials: "include" })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Figma API ${res.status}: ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function getConnectionStatus(): Promise<boolean> {
  try {
    const r = await fetch("/api/figma/oauth/status", { credentials: "include" })
    if (!r.ok) return false
    const data = (await r.json()) as { connected: boolean }
    return !!data.connected
  } catch { return false }
}

export async function disconnect(): Promise<void> {
  await fetch("/api/figma/oauth/status", { method: "DELETE", credentials: "include" })
}

/** GET /v1/files/:key/variables/local — published + local variables in the file. */
export function getLocalVariables(fileKey: string): Promise<FigmaVariablesResponse> {
  return call<FigmaVariablesResponse>(`v1/files/${encodeURIComponent(fileKey)}/variables/local`)
}

/** POST /v1/files/:key/variables — batch create/update. */
export function postVariables(
  fileKey: string,
  payload: FigmaVariablesUpdatePayload,
): Promise<{ status: number; error: boolean; meta?: { tempIdToRealId?: Record<string, string> } }> {
  return call(`v1/files/${encodeURIComponent(fileKey)}/variables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}
