"use client"

import { useState, useRef, useEffect } from "react"
import { Pencil } from "lucide-react"

export function EditableKey({
  value,
  onRename,
  className = "",
}: {
  value: string
  onRename: (newKey: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onRename(trimmed)
    else setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="text-xs font-mono bg-[var(--surface-3)] border border-[var(--accent)] rounded px-1 py-0.5 focus:outline-none text-[var(--foreground)] min-w-0"
        style={{ width: `${Math.max(draft.length, 4) + 1}ch` }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit() }
          if (e.key === "Escape") { setDraft(value); setEditing(false) }
        }}
      />
    )
  }

  return (
    <button
      className={`group/key flex items-center gap-1 text-xs font-mono text-[var(--muted)] hover:text-[var(--foreground)] transition-colors ${className}`}
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Click to rename"
    >
      <span>{value}</span>
      <Pencil size={9} className="opacity-0 group-hover/key:opacity-100 transition-opacity shrink-0 text-[var(--accent)]" />
    </button>
  )
}
