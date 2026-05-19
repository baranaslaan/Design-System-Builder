import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  DesignTokens, TokenCategory, ColorPalette, SemanticColor,
  ShadowToken, GradientToken, HistoryEntry, PreviewMode,
} from "@/types/tokens"
import { PRESETS } from "@/data/presets"

const MAX_HISTORY = 40

function makeSnapshot(tokens: DesignTokens, label: string): HistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    label,
    tokens: JSON.parse(JSON.stringify(tokens)),
  }
}

export interface CustomPreset {
  id: string
  name: string
  tokens: DesignTokens
  createdAt: number
}

interface TokensState {
  tokens: DesignTokens
  activeCategory: TokenCategory
  activePreset: string
  previewMode: PreviewMode
  appTheme: "dark" | "light"
  history: HistoryEntry[]
  customPresets: CustomPreset[]
  undoStack: DesignTokens[]
  redoStack: DesignTokens[]

  setActiveCategory: (cat: TokenCategory) => void
  setPreviewMode: (mode: PreviewMode) => void
  setAppTheme: (theme: "dark" | "light") => void
  loadPreset: (presetKey: string) => void
  importJSON: (json: string) => void
  undo: () => void
  redo: () => void

  // Custom presets
  saveCurrentAsPreset: (name: string) => void
  loadCustomPreset: (id: string) => void
  deleteCustomPreset: (id: string) => void
  renameCustomPreset: (id: string, name: string) => void

  // History
  pushHistory: (label?: string) => void
  restoreHistory: (id: string) => void
  clearHistory: () => void

  // Color actions
  updateColorPalette: (palette: ColorPalette) => void
  addColorPalette: (palette: ColorPalette) => void
  removeColorPalette: (id: string) => void
  updateSemanticColor: (color: SemanticColor) => void
  addSemanticColor: (color: SemanticColor) => void
  removeSemanticColor: (id: string) => void

  // Typography actions
  updateFontSize: (key: string, value: string) => void
  updateFontWeight: (key: string, value: number) => void
  updateLineHeight: (key: string, value: string) => void
  updateFontFamily: (key: "sans" | "serif" | "mono", value: string) => void

  // Spacing / Radius / Stroke
  updateSpacing: (key: string, value: string) => void
  updateRadius: (key: string, value: string) => void
  updateStroke: (key: string, value: string) => void

  // Rename / add / remove
  renameSpacing: (oldKey: string, newKey: string) => void
  addSpacing: (key: string, value: string) => void
  removeSpacing: (key: string) => void
  renameRadius: (oldKey: string, newKey: string) => void
  addRadius: (key: string, value: string) => void
  removeRadius: (key: string) => void
  renameStroke: (oldKey: string, newKey: string) => void
  addStroke: (key: string, value: string) => void
  removeStroke: (key: string) => void
  renameFontSize: (oldKey: string, newKey: string) => void
  renameFontWeight: (oldKey: string, newKey: string) => void
  renameLineHeight: (oldKey: string, newKey: string) => void

  // Shadow
  updateShadow: (shadow: ShadowToken) => void
  addShadow: (shadow: ShadowToken) => void
  removeShadow: (id: string) => void

  // Gradient
  updateGradient: (gradient: GradientToken) => void
  addGradient: (gradient: GradientToken) => void
  removeGradient: (id: string) => void

  // Meta
  updateName: (name: string) => void
}

