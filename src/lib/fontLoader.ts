const loaded = new Set<string>()

export function loadGoogleFont(fontName: string, weights = "300;400;500;600;700") {
  if (typeof document === "undefined") return
  const key = `${fontName}:${weights}`
  if (loaded.has(key)) return
  loaded.add(key)

  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@${weights}&display=swap`
  document.head.appendChild(link)
}

export function extractFontName(fontFamily: string): string | null {
  const match = fontFamily.match(/^["']?([^,"']+)["']?/)
  return match ? match[1].trim() : null
}

export function loadFontFromFamily(fontFamily: string) {
  const name = extractFontName(fontFamily)
  if (name) loadGoogleFont(name)
}
