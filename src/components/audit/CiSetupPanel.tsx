"use client"
import { useState } from "react"
import { Copy, Check, Code2 as Github } from "lucide-react"
import { Button } from "@/components/ui/button"

const WORKFLOW = `# .github/workflows/ds-audit.yml
name: Design System Audit
on: [pull_request, push]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Run DS audit
        env:
          DSB_URL:    \${{ secrets.DSB_URL }}        # https://your-dsb.vercel.app
          DSB_TOKEN:  \${{ secrets.DSB_TOKEN }}      # Supabase access token
          DSB_TOKENS: \${{ secrets.DSB_TOKENS_JSON }} # design tokens JSON (one line)
          GH_PAT:     \${{ secrets.DSB_GH_PAT }}     # optional, for private repos
        run: |
          curl -fsSL "\$DSB_URL/scripts/ds-audit.mjs" -o ds-audit.mjs
          node ds-audit.mjs --repo \${{ github.repository }} --branch \${{ github.ref_name }}
`

const SCRIPT_NOTE = `Add three GitHub repo secrets:
  • DSB_URL          — your Design System Builder URL
  • DSB_TOKEN        — Supabase access token (Profile → Copy session token)
  • DSB_TOKENS_JSON  — your tokens JSON, one line (Export → Tokens JSON)
  • DSB_GH_PAT (opt) — GitHub PAT, only if the scanned repo is private`

export function CiSetupPanel() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1200)
  }
  return (
    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <Github size={12} />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">CI integration</h2>
        <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">Block PRs on critical findings</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase text-[var(--muted-foreground)]">GitHub Actions workflow</span>
            <Button variant="ghost" size="sm" onClick={() => copy("yml", WORKFLOW)} className="h-6 gap-1 text-[10px]">
              {copied === "yml" ? <Check size={11} /> : <Copy size={11} />} Copy
            </Button>
          </div>
          <pre className="bg-[var(--surface-2)] border border-[var(--border)] rounded p-3 text-[10px] font-mono overflow-x-auto leading-relaxed">{WORKFLOW}</pre>
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)] whitespace-pre-line">{SCRIPT_NOTE}</p>
      </div>
    </section>
  )
}