export const useTokensStore = create<TokensState>()(
  persist(
    (set, get) => ({
      tokens: PRESETS.default,
      activeCategory: "colors",
      activePreset: "default",
      previewMode: "dark",
      appTheme: "dark",
      history: [],
      customPresets: [],
      undoStack: [],
      redoStack: [],

      setActiveCategory: (cat) => set({ activeCategory: cat }),
      setPreviewMode: (mode) => set({ previewMode: mode }),
      setAppTheme: (theme) => set({ appTheme: theme }),

      undo: () => set((s) => {
        if (s.undoStack.length === 0) return {}
        const [prev, ...rest] = s.undoStack
        return { tokens: prev, undoStack: rest, redoStack: [s.tokens, ...s.redoStack].slice(0, 40) }
      }),

      redo: () => set((s) => {
        if (s.redoStack.length === 0) return {}
        const [next, ...rest] = s.redoStack
        return { tokens: next, redoStack: rest, undoStack: [s.tokens, ...s.undoStack].slice(0, 40) }
      }),

      loadPreset: (presetKey) =>
        set((s) => ({
          tokens: PRESETS[presetKey] ?? PRESETS.default,
          activePreset: presetKey,
          history: [makeSnapshot(s.tokens, `Before loading ${PRESETS[presetKey]?.name ?? presetKey}`), ...s.history].slice(0, MAX_HISTORY),
        })),

      importJSON: (json) => {
        try {
          const parsed = JSON.parse(json) as DesignTokens
          set((s) => ({
            tokens: parsed,
            activePreset: "custom",
            history: [makeSnapshot(s.tokens, "Before JSON import"), ...s.history].slice(0, MAX_HISTORY),
          }))
        } catch { /* invalid JSON */ }
      },

      saveCurrentAsPreset: (name) =>
        set((s) => ({
          customPresets: [
            ...s.customPresets,
            {
              id: `custom-${Date.now()}`,
              name,
              tokens: JSON.parse(JSON.stringify(s.tokens)),
              createdAt: Date.now(),
            },
          ],
        })),

      loadCustomPreset: (id) =>
        set((s) => {
          const preset = s.customPresets.find((p) => p.id === id)
          if (!preset) return {}
          return {
            tokens: JSON.parse(JSON.stringify(preset.tokens)),
            activePreset: id,
            history: [makeSnapshot(s.tokens, `Before loading "${preset.name}"`), ...s.history].slice(0, MAX_HISTORY),
          }
        }),

      deleteCustomPreset: (id) =>
        set((s) => ({ customPresets: s.customPresets.filter((p) => p.id !== id) })),

      renameCustomPreset: (id, name) =>
        set((s) => ({
          customPresets: s.customPresets.map((p) => p.id === id ? { ...p, name } : p),
        })),

      pushHistory: (label = "Manual snapshot") =>
        set((s) => ({
          history: [makeSnapshot(s.tokens, label), ...s.history].slice(0, MAX_HISTORY),
        })),

      restoreHistory: (id) =>
        set((s) => {
          const entry = s.history.find((h) => h.id === id)
          if (!entry) return {}
          return {
            tokens: entry.tokens,
            activePreset: "custom",
            history: [makeSnapshot(s.tokens, `Before restoring "${entry.label}"`), ...s.history].slice(0, MAX_HISTORY),
          }
        }),

      clearHistory: () => set({ history: [] }),

      updateColorPalette: (palette) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, colors: { ...s.tokens.colors, palettes: s.tokens.colors.palettes.map((p) => p.id === palette.id ? palette : p) } },
        })),

      addColorPalette: (palette) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, colors: { ...s.tokens.colors, palettes: [...s.tokens.colors.palettes, palette] } },
        })),

      removeColorPalette: (id) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, colors: { ...s.tokens.colors, palettes: s.tokens.colors.palettes.filter((p) => p.id !== id) } },
        })),

      updateSemanticColor: (color) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, colors: { ...s.tokens.colors, semantic: s.tokens.colors.semantic.map((c) => c.id === color.id ? color : c) } },
        })),

      addSemanticColor: (color) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, colors: { ...s.tokens.colors, semantic: [...s.tokens.colors.semantic, color] } },
        })),

      removeSemanticColor: (id) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, colors: { ...s.tokens.colors, semantic: s.tokens.colors.semantic.filter((c) => c.id !== id) } },
        })),

      updateFontSize: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, typography: { ...s.tokens.typography, fontSizes: { ...s.tokens.typography.fontSizes, [key]: value } } } })),

      updateFontWeight: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, typography: { ...s.tokens.typography, fontWeights: { ...s.tokens.typography.fontWeights, [key]: value } } } })),

      updateLineHeight: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, typography: { ...s.tokens.typography, lineHeights: { ...s.tokens.typography.lineHeights, [key]: value } } } })),

      updateFontFamily: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, typography: { ...s.tokens.typography, fontFamilies: { ...s.tokens.typography.fontFamilies, [key]: value } } } })),

      updateSpacing: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, spacing: { ...s.tokens.spacing, [key]: value } } })),

      updateRadius: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, radius: { ...s.tokens.radius, [key]: value } } })),

      updateStroke: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, stroke: { ...s.tokens.stroke, [key]: value } } })),

      renameSpacing: (oldKey, newKey) =>
        set((s) => {
          if (oldKey === newKey || !newKey.trim()) return {}
          const spacing = { ...s.tokens.spacing }
          const val = spacing[oldKey]; delete spacing[oldKey]; spacing[newKey] = val
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, spacing } }
        }),

      addSpacing: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, spacing: { ...s.tokens.spacing, [key]: value } } })),

      removeSpacing: (key) =>
        set((s) => {
          const spacing = { ...s.tokens.spacing }; delete spacing[key]
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, spacing } }
        }),

      renameRadius: (oldKey, newKey) =>
        set((s) => {
          if (oldKey === newKey || !newKey.trim()) return {}
          const radius = { ...s.tokens.radius }
          const val = radius[oldKey]; delete radius[oldKey]; radius[newKey] = val
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, radius } }
        }),

      addRadius: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, radius: { ...s.tokens.radius, [key]: value } } })),

      removeRadius: (key) =>
        set((s) => {
          const radius = { ...s.tokens.radius }; delete radius[key]
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, radius } }
        }),

      renameStroke: (oldKey, newKey) =>
        set((s) => {
          if (oldKey === newKey || !newKey.trim()) return {}
          const stroke = { ...s.tokens.stroke }
          const val = stroke[oldKey]; delete stroke[oldKey]; stroke[newKey] = val
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, stroke } }
        }),

      addStroke: (key, value) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, stroke: { ...s.tokens.stroke, [key]: value } } })),

      removeStroke: (key) =>
        set((s) => {
          const stroke = { ...s.tokens.stroke }; delete stroke[key]
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, stroke } }
        }),

      renameFontSize: (oldKey, newKey) =>
        set((s) => {
          if (oldKey === newKey || !newKey.trim()) return {}
          const fontSizes = { ...s.tokens.typography.fontSizes }
          const val = fontSizes[oldKey]; delete fontSizes[oldKey]; fontSizes[newKey] = val
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, typography: { ...s.tokens.typography, fontSizes } } }
        }),

      renameFontWeight: (oldKey, newKey) =>
        set((s) => {
          if (oldKey === newKey || !newKey.trim()) return {}
          const fontWeights = { ...s.tokens.typography.fontWeights }
          const val = fontWeights[oldKey]; delete fontWeights[oldKey]; fontWeights[newKey] = val
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, typography: { ...s.tokens.typography, fontWeights } } }
        }),

      renameLineHeight: (oldKey, newKey) =>
        set((s) => {
          if (oldKey === newKey || !newKey.trim()) return {}
          const lineHeights = { ...s.tokens.typography.lineHeights }
          const val = lineHeights[oldKey]; delete lineHeights[oldKey]; lineHeights[newKey] = val
          return { undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
            tokens: { ...s.tokens, typography: { ...s.tokens.typography, lineHeights } } }
        }),

      updateShadow: (shadow) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, shadows: s.tokens.shadows.map((sh) => sh.id === shadow.id ? shadow : sh) } })),

      addShadow: (shadow) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, shadows: [...s.tokens.shadows, shadow] } })),

      removeShadow: (id) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, shadows: s.tokens.shadows.filter((sh) => sh.id !== id) } })),

      updateGradient: (gradient) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, gradients: (s.tokens.gradients ?? []).map((g) => g.id === gradient.id ? gradient : g) } })),

      addGradient: (gradient) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, gradients: [...(s.tokens.gradients ?? []), gradient] } })),

      removeGradient: (id) =>
        set((s) => ({ undoStack: [s.tokens, ...s.undoStack].slice(0, 40), redoStack: [],
          tokens: { ...s.tokens, gradients: (s.tokens.gradients ?? []).filter((g) => g.id !== id) } })),

      updateName: (name) =>
        set((s) => ({ tokens: { ...s.tokens, name } })),
    }),
    {
      name: "design-tokens-v2",
      version: 1,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const state = persistedState as TokensState
        const fixTokens = (t: DesignTokens): DesignTokens =>
          Array.isArray(t?.gradients) ? t : { ...t, gradients: PRESETS.default.gradients }
        state.tokens = fixTokens(state.tokens)
        state.undoStack = (state.undoStack ?? []).map(fixTokens)
        state.redoStack = (state.redoStack ?? []).map(fixTokens)
        return state
      },
    }
  )
)
