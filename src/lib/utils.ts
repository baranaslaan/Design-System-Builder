import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DesignTokens, ColorPalette } from "@/types/tokens"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000000" : "#ffffff"
}

export function generateShades(baseColor: string): Record<string, string> {
  const { h, s } = hexToHsl(baseColor)
  const lightnesses = { 50: 97, 100: 94, 200: 87, 300: 75, 400: 60, 500: 45, 600: 35, 700: 28, 800: 20, 900: 13, 950: 8 }

  const hslToHex = (h: number, s: number, l: number): string => {
    const hN = h / 360, sN = s / 100, lN = l / 100
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    let r, g, b
    if (sN === 0) { r = g = b = lN } else {
      const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN
      const p = 2 * lN - q
      r = hue2rgb(p, q, hN + 1/3); g = hue2rgb(p, q, hN); b = hue2rgb(p, q, hN - 1/3)
    }
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0")
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const result: Record<string, string> = {}
  for (const [shade, lightness] of Object.entries(lightnesses)) result[shade] = hslToHex(h, s, lightness)
  return result
}

// ─── Token alias resolution ────────────────────────────────────────────────
// ref format: "paletteName.shade"  e.g. "violet.600"
export function resolveRef(ref: string, palettes: ColorPalette[]): string | null {
  const [paletteName, shade] = ref.split(".")
  if (!paletteName || !shade) return null
  const palette = palettes.find(p => p.id.toLowerCase() === paletteName.toLowerCase() || p.name.toLowerCase() === paletteName.toLowerCase())
  return palette?.shades[shade] ?? null
}

export function buildAliasOptions(palettes: ColorPalette[]): { label: string; value: string; hex: string }[] {
  const options: { label: string; value: string; hex: string }[] = []
  for (const palette of palettes) {
    for (const [shade, hex] of Object.entries(palette.shades)) {
      options.push({ label: `${palette.name} ${shade}`, value: `${palette.id}.${shade}`, hex })
    }
  }
  return options
}

// ─── WCAG Contrast ────────────────────────────────────────────────────────
function relativeLuminance(hex: string): number {
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const r = toLinear(parseInt(hex.slice(1, 3), 16) / 255)
  const g = toLinear(parseInt(hex.slice(3, 5), 16) / 255)
  const b = toLinear(parseInt(hex.slice(5, 7), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(hex1: string, hex2: string): number {
  try {
    const l1 = relativeLuminance(hex1)
    const l2 = relativeLuminance(hex2)
    const lighter = Math.max(l1, l2)
    const darker  = Math.min(l1, l2)
    return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100
  } catch { return 1 }
}

export type WCAGLevel = "AAA" | "AA" | "AA Large" | "Fail"

export function wcagLevel(ratio: number): WCAGLevel {
  if (ratio >= 7) return "AAA"
  if (ratio >= 4.5) return "AA"
  if (ratio >= 3) return "AA Large"
  return "Fail"
}

// ─── Gradient CSS ─────────────────────────────────────────────────────────
import type { GradientToken } from "@/types/tokens"

export function gradientToCss(g: GradientToken): string {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map(s => {
      if (s.opacity < 1) {
        const r = parseInt(s.color.slice(1, 3), 16)
        const gr = parseInt(s.color.slice(3, 5), 16)
        const b = parseInt(s.color.slice(5, 7), 16)
        return `rgba(${r},${gr},${b},${s.opacity}) ${s.position}%`
      }
      return `${s.color} ${s.position}%`
    })
    .join(", ")
  switch (g.type) {
    case "radial": return `radial-gradient(circle, ${stops})`
    case "conic":  return `conic-gradient(from ${g.angle}deg, ${stops})`
    default:       return `linear-gradient(${g.angle}deg, ${stops})`
  }
}

export function wcagLevelColor(level: WCAGLevel): string {
  switch (level) {
    case "AAA":      return "#34d399"
    case "AA":       return "#60a5fa"
    case "AA Large": return "#fbbf24"
    case "Fail":     return "#f87171"
  }
}
