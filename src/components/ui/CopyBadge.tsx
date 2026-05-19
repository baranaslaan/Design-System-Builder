"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Copy } from "lucide-react"
import { copyToClipboard } from "@/lib/utils"

interface CopyBadgeProps {
  cssVar: string        // e.g. "--spacing-4"
  value?: string        // raw value shown in tooltip
  className?: string
}

export function CopyBadge({ cssVar, value, className = "" }: CopyBadgeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await copyToClipboard(`var(${cssVar})`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.94 }}
      title={value ? `${cssVar}\n${value}` : cssVar}
      className={`group/badge flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] transition-all select-none ${className}`}
      style={{
        background: copied ? "var(--accent-muted)" : "var(--surface-3)",
        color: copied ? "#a78bfa" : "var(--muted)",
        border: `1px solid ${copied ? "var(--accent)" : "transparent"}`,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="flex items-center gap-1"
          >
            <Check size={9} />
            <span>copied</span>
          </motion.span>
        ) : (
          <motion.span
            key="var"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <span className="opacity-0 group-hover/badge:opacity-100 transition-opacity">
              <Copy size={9} />
            </span>
            <span>{cssVar}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
