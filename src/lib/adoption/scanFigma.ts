// Figma scan: list published components + count instances per component.
// Reuses Figma OAuth/PAT pattern already used elsewhere; pass a bearer here.

const FIGMA = "https://api.figma.com/v1"

// Figma file keys are alphanumeric strings; reject anything else before we
// interpolate into a URL or send the user's token along with the request.
const SAFE_KEY   = /^[A-Za-z0-9]{6,64}$/
const SAFE_TOKEN = /^[A-Za-z0-9_-]+$/

export interface FigmaScanResult {
  filesScanned: 1
  usage: Array<{ component: string; file: string; occurrences: number }>
}

async function fg(url: string, token: string) {
  if (!SAFE_TOKEN.test(token)) throw new Error("Invalid Figma token format")
  const res = await fetch(url, { headers: { "X-Figma-Token": token } })
  if (!res.ok) throw new Error(`Figma ${res.status}`)
  return res.json()
}

export async function scanFigmaFile(fileKey: string, token: string): Promise<FigmaScanResult> {
  if (!SAFE_KEY.test(fileKey)) throw new Error(`Invalid file key: ${JSON.stringify(fileKey)}`)
  // Pull components meta + node tree.
  const [components, file] = await Promise.all([
    fg(`${FIGMA}/files/${fileKey}/components`, token).catch(() => ({ meta: { components: [] } })),
    fg(`${FIGMA}/files/${fileKey}`, token),
  ])

  const componentNames = new Set<string>(
    (components?.meta?.components ?? []).map((c: { name: string }) => c.name)
  )

  // Count INSTANCE nodes by mainComponent name. Figma node type "INSTANCE"
  // carries componentId; resolve names by walking children.
  const counts = new Map<string, number>()
  const componentIdToName = new Map<string, string>()
  for (const c of components?.meta?.components ?? []) {
    componentIdToName.set(c.node_id ?? c.key, c.name)
  }

  type Node = { type?: string; componentId?: string; mainComponent?: { name?: string }; name?: string; children?: Node[] }
  const walk = (n: Node) => {
    if (!n) return
    if (n.type === "INSTANCE") {
      const name =
        (n.componentId && componentIdToName.get(n.componentId)) ||
        n.mainComponent?.name || n.name || "Unknown"
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    n.children?.forEach(walk)
  }
  walk(file?.document)

  // Make sure registry components with 0 usage still surface (rate calc).
  const usage: FigmaScanResult["usage"] = []
  for (const name of componentNames) {
    usage.push({ component: name, file: fileKey, occurrences: counts.get(name) ?? 0 })
  }
  // Include instances of components not in the published library too.
  for (const [name, n] of counts) {
    if (!componentNames.has(name)) usage.push({ component: name, file: fileKey, occurrences: n })
  }

  return { filesScanned: 1, usage }
}
