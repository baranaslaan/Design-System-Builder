// Minimal GitHub scan: list repo tree → filter source files → fetch content →
// run regex scanners. Uses GitHub REST (public + PAT). Designed to be called
// from a Next.js API route (Node runtime).

import { scanForUsage, scanForRogue, type UsageHit, type RogueHit } from "./astScan"

const GH = "https://api.github.com"
const EXT_OK = /\.(tsx|jsx|ts|js|css|scss|sass|less)$/i
const MAX_FILES = 400
const MAX_FILE_BYTES = 200_000

// Strict validators for SSRF prevention. GitHub's own naming rules are
// stricter than this, but we want a hard outer guard before any string is
// interpolated into a URL or sent as a Bearer token.
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/
const SAFE_TOKEN   = /^[A-Za-z0-9_-]+$/

function safe(seg: string, label: string): string {
  if (!SAFE_SEGMENT.test(seg)) throw new Error(`Invalid ${label}: ${JSON.stringify(seg)}`)
  return seg
}

interface TreeEntry { path: string; type: "blob" | "tree"; size?: number; sha: string }

export interface RepoScanResult {
  filesScanned: number
  usage: Array<UsageHit & { file: string }>
  rogue: Array<RogueHit & { file: string }>
}

async function gh(url: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dsb-adoption-scanner",
  }
  if (token) {
    if (!SAFE_TOKEN.test(token)) throw new Error("Invalid PAT format")
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GH ${res.status}`)
  return res.json()
}

export async function scanGithubRepo(opts: {
  owner: string
  repo: string
  branch: string
  token?: string
  knownComponents?: Set<string>
}): Promise<RepoScanResult> {
  const { token, knownComponents } = opts
  // Validate every segment that touches a URL.
  const owner  = safe(opts.owner,  "owner")
  const repo   = safe(opts.repo,   "repo")
  const branch = safe(opts.branch, "branch")

  const branchInfo = await gh(`${GH}/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`, token)
  const sha = branchInfo.commit?.sha
  if (typeof sha !== "string" || !/^[a-f0-9]{40}$/.test(sha)) throw new Error("invalid branch sha")

  const tree = await gh(`${GH}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`, token)
  const blobs: TreeEntry[] = (tree.tree ?? [])
    .filter((e: TreeEntry) => e.type === "blob" && EXT_OK.test(e.path))
    .filter((e: TreeEntry) => (e.size ?? 0) <= MAX_FILE_BYTES)
    // Tree paths come from GitHub but are still data we put into a URL — guard
    // against control chars, .., scheme prefixes, and absolute paths.
    .filter((e: TreeEntry) => !/[\x00-\x1f]/.test(e.path) && !e.path.includes("..") && !/^[/:]|:\/\//.test(e.path))
    .slice(0, MAX_FILES)

  const usage: RepoScanResult["usage"] = []
  const rogue: RepoScanResult["rogue"] = []

  // Sequential to stay polite to GH rate limits.
  for (const b of blobs) {
    try {
      const safePath = b.path.split("/").map(encodeURIComponent).join("/")
      const raw = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${safePath}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      if (!raw.ok) continue
      const text = await raw.text()
      for (const u of scanForUsage(text, knownComponents)) usage.push({ ...u, file: b.path })
      for (const r of scanForRogue(text, b.path))          rogue.push({ ...r, file: b.path })
    } catch { /* skip */ }
  }

  return { filesScanned: blobs.length, usage, rogue }
}
