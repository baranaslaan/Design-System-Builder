"use client"

import * as RadixTooltip from "@radix-ui/react-tooltip"

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <RadixTooltip.Provider delayDuration={400}>{children}</RadixTooltip.Provider>
}

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-50 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border)] shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          {content}
          <RadixTooltip.Arrow className="fill-[var(--surface-3)]" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
