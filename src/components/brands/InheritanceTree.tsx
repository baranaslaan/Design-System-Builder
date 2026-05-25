"use client"
// Path-grouped inheritance tree. Each leaf shows current value + source badge.
// Click selects a path for editing in the right pane.
import { useMemo, useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { TokenSourceBadge } from "./TokenSourceBadge"
import { flatten } from "@/lib/brands/paths"
import type { LayerKind } from "@/types/brands"
import type { DesignTokens } from "@/types/tokens"

interface Props {
  tokens: DesignTokens
  provenance: Record<string, LayerKind>
  selectedPath: string | null
  onSelect: (p: string) => void
  filter?: string
}

interface TreeNode {
  key: string
  fullPath: string
  isLeaf: boolean
  value?: unknown
  children: TreeNode[]
}

function buildTree(flat: Record<string, unknown>): TreeNode[] {
  const root: TreeNode = { key: "", fullPath: "", isLeaf: false, children: [] }
  const cache = new Map<string, TreeNode>([["", root]])
  for (const path of Object.keys(flat).sort()) {
    const parts = path.split(".")
    let parentPath = ""
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i]
      const full = parentPath ? `${parentPath}.${key}` : key
      if (!cache.has(full)) {
        const node: TreeNode = {
          key, fullPath: full,
          isLeaf: i === parts.length - 1,
          value: i === parts.length - 1 ? flat[path] : undefined,
          children: [],
        }
        cache.get(parentPath)!.children.push(node)
        cache.set(full, node)
      }
      parentPath = full
    }
  }
  return root.children
}

function valuePreview(v: unknown): React.ReactNode {
  if (typeof v === "string") {
    if (v.startsWith("#") && /^#[0-9a-fA-F]{3,8}$/.test(v)) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded border border-[var(--border)]" style={{ background: v }} />
          <code className="font-mono">{v}</code>
        </span>
      )
    }
    return <code className="font-mono text-[11px]">{v}</code>
  }
  return <code className="font-mono text-[11px]">{JSON.stringify(v)}</code>
}

function Node({ node, depth, provenance, selected, onSelect, filter }: {
  node: TreeNode; depth: number; provenance: Record<string, LayerKind>;
  selected: string | null; onSelect: (p: string) => void; filter?: string
}) {
  const [open, setOpen] = useState(depth < 1)
  if (filter && !node.fullPath.includes(filter)) {
    // If a parent doesn't match, still render if a descendant does.
    const anyChildMatches = (n: TreeNode): boolean =>
      n.isLeaf ? n.fullPath.includes(filter)
               : n.children.some(anyChildMatches)
    if (!anyChildMatches(node)) return null
  }

  if (node.isLeaf) {
    const src = provenance[node.fullPath] ?? "core"
    const isOverridden = src !== "core"
    return (
      <button onClick={() => onSelect(node.fullPath)}
        className={`w-full flex items-center gap-2 pl-${Math.min(depth * 4, 16)} pr-2 py-1 text-left text-xs hover:bg-[var(--surface-2)] rounded ${
          selected === node.fullPath ? "bg-[var(--surface-2)] ring-1 ring-[var(--accent)]" : ""
        }`}
        style={{ paddingLeft: depth * 14 + 8 }}>
        <span className={`flex-1 truncate ${isOverridden ? "font-semibold" : "text-[var(--muted-foreground)]"}`}>{node.key}</span>
        {valuePreview(node.value)}
        <TokenSourceBadge kind={src} />
      </button>
    )
  }
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 py-1 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        style={{ paddingLeft: depth * 14 + 4 }}>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        {node.key}
        <span className="text-[9px]">({node.children.length})</span>
      </button>
      {open && node.children.map(c => (
        <Node key={c.fullPath} node={c} depth={depth + 1} provenance={provenance}
          selected={selected} onSelect={onSelect} filter={filter} />
      ))}
    </div>
  )
}

export function InheritanceTree({ tokens, provenance, selectedPath, onSelect, filter }: Props) {
  const tree = useMemo(() => buildTree(flatten(tokens)), [tokens])
  return (
    <div className="space-y-0.5">
      {tree.map(n => (
        <Node key={n.fullPath} node={n} depth={0} provenance={provenance}
          selected={selectedPath} onSelect={onSelect} filter={filter} />
      ))}
    </div>
  )
}
