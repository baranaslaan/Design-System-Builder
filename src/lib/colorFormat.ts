export type ColorFormat = "hex" | "rgb" | "hsl"

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace(/^#/, "")
  if (cleaned.length !== 6 && cleaned.length !== 3) return null
  const full = cleaned.length === 3
    ? cleaned.split("").map((c) => c + c).join("")
    : cleaned
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return null
  return { r, g, b }
}

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/** Full formatted value (e.g. "#7C3AED", "rgb(124, 58, 237)", "hsl(262, 84%, 58%)") */
export function formatColor(hex: string, format: ColorFormat): string {
  if (format === "hex") return hex.toUpperCase()
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  if (format === "rgb") return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}

/** Compact form (no `rgb()` / `hsl()` wrapper) — fits in tight cells */
export function formatColorCompact(hex: string, format: ColorFormat): string {
  if (format === "hex") return hex.toUpperCase()
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  if (format === "rgb") return `${rgb.r},${rgb.g},${rgb.b}`
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  return `${hsl.h},${hsl.s}%,${hsl.l}%`
}
