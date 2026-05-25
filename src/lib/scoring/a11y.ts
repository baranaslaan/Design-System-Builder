// Native WCAG 2.1 AA checks against a rendered DOM subtree.
// No axe-core dep — focused on the 4 listed requirements.

import type { A11yBreakdown, A11yIssue } from "@/types/scoring"

// ── Color utilities (sRGB → relative luminance → WCAG contrast) ─────────────
function parseColor(c: string): [number, number, number, number] | null {
  if (!c) return null
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(",").map(s => parseFloat(s.trim()))
  if (parts.length < 3) return null
  return [parts[0], parts[1], parts[2], parts[3] ?? 1]
}
function lum(r: number, g: number, b: number) {
  const f = (v: number) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
export function contrastRatio(fg: string, bg: string): number {
  const a = parseColor(fg), b = parseColor(bg)
  if (!a || !b) return 1
  // Composite fg onto bg if fg has alpha
  const alpha = a[3]
  const r = a[0] * alpha + b[0] * (1 - alpha)
  const g = a[1] * alpha + b[1] * (1 - alpha)
  const bl = a[2] * alpha + b[2] * (1 - alpha)
  const L1 = lum(r, g, bl)
  const L2 = lum(b[0], b[1], b[2])
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}

// Walk up the parent chain to find an effective non-transparent background.
function effectiveBg(el: Element): string {
  let cur: Element | null = el
  while (cur) {
    const bg = getComputedStyle(cur as HTMLElement).backgroundColor
    const p = parseColor(bg)
    if (p && p[3] > 0.05) return `rgb(${p[0]},${p[1]},${p[2]})`
    cur = cur.parentElement
  }
  return "rgb(255,255,255)"
}

const TEXT_TAGS = new Set(["P","SPAN","BUTTON","A","LABEL","H1","H2","H3","H4","H5","H6","LI","TD","TH","STRONG","EM","CODE"])
const INTERACTIVE = "button, a, input, select, textarea, [role=button], [role=link], [tabindex]:not([tabindex='-1'])"

function descEl(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const cls = (el.className && typeof el.className === "string") ? `.${el.className.split(/\s+/).slice(0,2).join(".")}` : ""
  return `${tag}${cls}`
}

// ── Individual check categories ─────────────────────────────────────────────
function checkContrast(root: HTMLElement) {
  const issues: A11yIssue[] = []
  let total = 0, pass = 0
  root.querySelectorAll<HTMLElement>("*").forEach(el => {
    if (!TEXT_TAGS.has(el.tagName)) return
    const txt = (el.textContent ?? "").trim()
    if (!txt) return
    const cs = getComputedStyle(el)
    if (cs.visibility === "hidden" || cs.display === "none") return
    const fontSize = parseFloat(cs.fontSize) || 14
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && parseInt(cs.fontWeight || "400", 10) >= 700)
    const required = isLarge ? 3 : 4.5
    const bg = effectiveBg(el)
    const ratio = contrastRatio(cs.color, bg)
    total++
    if (ratio >= required) pass++
    else issues.push({
      id: `contrast:${descEl(el)}:${total}`,
      severity: ratio < required - 1.5 ? "critical" : "warning",
      msg: `Contrast ${ratio.toFixed(2)}:1 (needs ${required}:1)`,
      el: descEl(el),
      wcag: "1.4.3",
    })
  })
  const score = total === 0 ? 100 : Math.round((pass / total) * 100)
  return { score, issues }
}

function checkTouchTargets(root: HTMLElement) {
  const issues: A11yIssue[] = []
  let total = 0, pass = 0
  root.querySelectorAll<HTMLElement>(INTERACTIVE).forEach(el => {
    const cs = getComputedStyle(el)
    if (cs.display === "none" || cs.visibility === "hidden") return
    const w = el.offsetWidth, h = el.offsetHeight
    if (w === 0 && h === 0) return
    total++
    const min = 24 // WCAG 2.2 SC 2.5.8 — minimum target size (AA = 24x24)
    const ideal = 44
    if (w >= ideal && h >= ideal) { pass++; return }
    if (w >= min && h >= min) {
      pass += 0.6 // partial credit
      issues.push({
        id: `touch:${descEl(el)}:${w}x${h}`, severity: "info",
        msg: `Target ${w}×${h}px is below ideal ${ideal}px`, el: descEl(el), wcag: "2.5.8",
      })
    } else {
      issues.push({
        id: `touch:${descEl(el)}:${w}x${h}`, severity: "critical",
        msg: `Target ${w}×${h}px is below WCAG minimum ${min}px`, el: descEl(el), wcag: "2.5.8",
      })
    }
  })
  const score = total === 0 ? 100 : Math.round((pass / total) * 100)
  return { score, issues }
}

function checkFocus(root: HTMLElement) {
  const issues: A11yIssue[] = []
  let total = 0, pass = 0
  root.querySelectorAll<HTMLElement>(INTERACTIVE).forEach(el => {
    total++
    el.focus({ preventScroll: true })
    const cs = getComputedStyle(el)
    const hasOutline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0
    const hasShadow  = cs.boxShadow && cs.boxShadow !== "none"
    const hasBorder  = parseFloat(cs.borderTopWidth) > 0
    el.blur()
    if (hasOutline || hasShadow || hasBorder) pass++
    else issues.push({
      id: `focus:${descEl(el)}`, severity: "critical",
      msg: "No visible focus indicator (outline / box-shadow / border)",
      el: descEl(el), wcag: "2.4.7",
    })
  })
  const score = total === 0 ? 100 : Math.round((pass / total) * 100)
  return { score, issues }
}

function checkTextScaling(root: HTMLElement) {
  // Approximation: text containers should use relative units OR have line-height
  // unset/relative so 200% zoom doesn't break. We flag fixed px text < 12 and
  // containers with explicit height that would clip on zoom.
  const issues: A11yIssue[] = []
  let total = 0, pass = 0
  root.querySelectorAll<HTMLElement>("*").forEach(el => {
    if (!TEXT_TAGS.has(el.tagName)) return
    const txt = (el.textContent ?? "").trim()
    if (!txt) return
    total++
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize) || 14
    const tooSmall = size < 12
    const fixedHeight = el.style.height?.endsWith("px") || (cs.maxHeight !== "none" && cs.maxHeight.endsWith("px") && parseFloat(cs.maxHeight) < size * 1.5)
    if (tooSmall) issues.push({
      id: `scaling:${descEl(el)}:small`, severity: "warning",
      msg: `Font ${size}px is below 12px floor`, el: descEl(el), wcag: "1.4.4",
    })
    if (fixedHeight) issues.push({
      id: `scaling:${descEl(el)}:fixed`, severity: "warning",
      msg: "Text container has fixed pixel height — may clip on zoom",
      el: descEl(el), wcag: "1.4.4",
    })
    if (!tooSmall && !fixedHeight) pass++
  })
  const score = total === 0 ? 100 : Math.round((pass / total) * 100)
  return { score, issues }
}

export function scoreA11y(root: HTMLElement): A11yBreakdown {
  const c = checkContrast(root)
  const t = checkTouchTargets(root)
  const f = checkFocus(root)
  const s = checkTextScaling(root)
  return {
    contrast: c.score, touch: t.score, focus: f.score, scaling: s.score,
    issues: [...c.issues, ...t.issues, ...f.issues, ...s.issues],
  }
}

export function a11yOverall(b: A11yBreakdown): number {
  // Weighted: contrast 35, focus 25, touch 25, scaling 15
  return Math.round(b.contrast * 0.35 + b.focus * 0.25 + b.touch * 0.25 + b.scaling * 0.15)
}
