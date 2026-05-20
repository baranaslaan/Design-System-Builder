"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { copyToClipboard } from "@/lib/utils"

/**
 * Compact, click-to-copy chip for raw color/value strings.
 * Shows the value as monospace text; on click, copies it and briefly flashes "copied".
 */
export function ValueChip({
  value,
  className = "",
  title,
}: {
  value: string
  className?: string
  title?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    await copyToClipboard(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      title={title ?? `${value} — click to copy`}
      className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors select-none ${className}`}
      style={{
        background: copied ? "var(--accent-muted)" : "transparent",
        color: copied ? "var(--accent)" : "var(--muted)",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="ok"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="flex items-center gap-1"
          >
            <Check size={9} /> copied
          </motion.span>
        ) : (
          <motion.span
            key="val"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="truncate hover:text-[var(--foreground)] transition-colors"
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
