import type { DesignTokens } from "@/types/tokens"

export const PRESETS: Record<string, DesignTokens> = {
  default: {
    name: "Default System",
    version: "1.0.0",
    colors: {
      palettes: [
        {
          id: "violet", name: "Violet",
          shades: {
            50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
            400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9",
            800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065",
          },
        },
        {
          id: "slate", name: "Slate",
          shades: {
            50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1",
            400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155",
            800: "#1e293b", 900: "#0f172a", 950: "#020617",
          },
        },
        {
          id: "emerald", name: "Emerald",
          shades: {
            50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
            400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
            800: "#065f46", 900: "#064e3b", 950: "#022c22",
          },
        },
        {
          id: "rose", name: "Rose",
          shades: {
            50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af",
            400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c",
            800: "#9f1239", 900: "#881337", 950: "#4c0519",
          },
        },
      ],
      semantic: [
        { id: "primary",   name: "Primary",   lightValue: "#7c3aed", darkValue: "#a78bfa", lightRef: "violet.600",  darkRef: "violet.400"  },
        { id: "secondary", name: "Secondary", lightValue: "#475569", darkValue: "#94a3b8", lightRef: "slate.600",   darkRef: "slate.400"   },
        { id: "success",   name: "Success",   lightValue: "#059669", darkValue: "#34d399", lightRef: "emerald.600", darkRef: "emerald.400" },
        { id: "warning",   name: "Warning",   lightValue: "#d97706", darkValue: "#fbbf24" },
        { id: "danger",    name: "Danger",    lightValue: "#dc2626", darkValue: "#f87171", lightRef: "rose.600",    darkRef: "rose.400"    },
        { id: "info",      name: "Info",      lightValue: "#2563eb", darkValue: "#60a5fa" },
      ],
    },
    typography: {
      fontSizes: {
        xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem",
        xl: "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem",
        "4xl": "2.25rem", "5xl": "3rem", "6xl": "3.75rem",
      },
      fontWeights: {
        thin: 100, light: 300, regular: 400, medium: 500,
        semibold: 600, bold: 700, extrabold: 800, black: 900,
      },
      lineHeights: {
        none: "1", tight: "1.25", snug: "1.375", normal: "1.5",
        relaxed: "1.625", loose: "2",
      },
      fontFamilies: {
        sans: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        mono: "'JetBrains Mono', 'Fira Code', monospace",
      },
    },
    spacing: {
      0: "0px", 1: "4px", 2: "8px", 3: "12px", 4: "16px",
      5: "20px", 6: "24px", 8: "32px", 10: "40px", 12: "48px",
      16: "64px", 20: "80px", 24: "96px",
    },
    radius: {
      none: "0px", sm: "2px", base: "4px", md: "6px", lg: "8px",
      xl: "12px", "2xl": "16px", "3xl": "24px", full: "9999px",
    },
    stroke: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" },
    shadows: [
      { id: "sm",   name: "Small",  value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
      { id: "base", name: "Base",   value: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)" },
      { id: "md",   name: "Medium", value: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
      { id: "lg",   name: "Large",  value: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" },
      { id: "xl",   name: "XL",     value: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" },
    ],
    gradients: [
      { id: "primary",  name: "Primary",  type: "linear", angle: 135, stops: [{ id: "s1", color: "#7c3aed", position: 0, opacity: 1 }, { id: "s2", color: "#ec4899", position: 100, opacity: 1 }] },
      { id: "aurora",   name: "Aurora",   type: "linear", angle: 120, stops: [{ id: "s1", color: "#06b6d4", position: 0, opacity: 1 }, { id: "s2", color: "#6366f1", position: 50, opacity: 1 }, { id: "s3", color: "#ec4899", position: 100, opacity: 1 }] },
      { id: "sunset",   name: "Sunset",   type: "linear", angle: 90,  stops: [{ id: "s1", color: "#f97316", position: 0, opacity: 1 }, { id: "s2", color: "#ef4444", position: 100, opacity: 1 }] },
      { id: "emerald",  name: "Emerald",  type: "radial", angle: 0,   stops: [{ id: "s1", color: "#10b981", position: 0, opacity: 1 }, { id: "s2", color: "#047857", position: 100, opacity: 1 }] },
    ],
  },

  material: {
    name: "Material 3",
    version: "1.0.0",
    colors: {
      palettes: [
        {
          id: "primary", name: "Primary",
          shades: {
            50: "#e8f5e9", 100: "#c8e6c9", 200: "#a5d6a7", 300: "#81c784",
            400: "#66bb6a", 500: "#4caf50", 600: "#43a047", 700: "#388e3c",
            800: "#2e7d32", 900: "#1b5e20", 950: "#0d3312",
          },
        },
        {
          id: "secondary", name: "Secondary",
          shades: {
            50: "#e3f2fd", 100: "#bbdefb", 200: "#90caf9", 300: "#64b5f6",
            400: "#42a5f5", 500: "#2196f3", 600: "#1e88e5", 700: "#1976d2",
            800: "#1565c0", 900: "#0d47a1", 950: "#07305e",
          },
        },
      ],
      semantic: [
        { id: "primary",    name: "Primary",    lightValue: "#6750a4", darkValue: "#d0bcff" },
        { id: "secondary",  name: "Secondary",  lightValue: "#625b71", darkValue: "#ccc2dc" },
        { id: "tertiary",   name: "Tertiary",   lightValue: "#7d5260", darkValue: "#efb8c8" },
        { id: "error",      name: "Error",      lightValue: "#b3261e", darkValue: "#f2b8b5" },
        { id: "surface",    name: "Surface",    lightValue: "#fffbfe", darkValue: "#1c1b1f" },
        { id: "background", name: "Background", lightValue: "#fffbfe", darkValue: "#1c1b1f" },
      ],
    },
    typography: {
      fontSizes: {
        xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem",
        xl: "1.375rem", "2xl": "1.625rem", "3xl": "2rem",
        "4xl": "2.25rem", "5xl": "2.8125rem", "6xl": "3.5625rem",
      },
      fontWeights: {
        thin: 100, light: 300, regular: 400, medium: 500,
        semibold: 600, bold: 700, extrabold: 800, black: 900,
      },
      lineHeights: {
        none: "1", tight: "1.2", snug: "1.333", normal: "1.5",
        relaxed: "1.6", loose: "2",
      },
      fontFamilies: {
        sans: "Roboto, Arial, sans-serif",
        serif: "Georgia, serif",
        mono: "Roboto Mono, monospace",
      },
    },
    spacing: {
      0: "0px", 1: "4px", 2: "8px", 3: "12px", 4: "16px",
      5: "20px", 6: "24px", 8: "32px", 10: "40px", 12: "48px",
      16: "64px", 20: "80px", 24: "96px",
    },
    radius: {
      none: "0px", sm: "4px", base: "8px", md: "12px", lg: "16px",
      xl: "20px", "2xl": "28px", "3xl": "36px", full: "9999px",
    },
    stroke: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" },
    shadows: [
      { id: "sm",   name: "Elevation 1", value: "0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)" },
      { id: "base", name: "Elevation 2", value: "0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)" },
      { id: "md",   name: "Elevation 3", value: "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)" },
      { id: "lg",   name: "Elevation 4", value: "0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.3)" },
      { id: "xl",   name: "Elevation 5", value: "0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.3)" },
    ],
    gradients: [
      { id: "primary", name: "Primary", type: "linear", angle: 135, stops: [{ id: "s1", color: "#6750a4", position: 0, opacity: 1 }, { id: "s2", color: "#d0bcff", position: 100, opacity: 1 }] },
      { id: "surface", name: "Surface", type: "linear", angle: 180, stops: [{ id: "s1", color: "#fffbfe", position: 0, opacity: 1 }, { id: "s2", color: "#e6e0e9", position: 100, opacity: 1 }] },
    ],
  },

  tailwind: {
    name: "Tailwind CSS",
    version: "1.0.0",
    colors: {
      palettes: [
        {
          id: "blue", name: "Blue",
          shades: {
            50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
            400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
            800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
          },
        },
        {
          id: "indigo", name: "Indigo",
          shades: {
            50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc",
            400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca",
            800: "#3730a3", 900: "#312e81", 950: "#1e1b4b",
          },
        },
        {
          id: "gray", name: "Gray",
          shades: {
            50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db",
            400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151",
            800: "#1f2937", 900: "#111827", 950: "#030712",
          },
        },
      ],
      semantic: [
        { id: "primary",   name: "Primary",   lightValue: "#4f46e5", darkValue: "#818cf8" },
        { id: "secondary", name: "Secondary", lightValue: "#4b5563", darkValue: "#9ca3af" },
        { id: "success",   name: "Success",   lightValue: "#16a34a", darkValue: "#4ade80" },
        { id: "warning",   name: "Warning",   lightValue: "#ca8a04", darkValue: "#facc15" },
        { id: "danger",    name: "Danger",    lightValue: "#dc2626", darkValue: "#f87171" },
      ],
    },
    typography: {
      fontSizes: {
        xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem",
        xl: "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem",
        "4xl": "2.25rem", "5xl": "3rem", "6xl": "3.75rem",
      },
      fontWeights: {
        thin: 100, light: 300, regular: 400, medium: 500,
        semibold: 600, bold: 700, extrabold: 800, black: 900,
      },
      lineHeights: {
        none: "1", tight: "1.25", snug: "1.375", normal: "1.5",
        relaxed: "1.625", loose: "2",
      },
      fontFamilies: {
        sans: "ui-sans-serif, system-ui, sans-serif",
        serif: "ui-serif, Georgia, serif",
        mono: "ui-monospace, SFMono-Regular, monospace",
      },
    },
    spacing: {
      0: "0px", 1: "4px", 2: "8px", 3: "12px", 4: "16px",
      5: "20px", 6: "24px", 8: "32px", 10: "40px", 12: "48px",
      16: "64px", 20: "80px", 24: "96px",
    },
    radius: {
      none: "0px", sm: "2px", base: "4px", md: "6px", lg: "8px",
      xl: "12px", "2xl": "16px", "3xl": "24px", full: "9999px",
    },
    stroke: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" },
    shadows: [
      { id: "sm",   name: "Small",  value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
      { id: "base", name: "Base",   value: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)" },
      { id: "md",   name: "Medium", value: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
      { id: "lg",   name: "Large",  value: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" },
      { id: "xl",   name: "XL",     value: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" },
    ],
    gradients: [
      { id: "primary", name: "Primary", type: "linear", angle: 135, stops: [{ id: "s1", color: "#4f46e5", position: 0, opacity: 1 }, { id: "s2", color: "#06b6d4", position: 100, opacity: 1 }] },
      { id: "sky",     name: "Sky",     type: "linear", angle: 90,  stops: [{ id: "s1", color: "#38bdf8", position: 0, opacity: 1 }, { id: "s2", color: "#818cf8", position: 100, opacity: 1 }] },
    ],
  },
}
