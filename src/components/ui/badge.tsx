import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "accent" | "success" | "warning"
  className?: string
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-[var(--surface-3)] text-[var(--muted-foreground)]": variant === "default",
          "bg-[var(--accent-muted)] text-violet-400": variant === "accent",
          "bg-emerald-500/10 text-emerald-400": variant === "success",
          "bg-amber-500/10 text-amber-400": variant === "warning",
        },
        className
      )}
    >
      {children}
    </span>
  )
}
