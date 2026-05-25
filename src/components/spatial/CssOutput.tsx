"use client"
import { useState } from "react"
import { Copy, Check, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CssOutput({ css }: { css: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(css)
    setCopied(true); setTimeout(() => setCopied(false), 1200)
  }
  return (
    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
        <Code2 size={12} className="text-[var(--muted-foreground)]" />
        <h3 className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">CSS 3D output</h3>
        <Button variant="ghost" size="sm" onClick={copy} className="ml-auto h-6 gap-1 text-[10px]">
          {copied ? <Check size={11} /> : <Copy size={11} />} Copy
        </Button>
      </div>
      <pre className="bg-[var(--surface-2)] p-3 text-[10px] font-mono overflow-x-auto leading-relaxed max-h-[300px] overflow-y-auto">{css}</pre>
    </section>
  )
}
