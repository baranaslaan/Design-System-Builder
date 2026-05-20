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
    motion: {
      durations: { 75: "75ms", 100: "100ms", 150: "150ms", 200: "200ms", 300: "300ms", 500: "500ms", 700: "700ms", 1000: "1000ms" },
      easings: { linear: "linear", in: "cubic-bezier(0.4, 0, 1, 1)", out: "cubic-bezier(0, 0, 0.2, 1)", "in-out": "cubic-bezier(0.4, 0, 0.2, 1)", spring: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
    },
    opacity: { 0: "0", 5: "0.05", 10: "0.1", 20: "0.2", 30: "0.3", 40: "0.4", 50: "0.5", 60: "0.6", 70: "0.7", 80: "0.8", 90: "0.9", 95: "0.95", 100: "1" },
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" },
    zIndex: { 0: "0", 10: "10", 20: "20", 30: "30", 40: "40", 50: "50", auto: "auto", dropdown: "1000", sticky: "1020", modal: "1050", popover: "1070", tooltip: "1080" },
    blur: { none: "0", sm: "4px", base: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "40px", "3xl": "64px" },
  },

  material: {
    name: "Material 3",
    version: "1.0.0",
    colors: {
      palettes: [
        // M3 tonal palettes — values approximate the reference key tones (0/10/20/30/40/50/60/70/80/90/95)
        {
          id: "primary", name: "Primary",
          shades: {
            50: "#eaddff",  100: "#d0bcff", 200: "#b69df8", 300: "#9a82db",
            400: "#7f67be", 500: "#6750a4", 600: "#4f378b", 700: "#381e72",
            800: "#21005d", 900: "#170040", 950: "#0a0029",
          },
        },
        {
          id: "secondary", name: "Secondary",
          shades: {
            50: "#e8def8", 100: "#ccc2dc", 200: "#b0a7c0", 300: "#958da5",
            400: "#7a7289", 500: "#625b71", 600: "#4a4458", 700: "#332d41",
            800: "#1d192b", 900: "#100e1a", 950: "#06050a",
          },
        },
        {
          id: "tertiary", name: "Tertiary",
          shades: {
            50: "#ffd8e4", 100: "#efb8c8", 200: "#d29dac", 300: "#b58392",
            400: "#986977", 500: "#7d5260", 600: "#633b48", 700: "#492532",
            800: "#31111d", 900: "#1f0a13", 950: "#100308",
          },
        },
        {
          id: "error", name: "Error",
          shades: {
            50: "#f9dedc", 100: "#f2b8b5", 200: "#ec928e", 300: "#e46962",
            400: "#dc362e", 500: "#b3261e", 600: "#8c1d18", 700: "#601410",
            800: "#410e0b", 900: "#270604", 950: "#150201",
          },
        },
        {
          id: "neutral", name: "Neutral",
          shades: {
            50: "#f5eff7", 100: "#e6e1e5", 200: "#c9c5ca", 300: "#aeaaae",
            400: "#939094", 500: "#79767a", 600: "#605d62", 700: "#48464a",
            800: "#313033", 900: "#1c1b1f", 950: "#0f0e11",
          },
        },
        {
          id: "neutral-variant", name: "Neutral Variant",
          shades: {
            50: "#f1eaee", 100: "#e7e0ec", 200: "#cac4d0", 300: "#aea9b4",
            400: "#938f99", 500: "#79747e", 600: "#605d66", 700: "#49454f",
            800: "#322f37", 900: "#1d1a22", 950: "#100d14",
          },
        },
      ],
      semantic: [
        { id: "primary",    name: "Primary",    lightValue: "#6750a4", darkValue: "#d0bcff", lightRef: "primary.500",          darkRef: "primary.100"         },
        { id: "secondary",  name: "Secondary",  lightValue: "#625b71", darkValue: "#ccc2dc", lightRef: "secondary.500",        darkRef: "secondary.100"       },
        { id: "tertiary",   name: "Tertiary",   lightValue: "#7d5260", darkValue: "#efb8c8", lightRef: "tertiary.500",         darkRef: "tertiary.100"        },
        { id: "success",    name: "Success",    lightValue: "#386a20", darkValue: "#a3d977" },
        { id: "warning",    name: "Warning",    lightValue: "#8c4a00", darkValue: "#ffb77c" },
        { id: "danger",     name: "Danger",     lightValue: "#b3261e", darkValue: "#f2b8b5", lightRef: "error.500",            darkRef: "error.100"           },
        { id: "info",       name: "Info",       lightValue: "#0061a4", darkValue: "#9ecaff" },
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
    motion: {
      durations: { short1: "50ms", short2: "100ms", short3: "150ms", short4: "200ms", medium1: "250ms", medium2: "300ms", medium3: "350ms", medium4: "400ms", long1: "450ms", long2: "500ms", extraLong1: "700ms", extraLong2: "900ms" },
      easings: { linear: "linear", standard: "cubic-bezier(0.2, 0, 0, 1)", "standard-accelerate": "cubic-bezier(0.3, 0, 1, 1)", "standard-decelerate": "cubic-bezier(0, 0, 0, 1)", emphasized: "cubic-bezier(0.2, 0, 0, 1)", "emphasized-accelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)", "emphasized-decelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)" },
    },
    opacity: { 0: "0", 4: "0.04", 8: "0.08", 12: "0.12", 16: "0.16", 38: "0.38", 60: "0.60", 87: "0.87", 100: "1" },
    breakpoints: { compact: "0px", medium: "600px", expanded: "840px", large: "1200px", extraLarge: "1600px" },
    zIndex: { default: "0", drawer: "100", appbar: "200", modal: "400", snackbar: "500", tooltip: "600" },
    blur: { none: "0", subtle: "8px", standard: "16px", strong: "32px" },
  },

  tailwind: {
    name: "Tailwind CSS",
    version: "1.0.0",
    colors: {
      palettes: [
        // Neutrals
        { id: "slate",   name: "Slate",   shades: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" } },
        { id: "gray",    name: "Gray",    shades: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712" } },
        { id: "zinc",    name: "Zinc",    shades: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" } },
        { id: "neutral", name: "Neutral", shades: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a" } },
        { id: "stone",   name: "Stone",   shades: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09" } },
        // Warms
        { id: "red",     name: "Red",     shades: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" } },
        { id: "orange",  name: "Orange",  shades: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" } },
        { id: "amber",   name: "Amber",   shades: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" } },
        { id: "yellow",  name: "Yellow",  shades: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006" } },
        // Greens
        { id: "lime",    name: "Lime",    shades: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#1a2e05" } },
        { id: "green",   name: "Green",   shades: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16" } },
        { id: "emerald", name: "Emerald", shades: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" } },
        { id: "teal",    name: "Teal",    shades: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" } },
        // Cools
        { id: "cyan",    name: "Cyan",    shades: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344" } },
        { id: "sky",     name: "Sky",     shades: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49" } },
        { id: "blue",    name: "Blue",    shades: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" } },
        { id: "indigo",  name: "Indigo",  shades: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" } },
        // Purples / Pinks
        { id: "violet",  name: "Violet",  shades: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" } },
        { id: "purple",  name: "Purple",  shades: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764" } },
        { id: "fuchsia", name: "Fuchsia", shades: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#4a044e" } },
        { id: "pink",    name: "Pink",    shades: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#500724" } },
        { id: "rose",    name: "Rose",    shades: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519" } },
      ],
      semantic: [
        { id: "primary",   name: "Primary",   lightValue: "#4f46e5", darkValue: "#818cf8", lightRef: "indigo.600",  darkRef: "indigo.400"  },
        { id: "secondary", name: "Secondary", lightValue: "#4b5563", darkValue: "#9ca3af", lightRef: "gray.600",    darkRef: "gray.400"    },
        { id: "success",   name: "Success",   lightValue: "#16a34a", darkValue: "#4ade80", lightRef: "green.600",   darkRef: "green.400"   },
        { id: "warning",   name: "Warning",   lightValue: "#ca8a04", darkValue: "#facc15", lightRef: "yellow.600",  darkRef: "yellow.400"  },
        { id: "danger",    name: "Danger",    lightValue: "#dc2626", darkValue: "#f87171", lightRef: "red.600",     darkRef: "red.400"     },
        { id: "info",      name: "Info",      lightValue: "#0284c7", darkValue: "#38bdf8", lightRef: "sky.600",     darkRef: "sky.400"     },
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
    motion: {
      durations: { 75: "75ms", 100: "100ms", 150: "150ms", 200: "200ms", 300: "300ms", 500: "500ms", 700: "700ms", 1000: "1000ms" },
      easings: { linear: "linear", in: "cubic-bezier(0.4, 0, 1, 1)", out: "cubic-bezier(0, 0, 0.2, 1)", "in-out": "cubic-bezier(0.4, 0, 0.2, 1)" },
    },
    opacity: { 0: "0", 5: "0.05", 10: "0.1", 15: "0.15", 20: "0.2", 25: "0.25", 30: "0.3", 40: "0.4", 50: "0.5", 60: "0.6", 70: "0.7", 75: "0.75", 80: "0.8", 90: "0.9", 95: "0.95", 100: "1" },
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" },
    zIndex: { 0: "0", 10: "10", 20: "20", 30: "30", 40: "40", 50: "50", auto: "auto" },
    blur: { none: "0", sm: "4px", base: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "40px", "3xl": "64px" },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  Fluent 2 — Microsoft
  // ═══════════════════════════════════════════════════════════════════════════
  fluent: {
    name: "Fluent 2",
    version: "1.0.0",
    colors: {
      palettes: [
        { id: "brand",     name: "Brand (Communication Blue)", shades: { 50: "#ebf3fc", 100: "#cfe4fa", 200: "#b4d6fa", 300: "#96c6fa", 400: "#77b7f7", 500: "#479ef5", 600: "#1f78d1", 700: "#115ea3", 800: "#0e4775", 900: "#082338", 950: "#061724" } },
        { id: "neutral",   name: "Neutral Grey", shades: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e0e0e0", 300: "#c7c7c7", 400: "#a3a3a3", 500: "#8b8b8b", 600: "#6e6e6e", 700: "#525252", 800: "#383838", 900: "#1f1f1f", 950: "#0a0a0a" } },
        { id: "red",       name: "Dark Red",  shades: { 50: "#f9e9eb", 100: "#f0d6d8", 200: "#e9c5c8", 300: "#dd8c93", 400: "#c34a52", 500: "#c50f1f", 600: "#b1101c", 700: "#960b16", 800: "#6e0811", 900: "#3b0405", 950: "#200203" } },
        { id: "green",     name: "Forest",    shades: { 50: "#e1f5e1", 100: "#c4eac4", 200: "#91d191", 300: "#5db75d", 400: "#299e29", 500: "#107c10", 600: "#0e6a0e", 700: "#0a570a", 800: "#074207", 900: "#042b04", 950: "#021502" } },
        { id: "yellow",    name: "Marigold",  shades: { 50: "#fff8e1", 100: "#ffefc5", 200: "#ffe39b", 300: "#ffd365", 400: "#ffc233", 500: "#eaa300", 600: "#c98a00", 700: "#a47100", 800: "#7d5500", 900: "#523800", 950: "#291c00" } },
        { id: "purple",    name: "Lavender",  shades: { 50: "#f7f4fb", 100: "#ece4f7", 200: "#dccaee", 300: "#c5a3e0", 400: "#a77bd0", 500: "#8764b8", 600: "#6f4ea0", 700: "#583788", 800: "#3f216c", 900: "#260f4d", 950: "#150626" } },
      ],
      semantic: [
        { id: "primary",   name: "Primary",   lightValue: "#115ea3", darkValue: "#479ef5", lightRef: "brand.700",   darkRef: "brand.500"   },
        { id: "secondary", name: "Secondary", lightValue: "#525252", darkValue: "#c7c7c7", lightRef: "neutral.700", darkRef: "neutral.300" },
        { id: "success",   name: "Success",   lightValue: "#107c10", darkValue: "#5db75d", lightRef: "green.500",   darkRef: "green.300"   },
        { id: "warning",   name: "Warning",   lightValue: "#eaa300", darkValue: "#ffc233", lightRef: "yellow.500",  darkRef: "yellow.400"  },
        { id: "danger",    name: "Danger",    lightValue: "#c50f1f", darkValue: "#dd8c93", lightRef: "red.500",     darkRef: "red.300"     },
        { id: "info",      name: "Info",      lightValue: "#479ef5", darkValue: "#96c6fa", lightRef: "brand.500",   darkRef: "brand.300"   },
      ],
    },
    typography: {
      fontSizes: { xs: "0.625rem", sm: "0.75rem", base: "0.875rem", lg: "1rem", xl: "1.125rem", "2xl": "1.25rem", "3xl": "1.5rem", "4xl": "2rem", "5xl": "2.5rem", "6xl": "4rem" },
      fontWeights: { thin: 100, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 },
      lineHeights: { none: "1", tight: "1.143", snug: "1.286", normal: "1.4286", relaxed: "1.5", loose: "1.667" },
      fontFamilies: { sans: "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, sans-serif", serif: "Georgia, serif", mono: "Consolas, 'Courier New', monospace" },
    },
    spacing: { 0: "0px", 1: "2px", 2: "4px", 3: "6px", 4: "8px", 5: "12px", 6: "16px", 8: "20px", 10: "24px", 12: "32px", 16: "40px", 20: "48px", 24: "64px" },
    radius: { none: "0px", sm: "2px", base: "4px", md: "4px", lg: "6px", xl: "8px", "2xl": "12px", "3xl": "16px", full: "9999px" },
    stroke: { 0: "0px", 1: "1px", 2: "2px", 4: "3px", 8: "4px" },
    shadows: [
      { id: "sm",   name: "Shadow 2",  value: "0 0 2px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)" },
      { id: "base", name: "Shadow 4",  value: "0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)" },
      { id: "md",   name: "Shadow 8",  value: "0 0 2px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.14)" },
      { id: "lg",   name: "Shadow 16", value: "0 0 2px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.14)" },
      { id: "xl",   name: "Shadow 28", value: "0 0 8px rgba(0,0,0,0.12), 0 14px 28px rgba(0,0,0,0.14)" },
    ],
    gradients: [
      { id: "brand", name: "Brand", type: "linear", angle: 135, stops: [{ id: "s1", color: "#115ea3", position: 0, opacity: 1 }, { id: "s2", color: "#479ef5", position: 100, opacity: 1 }] },
      { id: "aurora", name: "Aurora", type: "linear", angle: 120, stops: [{ id: "s1", color: "#479ef5", position: 0, opacity: 1 }, { id: "s2", color: "#8764b8", position: 100, opacity: 1 }] },
    ],
    motion: {
      durations: { ultraFast: "50ms", faster: "100ms", fast: "150ms", normal: "200ms", gentle: "250ms", slow: "300ms", slower: "400ms", ultraSlow: "500ms" },
      easings: { linear: "linear", easyEase: "cubic-bezier(0.33, 0, 0.67, 1)", accelerate: "cubic-bezier(0.9, 0.1, 1, 0.2)", decelerate: "cubic-bezier(0.1, 0.9, 0.2, 1)", maxEase: "cubic-bezier(0.8, 0, 0.78, 1)" },
    },
    opacity: { 0: "0", 8: "0.08", 12: "0.12", 16: "0.16", 24: "0.24", 32: "0.32", 50: "0.5", 64: "0.64", 80: "0.8", 100: "1" },
    breakpoints: { small: "320px", medium: "640px", large: "1024px", xLarge: "1366px", xxLarge: "1920px" },
    zIndex: { default: "0", overlay: "1000", contextual: "1050", flyout: "1100", dialog: "10000" },
    blur: { none: "0", thin: "4px", regular: "8px", thick: "16px" },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  Ant Design — Alibaba
  // ═══════════════════════════════════════════════════════════════════════════
  ant: {
    name: "Ant Design",
    version: "1.0.0",
    colors: {
      palettes: [
        { id: "blue",     name: "Daybreak Blue", shades: { 50: "#e6f4ff", 100: "#bae0ff", 200: "#91caff", 300: "#69b1ff", 400: "#4096ff", 500: "#1677ff", 600: "#0958d9", 700: "#003eb3", 800: "#002c8c", 900: "#001d66", 950: "#000e33" } },
        { id: "geekblue", name: "Geek Blue",     shades: { 50: "#f0f5ff", 100: "#d6e4ff", 200: "#adc6ff", 300: "#85a5ff", 400: "#597ef7", 500: "#2f54eb", 600: "#1d39c4", 700: "#10239e", 800: "#061178", 900: "#030852", 950: "#01042e" } },
        { id: "cyan",     name: "Cyan",          shades: { 50: "#e6fffb", 100: "#b5f5ec", 200: "#87e8de", 300: "#5cdbd3", 400: "#36cfc9", 500: "#13c2c2", 600: "#08979c", 700: "#006d75", 800: "#00474f", 900: "#002329", 950: "#001214" } },
        { id: "green",    name: "Polar Green",   shades: { 50: "#f6ffed", 100: "#d9f7be", 200: "#b7eb8f", 300: "#95de64", 400: "#73d13d", 500: "#52c41a", 600: "#389e0d", 700: "#237804", 800: "#135200", 900: "#092b00", 950: "#041500" } },
        { id: "gold",     name: "Calendula Gold", shades: { 50: "#fffbe6", 100: "#fff1b8", 200: "#ffe58f", 300: "#ffd666", 400: "#ffc53d", 500: "#faad14", 600: "#d48806", 700: "#ad6800", 800: "#874d00", 900: "#613400", 950: "#301a00" } },
        { id: "volcano",  name: "Volcano",       shades: { 50: "#fff2e8", 100: "#ffd8bf", 200: "#ffbb96", 300: "#ff9c6e", 400: "#ff7a45", 500: "#fa541c", 600: "#d4380d", 700: "#ad2102", 800: "#871400", 900: "#610b00", 950: "#300500" } },
        { id: "red",      name: "Dust Red",      shades: { 50: "#fff1f0", 100: "#ffccc7", 200: "#ffa39e", 300: "#ff7875", 400: "#ff4d4f", 500: "#f5222d", 600: "#cf1322", 700: "#a8071a", 800: "#820014", 900: "#5c0011", 950: "#2e0008" } },
        { id: "magenta",  name: "Magenta",       shades: { 50: "#fff0f6", 100: "#ffd6e7", 200: "#ffadd2", 300: "#ff85c0", 400: "#f759ab", 500: "#eb2f96", 600: "#c41d7f", 700: "#9e1068", 800: "#780650", 900: "#520339", 950: "#29011c" } },
        { id: "purple",   name: "Golden Purple", shades: { 50: "#f9f0ff", 100: "#efdbff", 200: "#d3adf7", 300: "#b37feb", 400: "#9254de", 500: "#722ed1", 600: "#531dab", 700: "#391085", 800: "#22075e", 900: "#120338", 950: "#08011f" } },
        { id: "grey",     name: "Grey",          shades: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e8e8e8", 300: "#d9d9d9", 400: "#bfbfbf", 500: "#8c8c8c", 600: "#595959", 700: "#434343", 800: "#262626", 900: "#1f1f1f", 950: "#141414" } },
      ],
      semantic: [
        { id: "primary",   name: "Primary",   lightValue: "#1677ff", darkValue: "#4096ff", lightRef: "blue.500",  darkRef: "blue.400"  },
        { id: "secondary", name: "Secondary", lightValue: "#595959", darkValue: "#bfbfbf", lightRef: "grey.600",  darkRef: "grey.400"  },
        { id: "success",   name: "Success",   lightValue: "#52c41a", darkValue: "#95de64", lightRef: "green.500", darkRef: "green.300" },
        { id: "warning",   name: "Warning",   lightValue: "#faad14", darkValue: "#ffc53d", lightRef: "gold.500",  darkRef: "gold.400"  },
        { id: "danger",    name: "Danger",    lightValue: "#f5222d", darkValue: "#ff7875", lightRef: "red.500",   darkRef: "red.300"   },
        { id: "info",      name: "Info",      lightValue: "#1677ff", darkValue: "#69b1ff", lightRef: "blue.500",  darkRef: "blue.300"  },
      ],
    },
    typography: {
      fontSizes: { xs: "0.75rem", sm: "0.812rem", base: "0.875rem", lg: "1rem", xl: "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem", "5xl": "3rem", "6xl": "3.75rem" },
      fontWeights: { thin: 100, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 },
      lineHeights: { none: "1", tight: "1.4", snug: "1.5", normal: "1.5715", relaxed: "1.7", loose: "2" },
      fontFamilies: { sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", serif: "Georgia, serif", mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace" },
    },
    spacing: { 0: "0px", 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px", 8: "32px", 10: "40px", 12: "48px", 16: "64px", 20: "80px", 24: "96px" },
    radius: { none: "0px", sm: "2px", base: "4px", md: "6px", lg: "8px", xl: "12px", "2xl": "16px", "3xl": "20px", full: "9999px" },
    stroke: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" },
    shadows: [
      { id: "sm",   name: "Box Shadow",         value: "0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)" },
      { id: "base", name: "Box Shadow Secondary", value: "0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)" },
      { id: "md",   name: "Box Shadow Tertiary", value: "0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)" },
      { id: "lg",   name: "Box Shadow Large",   value: "0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)" },
      { id: "xl",   name: "Box Shadow XL",      value: "0 24px 48px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)" },
    ],
    gradients: [
      { id: "primary", name: "Primary", type: "linear", angle: 135, stops: [{ id: "s1", color: "#1677ff", position: 0, opacity: 1 }, { id: "s2", color: "#722ed1", position: 100, opacity: 1 }] },
      { id: "sunset", name: "Sunset", type: "linear", angle: 90, stops: [{ id: "s1", color: "#faad14", position: 0, opacity: 1 }, { id: "s2", color: "#f5222d", position: 100, opacity: 1 }] },
    ],
    motion: {
      durations: { fast: "100ms", mid: "200ms", slow: "300ms" },
      easings: { "ease-in-out": "cubic-bezier(0.645, 0.045, 0.355, 1)", "ease-out": "cubic-bezier(0.215, 0.61, 0.355, 1)", "ease-in": "cubic-bezier(0.55, 0.055, 0.675, 0.19)", "ease-out-back": "cubic-bezier(0.12, 0.4, 0.29, 1.46)", "ease-in-back": "cubic-bezier(0.71, -0.46, 0.88, 0.6)" },
    },
    opacity: { 0: "0", 4: "0.04", 6: "0.06", 12: "0.12", 25: "0.25", 45: "0.45", 65: "0.65", 85: "0.85", 100: "1" },
    breakpoints: { xs: "480px", sm: "576px", md: "768px", lg: "992px", xl: "1200px", xxl: "1600px" },
    zIndex: { base: "0", affix: "10", picker: "900", popover: "1030", popconfirm: "1060", tooltip: "1070", dropdown: "1050", modalMask: "1000", modal: "1000", drawer: "1000", message: "1010", notification: "1010" },
    blur: { none: "0", sm: "4px", base: "8px", lg: "16px" },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  Carbon Design System — IBM
  // ═══════════════════════════════════════════════════════════════════════════
  carbon: {
    name: "IBM Carbon",
    version: "1.0.0",
    colors: {
      palettes: [
        { id: "blue",      name: "Blue",      shades: { 50: "#edf5ff", 100: "#d0e2ff", 200: "#a6c8ff", 300: "#78a9ff", 400: "#4589ff", 500: "#0f62fe", 600: "#0043ce", 700: "#002d9c", 800: "#001d6c", 900: "#001141", 950: "#000820" } },
        { id: "gray",      name: "Gray",      shades: { 50: "#f4f4f4", 100: "#e0e0e0", 200: "#c6c6c6", 300: "#a8a8a8", 400: "#8d8d8d", 500: "#6f6f6f", 600: "#525252", 700: "#393939", 800: "#262626", 900: "#161616", 950: "#0a0a0a" } },
        { id: "cool-gray", name: "Cool Gray", shades: { 50: "#f2f4f8", 100: "#dde1e6", 200: "#c1c7cd", 300: "#a2a9b0", 400: "#878d96", 500: "#697077", 600: "#4d5358", 700: "#343a3f", 800: "#21272a", 900: "#121619", 950: "#080a0c" } },
        { id: "red",       name: "Red",       shades: { 50: "#fff1f1", 100: "#ffd7d9", 200: "#ffb3b8", 300: "#ff8389", 400: "#fa4d56", 500: "#da1e28", 600: "#a2191f", 700: "#750e13", 800: "#520408", 900: "#2d0709", 950: "#170304" } },
        { id: "green",     name: "Green",     shades: { 50: "#defbe6", 100: "#a7f0ba", 200: "#6fdc8c", 300: "#42be65", 400: "#24a148", 500: "#198038", 600: "#0e6027", 700: "#044317", 800: "#022d0d", 900: "#071908", 950: "#040e04" } },
        { id: "yellow",    name: "Yellow",    shades: { 50: "#fcf4d6", 100: "#fddc69", 200: "#f1c21b", 300: "#d2a106", 400: "#b28600", 500: "#8e6a00", 600: "#684e00", 700: "#483700", 800: "#302400", 900: "#1c1500", 950: "#0e0a00" } },
        { id: "purple",    name: "Purple",    shades: { 50: "#f6f2ff", 100: "#e8daff", 200: "#d4bbff", 300: "#be95ff", 400: "#a56eff", 500: "#8a3ffc", 600: "#6929c4", 700: "#491d8b", 800: "#31135e", 900: "#1c0f30", 950: "#0e0718" } },
        { id: "teal",      name: "Teal",      shades: { 50: "#d9fbfb", 100: "#9ef0f0", 200: "#3ddbd9", 300: "#08bdba", 400: "#009d9a", 500: "#007d79", 600: "#005d5d", 700: "#004144", 800: "#022b30", 900: "#081a1c", 950: "#040d0e" } },
      ],
      semantic: [
        { id: "primary",   name: "Primary",   lightValue: "#0f62fe", darkValue: "#4589ff", lightRef: "blue.500",     darkRef: "blue.400"     },
        { id: "secondary", name: "Secondary", lightValue: "#393939", darkValue: "#a8a8a8", lightRef: "gray.700",     darkRef: "gray.300"     },
        { id: "success",   name: "Success",   lightValue: "#198038", darkValue: "#42be65", lightRef: "green.500",    darkRef: "green.300"    },
        { id: "warning",   name: "Warning",   lightValue: "#f1c21b", darkValue: "#fddc69", lightRef: "yellow.200",   darkRef: "yellow.100"   },
        { id: "danger",    name: "Danger",    lightValue: "#da1e28", darkValue: "#fa4d56", lightRef: "red.500",      darkRef: "red.400"      },
        { id: "info",      name: "Info",      lightValue: "#0f62fe", darkValue: "#78a9ff", lightRef: "blue.500",     darkRef: "blue.300"     },
      ],
    },
    typography: {
      fontSizes: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.75rem", "3xl": "2rem", "4xl": "2.625rem", "5xl": "3rem", "6xl": "3.75rem" },
      fontWeights: { thin: 100, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 },
      lineHeights: { none: "1", tight: "1.25", snug: "1.334", normal: "1.5", relaxed: "1.625", loose: "1.75" },
      fontFamilies: { sans: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif", serif: "'IBM Plex Serif', Georgia, serif", mono: "'IBM Plex Mono', 'Menlo', monospace" },
    },
    spacing: { 0: "0px", 1: "2px", 2: "4px", 3: "8px", 4: "12px", 5: "16px", 6: "24px", 8: "32px", 10: "40px", 12: "48px", 16: "64px", 20: "80px", 24: "96px" },
    radius: { none: "0px", sm: "0px", base: "0px", md: "2px", lg: "4px", xl: "8px", "2xl": "12px", "3xl": "16px", full: "9999px" },
    stroke: { 0: "0px", 1: "1px", 2: "2px", 4: "3px", 8: "4px" },
    shadows: [
      { id: "sm",   name: "Layer 01", value: "0 1px 2px 0 rgba(0,0,0,0.30)" },
      { id: "base", name: "Layer 02", value: "0 2px 4px 0 rgba(0,0,0,0.30)" },
      { id: "md",   name: "Layer 03", value: "0 4px 8px 0 rgba(0,0,0,0.30)" },
      { id: "lg",   name: "Layer 04", value: "0 12px 24px 0 rgba(0,0,0,0.30)" },
      { id: "xl",   name: "Layer 05", value: "0 24px 48px 0 rgba(0,0,0,0.30)" },
    ],
    gradients: [
      { id: "primary",  name: "IBM",      type: "linear", angle: 135, stops: [{ id: "s1", color: "#0f62fe", position: 0, opacity: 1 }, { id: "s2", color: "#8a3ffc", position: 100, opacity: 1 }] },
      { id: "infinity", name: "Infinity", type: "linear", angle: 90,  stops: [{ id: "s1", color: "#001141", position: 0, opacity: 1 }, { id: "s2", color: "#0f62fe", position: 50, opacity: 1 }, { id: "s3", color: "#8a3ffc", position: 100, opacity: 1 }] },
    ],
    motion: {
      durations: { "fast-01": "70ms", "fast-02": "110ms", "moderate-01": "150ms", "moderate-02": "240ms", "slow-01": "400ms", "slow-02": "700ms" },
      easings: { "productive-standard": "cubic-bezier(0.2, 0, 0.38, 0.9)", "productive-entrance": "cubic-bezier(0, 0, 0.38, 0.9)", "productive-exit": "cubic-bezier(0.2, 0, 1, 0.9)", "expressive-standard": "cubic-bezier(0.4, 0.14, 0.3, 1)", "expressive-entrance": "cubic-bezier(0, 0, 0.3, 1)", "expressive-exit": "cubic-bezier(0.4, 0.14, 1, 1)" },
    },
    opacity: { 0: "0", "ui-01": "0.5", "ui-02": "0.75", 100: "1" },
    breakpoints: { sm: "320px", md: "672px", lg: "1056px", xlg: "1312px", max: "1584px" },
    zIndex: { hidden: "-1", header: "6000", overlay: "6000", modal: "9000", toast: "9000", floating: "10000" },
    blur: { none: "0", subtle: "5px", standard: "10px", strong: "20px" },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  Bootstrap 5
  // ═══════════════════════════════════════════════════════════════════════════
  bootstrap: {
    name: "Bootstrap 5",
    version: "1.0.0",
    colors: {
      palettes: [
        { id: "blue",   name: "Blue",   shades: { 50: "#e7f1ff", 100: "#cfe2ff", 200: "#9ec5fe", 300: "#6ea8fe", 400: "#3d8bfd", 500: "#0d6efd", 600: "#0a58ca", 700: "#084298", 800: "#052c65", 900: "#031633", 950: "#020b1a" } },
        { id: "indigo", name: "Indigo", shades: { 50: "#f0e6ff", 100: "#e0cffc", 200: "#c29ffa", 300: "#a370f7", 400: "#8540f5", 500: "#6610f2", 600: "#520dc2", 700: "#3d0a91", 800: "#290661", 900: "#140330", 950: "#0a0218" } },
        { id: "purple", name: "Purple", shades: { 50: "#f3effa", 100: "#e2d9f3", 200: "#c5b3e6", 300: "#a98eda", 400: "#8c68cd", 500: "#6f42c1", 600: "#59359a", 700: "#432874", 800: "#2c1a4d", 900: "#160d27", 950: "#0b0613" } },
        { id: "pink",   name: "Pink",   shades: { 50: "#ffe3ef", 100: "#f7d6e6", 200: "#efadce", 300: "#e685b5", 400: "#de5c9d", 500: "#d63384", 600: "#ab296a", 700: "#801f4f", 800: "#561435", 900: "#2b0a1a", 950: "#16050d" } },
        { id: "red",    name: "Red",    shades: { 50: "#fbe9eb", 100: "#f8d7da", 200: "#f1aeb5", 300: "#ea868f", 400: "#e35d6a", 500: "#dc3545", 600: "#b02a37", 700: "#842029", 800: "#58151c", 900: "#2c0b0e", 950: "#160507" } },
        { id: "orange", name: "Orange", shades: { 50: "#fff1e6", 100: "#ffe5d0", 200: "#fecba1", 300: "#feb272", 400: "#fd9843", 500: "#fd7e14", 600: "#ca6510", 700: "#984c0c", 800: "#653208", 900: "#331904", 950: "#1a0c02" } },
        { id: "yellow", name: "Yellow", shades: { 50: "#fff8e1", 100: "#fff3cd", 200: "#ffe69c", 300: "#ffda6a", 400: "#ffcd39", 500: "#ffc107", 600: "#cc9a06", 700: "#997404", 800: "#664d03", 900: "#332701", 950: "#1a1300" } },
        { id: "green",  name: "Green",  shades: { 50: "#e8f5ec", 100: "#d1e7dd", 200: "#a3cfbb", 300: "#75b798", 400: "#479f76", 500: "#198754", 600: "#146c43", 700: "#0f5132", 800: "#0a3622", 900: "#051b11", 950: "#020d08" } },
        { id: "teal",   name: "Teal",   shades: { 50: "#dffaf3", 100: "#d2f4ea", 200: "#a6e9d5", 300: "#79dfc1", 400: "#4dd4ac", 500: "#20c997", 600: "#1aa179", 700: "#13795b", 800: "#0d503c", 900: "#06281e", 950: "#03140f" } },
        { id: "cyan",   name: "Cyan",   shades: { 50: "#e7f8fc", 100: "#cff4fc", 200: "#9eeaf9", 300: "#6edff6", 400: "#3dd5f3", 500: "#0dcaf0", 600: "#0aa2c0", 700: "#087990", 800: "#055160", 900: "#032830", 950: "#011418" } },
        { id: "gray",   name: "Gray",   shades: { 50: "#f8f9fa", 100: "#e9ecef", 200: "#dee2e6", 300: "#ced4da", 400: "#adb5bd", 500: "#6c757d", 600: "#495057", 700: "#343a40", 800: "#212529", 900: "#101316", 950: "#080a0b" } },
      ],
      semantic: [
        { id: "primary",   name: "Primary",   lightValue: "#0d6efd", darkValue: "#6ea8fe", lightRef: "blue.500",   darkRef: "blue.300"   },
        { id: "secondary", name: "Secondary", lightValue: "#6c757d", darkValue: "#adb5bd", lightRef: "gray.500",   darkRef: "gray.400"   },
        { id: "success",   name: "Success",   lightValue: "#198754", darkValue: "#75b798", lightRef: "green.500",  darkRef: "green.300"  },
        { id: "warning",   name: "Warning",   lightValue: "#ffc107", darkValue: "#ffcd39", lightRef: "yellow.500", darkRef: "yellow.400" },
        { id: "danger",    name: "Danger",    lightValue: "#dc3545", darkValue: "#ea868f", lightRef: "red.500",    darkRef: "red.300"    },
        { id: "info",      name: "Info",      lightValue: "#0dcaf0", darkValue: "#6edff6", lightRef: "cyan.500",   darkRef: "cyan.300"   },
      ],
    },
    typography: {
      fontSizes: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.25rem", xl: "1.5rem", "2xl": "1.75rem", "3xl": "2rem", "4xl": "2.5rem", "5xl": "3rem", "6xl": "5rem" },
      fontWeights: { thin: 100, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 },
      lineHeights: { none: "1", tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2" },
      fontFamilies: { sans: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", serif: "Georgia, 'Times New Roman', serif", mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
    },
    spacing: { 0: "0px", 1: "4px", 2: "8px", 3: "16px", 4: "24px", 5: "32px", 6: "48px", 8: "64px", 10: "80px", 12: "96px", 16: "128px", 20: "160px", 24: "192px" },
    radius: { none: "0px", sm: "4px", base: "6px", md: "8px", lg: "12px", xl: "16px", "2xl": "20px", "3xl": "24px", full: "9999px" },
    stroke: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" },
    shadows: [
      { id: "sm",   name: "Small",  value: "0 0.125rem 0.25rem rgba(0,0,0,0.075)" },
      { id: "base", name: "Base",   value: "0 0.5rem 1rem rgba(0,0,0,0.15)" },
      { id: "md",   name: "Medium", value: "0 1rem 3rem rgba(0,0,0,0.175)" },
      { id: "lg",   name: "Large",  value: "0 1.5rem 4rem rgba(0,0,0,0.20)" },
      { id: "xl",   name: "Inset",  value: "inset 0 1px 2px rgba(0,0,0,0.075)" },
    ],
    gradients: [
      { id: "primary", name: "Primary", type: "linear", angle: 135, stops: [{ id: "s1", color: "#0d6efd", position: 0, opacity: 1 }, { id: "s2", color: "#6610f2", position: 100, opacity: 1 }] },
      { id: "warning", name: "Warning", type: "linear", angle: 90,  stops: [{ id: "s1", color: "#ffc107", position: 0, opacity: 1 }, { id: "s2", color: "#fd7e14", position: 100, opacity: 1 }] },
    ],
    motion: {
      durations: { fast: "150ms", base: "300ms", slow: "600ms" },
      easings: { ease: "ease", "ease-in-out": "ease-in-out", "ease-in": "ease-in", "ease-out": "ease-out", linear: "linear" },
    },
    opacity: { 0: "0", 25: "0.25", 50: "0.5", 75: "0.75", 100: "1" },
    breakpoints: { xs: "0px", sm: "576px", md: "768px", lg: "992px", xl: "1200px", xxl: "1400px" },
    zIndex: { dropdown: "1000", sticky: "1020", fixed: "1030", "modal-backdrop": "1050", offcanvas: "1055", modal: "1060", popover: "1070", tooltip: "1080", toast: "1090" },
    blur: { none: "0", sm: "4px", base: "8px", lg: "16px" },
  },
}
