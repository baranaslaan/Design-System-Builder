"use client"

import { useState } from "react"
import { Code2 } from "lucide-react"
import { CodeViewer } from "./CodeViewer"
import type { ComponentCodeSpec } from "@/lib/componentCode"

interface CodePeekProps {
  spec: ComponentCodeSpec
  /** Position of the `<>` button — defaults to top-right corner */
  align?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  /** Wrap inline (display:inline-block) or block */
  inline?: boolean
  children: React.ReactNode
}

const POSITIONS: Record<string, string> = {
  "top-right":    "-top-1.5 -right-1.5",
  "top-left":     "-top-1.5 -left-1.5",
  "bottom-right": "-bottom-1.5 -right-1.5",
  "bottom-left":  "-bottom-1.5 -left-1.5",
}

export function CodePeek({ spec, align = "top-right", inline = false, children }: CodePeekProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span
        className={`relative group/peek ${inline ? "inline-block" : "block"}`}
        // Prevent the wrapper from changing the layout of inline children
        style={{ lineHeight: 0 }}
      >
        <span style={{ lineHeight: "normal" }}>{children}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(true) }}
          title="View code"
          aria-label="View component code"
          className={`absolute ${POSITIONS[align]} z-10 w-5 h-5 rounded-md bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--accent)] transition-all shadow-sm pointer-events-auto`}
        >
          <Code2 size={10} />
        </button>
      </span>
      <CodeViewer open={open} spec={spec} onClose={() => setOpen(false)} />
    </>
  )
}
