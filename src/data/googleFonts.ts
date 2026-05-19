export type FontCategory = "sans-serif" | "serif" | "monospace" | "display"

export interface GoogleFont {
  name: string
  category: FontCategory
  weights?: string
}

export const GOOGLE_FONTS: GoogleFont[] = [
  // Sans-serif
  { name: "Inter",              category: "sans-serif" },
  { name: "Roboto",             category: "sans-serif" },
  { name: "Open Sans",          category: "sans-serif" },
  { name: "Lato",               category: "sans-serif" },
  { name: "Montserrat",         category: "sans-serif" },
  { name: "Poppins",            category: "sans-serif" },
  { name: "Nunito",             category: "sans-serif" },
  { name: "Nunito Sans",        category: "sans-serif" },
  { name: "Raleway",            category: "sans-serif" },
  { name: "Ubuntu",             category: "sans-serif" },
  { name: "Oswald",             category: "sans-serif" },
  { name: "PT Sans",            category: "sans-serif" },
  { name: "Noto Sans",          category: "sans-serif" },
  { name: "Work Sans",          category: "sans-serif" },
  { name: "Mulish",             category: "sans-serif" },
  { name: "Outfit",             category: "sans-serif" },
  { name: "Plus Jakarta Sans",  category: "sans-serif" },
  { name: "DM Sans",            category: "sans-serif" },
  { name: "Manrope",            category: "sans-serif" },
  { name: "Figtree",            category: "sans-serif" },
  { name: "Geist",              category: "sans-serif" },
  { name: "Sora",               category: "sans-serif" },
  { name: "Lexend",             category: "sans-serif" },
  { name: "Hanken Grotesk",     category: "sans-serif" },
  { name: "Be Vietnam Pro",     category: "sans-serif" },
  { name: "Source Sans 3",      category: "sans-serif" },
  { name: "Karla",              category: "sans-serif" },
  { name: "Barlow",             category: "sans-serif" },
  { name: "Rubik",              category: "sans-serif" },
  { name: "Exo 2",              category: "sans-serif" },

  // Serif
  { name: "Merriweather",         category: "serif" },
  { name: "Playfair Display",     category: "serif" },
  { name: "Lora",                 category: "serif" },
  { name: "PT Serif",             category: "serif" },
  { name: "Crimson Text",         category: "serif" },
  { name: "EB Garamond",          category: "serif" },
  { name: "Libre Baskerville",    category: "serif" },
  { name: "Cormorant Garamond",   category: "serif" },
  { name: "Noto Serif",           category: "serif" },
  { name: "Source Serif 4",       category: "serif" },
  { name: "Bitter",               category: "serif" },
  { name: "Zilla Slab",           category: "serif" },
  { name: "Spectral",             category: "serif" },
  { name: "Arvo",                 category: "serif" },
  { name: "Cardo",                category: "serif" },

  // Monospace
  { name: "Fira Code",        category: "monospace", weights: "300;400;500;600;700" },
  { name: "JetBrains Mono",   category: "monospace", weights: "300;400;500;600;700;800" },
  { name: "Source Code Pro",  category: "monospace", weights: "300;400;500;600;700" },
  { name: "Roboto Mono",      category: "monospace", weights: "300;400;500;600;700" },
  { name: "Space Mono",       category: "monospace", weights: "400;700" },
  { name: "IBM Plex Mono",    category: "monospace", weights: "300;400;500;600;700" },
  { name: "Inconsolata",      category: "monospace", weights: "300;400;500;600;700" },
  { name: "DM Mono",          category: "monospace", weights: "300;400;500" },
  { name: "Geist Mono",       category: "monospace", weights: "300;400;500;600;700" },

  // Display
  { name: "Bebas Neue",       category: "display", weights: "400" },
  { name: "Righteous",        category: "display", weights: "400" },
  { name: "Abril Fatface",    category: "display", weights: "400" },
  { name: "Pacifico",         category: "display", weights: "400" },
  { name: "Lobster",          category: "display", weights: "400" },
  { name: "Titan One",        category: "display", weights: "400" },
  { name: "Fredoka",          category: "display", weights: "300;400;500;600;700" },
  { name: "Comfortaa",        category: "display", weights: "300;400;500;600;700" },
]

export function getFontCssName(fontName: string): string {
  return `"${fontName}", ${getFontFallback(fontName)}`
}

function getFontFallback(fontName: string): string {
  const font = GOOGLE_FONTS.find(f => f.name === fontName)
  if (!font) return "sans-serif"
  switch (font.category) {
    case "serif":     return "Georgia, serif"
    case "monospace": return "monospace"
    default:          return "system-ui, sans-serif"
  }
}
