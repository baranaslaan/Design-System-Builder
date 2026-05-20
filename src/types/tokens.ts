export type TokenCategory =
  | "colors" | "typography" | "spacing" | "radius" | "stroke" | "shadow" | "gradient"
  | "motion" | "opacity" | "breakpoint" | "zindex" | "blur"
export type PreviewMode = "light" | "dark"
export type Breakpoint = "mobile" | "tablet" | "desktop"

export type ColorShade = Record<string, string> & {
  50: string; 100: string; 200: string; 300: string; 400: string
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string
}

export interface ColorPalette {
  id: string
  name: string
  shades: ColorShade
}

export interface SemanticColor {
  id: string
  name: string
  lightValue: string
  darkValue: string
  lightRef?: string  // e.g. "violet.600" — resolved at render/export time
  darkRef?: string   // e.g. "violet.300"
  description?: string
}

export type TypographyScale = Record<string, string>
export type FontWeightScale = Record<string, number>
export type LineHeightScale = Record<string, string>
export type SpacingScale = Record<string, string>
export type RadiusScale = Record<string, string>
export type StrokeScale = Record<string, string>

export interface ShadowToken { id: string; name: string; value: string }

export interface GradientStop {
  id: string
  color: string
  position: number  // 0–100
  opacity: number   // 0–1
}

export interface GradientToken {
  id: string
  name: string
  type: "linear" | "radial" | "conic"
  angle: number
  stops: GradientStop[]
}

export type MotionDurations = Record<string, string>  // e.g. { fast: "150ms" }
export type MotionEasings = Record<string, string>    // e.g. { standard: "cubic-bezier(0.4, 0, 0.2, 1)" }
export type OpacityScale = Record<string, string>     // "0" – "1"
export type BreakpointScale = Record<string, string>  // "640px"
export type ZIndexScale = Record<string, string>      // string for "auto" support
export type BlurScale = Record<string, string>        // "8px"

export interface DesignTokens {
  name: string
  version: string
  colors: {
    palettes: ColorPalette[]
    semantic: SemanticColor[]
  }
  typography: {
    fontSizes: TypographyScale
    fontWeights: FontWeightScale
    lineHeights: LineHeightScale
    fontFamilies: { sans: string; serif: string; mono: string }
  }
  spacing: SpacingScale
  radius: RadiusScale
  stroke: StrokeScale
  shadows: ShadowToken[]
  gradients: GradientToken[]
  motion: { durations: MotionDurations; easings: MotionEasings }
  opacity: OpacityScale
  breakpoints: BreakpointScale
  zIndex: ZIndexScale
  blur: BlurScale
}

export interface HistoryEntry {
  id: string
  timestamp: number
  label: string
  tokens: DesignTokens
}

export type FigmaTokensFormat = Record<string, FigmaTokenNode>

export interface FigmaTokenNode {
  value?: string | number
  type?: string
  description?: string
  [key: string]: FigmaTokenNode | string | number | undefined
}
