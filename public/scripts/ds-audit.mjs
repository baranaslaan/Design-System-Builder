#!/usr/bin/env node
// ds-audit.mjs — DSB CI runner
//
// Usage: node ds-audit.mjs --repo owner/name [--branch main]
// Env (required): DSB_URL, DSB_CI_TOKEN (created at /ci-tokens), DSB_TOKENS (JSON string)
// Env (optional): GH_PAT, DSB_USE_AI=1
//
// Auth migration: previously this script used DSB_TOKEN (a short-lived
// Supabase user JWT). It now uses DSB_CI_TOKEN — a long-lived opaque token
// issued via /api/ci-tokens, scoped to one user, hash-stored server-side,
// individually revocable. Falls back to DSB_TOKEN for backwards compatibility
// (logs a warning).

import process from "node:process"

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]])
    return acc
  }, [])
)

const DSB_URL      = process.env.DSB_URL
const DSB_CI_TOKEN = process.env.DSB_CI_TOKEN
const DSB_TOKEN    = process.env.DSB_TOKEN          // legacy
const DSB_TOKENS   = process.env.DSB_TOKENS
const GH_PAT       = process.env.GH_PAT

if (!DSB_URL || !DSB_TOKENS || !(DSB_CI_TOKEN || DSB_TOKEN)) {
  console.error("Missing env: DSB_URL, DSB_TOKENS, and one of DSB_CI_TOKEN / DSB_TOKEN are required")
  process.exit(2)
}
if (!args.repo) { console.error("--repo owner/name required"); process.exit(2) }
if (!DSB_URL.startsWith("https://")) {
  console.error("DSB_URL must be HTTPS — refusing to send secrets over plain HTTP")
  process.exit(2)
}
if (!DSB_CI_TOKEN && DSB_TOKEN) {
  console.warn("⚠ Using legacy DSB_TOKEN (short-lived JWT). Migrate to DSB_CI_TOKEN — see /ci-tokens.")
}

const body = {
  repo: args.repo,
  branch: args.branch ?? "main",
  github_pat: GH_PAT,
  tokens: JSON.parse(DSB_TOKENS),
  use_ai: process.env.DSB_USE_AI === "1",
}

const headers = { "content-type": "application/json" }
if (DSB_CI_TOKEN) headers["x-dsb-ci-token"] = DSB_CI_TOKEN
else              headers["authorization"]  = `Bearer ${DSB_TOKEN}`

const sevColor = { critical: "\x1b[31m", warning: "\x1b[33m", info: "\x1b[34m" }
const reset = "\x1b[0m"

const res = await fetch(`${DSB_URL}/api/audit/ci`, {
  method: "POST", headers, body: JSON.stringify(body),
})

const j = await res.json().catch(() => ({}))
if (!res.ok && res.status !== 422) {
  console.error("Audit request failed:", res.status, j?.error ?? "")
  process.exit(2)
}

const { summary = {}, fail = false, run_id } = j
console.log(`\nDS Audit · run ${String(run_id).slice(0, 8)}`)
console.log(`  ${sevColor.critical}critical: ${summary.critical ?? 0}${reset}`)
console.log(`  ${sevColor.warning}warning:  ${summary.warning  ?? 0}${reset}`)
console.log(`  ${sevColor.info}info:     ${summary.info     ?? 0}${reset}`)
console.log(`  total:    ${summary.total ?? 0}\n`)

if (Array.isArray(j.findings)) {
  for (const f of j.findings.slice(0, 50)) {
    const c = sevColor[f.severity] ?? ""
    const sug = f.suggested_token ? `  →  ${f.suggested_token}` : ""
    console.log(`${c}[${f.severity}]${reset} ${f.kind}  ${f.location}  ${f.raw_value}${sug}`)
    if (f.ai_reason) console.log(`         ↳ ${f.ai_reason}`)
  }
}

if (fail) {
  console.error(`\n✖ ${summary.critical} critical finding(s) — failing build.`)
  process.exit(1)
}
console.log("\n✓ No critical findings.")
