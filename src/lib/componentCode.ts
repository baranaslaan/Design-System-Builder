export type CodeFormat = "react-tailwind" | "html-css" | "jsx-style"

export interface ComponentCodeSpec {
  /** Component display name shown in modal header */
  name: string
  /** Code per format */
  formats: Record<CodeFormat, string>
}

/** Indent helper */
const i = (n: number) => " ".repeat(n)

// ── Buttons ──────────────────────────────────────────────────────────────────
export function buttonCode(variant: "primary" | "success" | "danger" | "outline", label: string): ComponentCodeSpec {
  const isOutline = variant === "outline"
  const semId: "primary" | "success" | "danger" = isOutline ? "primary" : variant

  const styleProps = isOutline
    ? `background: "transparent",\n${i(8)}color: "var(--color-foreground)",\n${i(8)}border: "var(--stroke-1) solid var(--color-border)",`
    : `background: "var(--color-${semId})",\n${i(8)}color: "#fff",\n${i(8)}border: "none",`

  return {
    name: `Button — ${label}`,
    formats: {
      "react-tailwind": `<button
  className="px-4 py-1.5 rounded-[var(--radius-lg)] text-[var(--font-size-sm)] font-[var(--font-weight-medium)] shadow-[var(--shadow-sm)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
  style={{
    ${styleProps}
  }}
>
  ${label}
</button>`,
      "html-css": `<button class="btn btn-${variant}">${label}</button>

<style>
  .btn-${variant} {
    padding: 6px 16px;
    border-radius: var(--radius-lg);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    box-shadow: var(--shadow-sm);
    ${isOutline
      ? `background: transparent;\n    color: var(--color-foreground);\n    border: var(--stroke-1) solid var(--color-border);`
      : `background: var(--color-${semId});\n    color: #fff;\n    border: none;`}
    cursor: pointer;
    transition: transform 0.15s;
  }
  .btn-${variant}:hover { transform: scale(1.02); }
</style>`,
      "jsx-style": `<button
  style={{
    padding: "6px 16px",
    borderRadius: "var(--radius-lg)",
    fontSize: "var(--font-size-sm)",
    fontWeight: "var(--font-weight-medium)",
    boxShadow: "var(--shadow-sm)",
    ${styleProps}
    cursor: "pointer",
  }}
>
  ${label}
</button>`,
    },
  }
}

// ── Badge ────────────────────────────────────────────────────────────────────
export function badgeCode(semantic: "primary" | "success" | "danger" | "warning", label: string): ComponentCodeSpec {
  return {
    name: `Badge — ${label}`,
    formats: {
      "react-tailwind": `<span
  className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-[var(--font-weight-medium)]"
  style={{
    background: "color-mix(in srgb, var(--color-${semantic}) 12%, transparent)",
    color: "var(--color-${semantic})",
  }}
>
  ${label}
</span>`,
      "html-css": `<span class="badge badge-${semantic}">${label}</span>

<style>
  .badge-${semantic} {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    background: color-mix(in srgb, var(--color-${semantic}) 12%, transparent);
    color: var(--color-${semantic});
  }
</style>`,
      "jsx-style": `<span
  style={{
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "var(--radius-full)",
    fontSize: "var(--font-size-xs)",
    fontWeight: 500,
    background: "color-mix(in srgb, var(--color-${semantic}) 12%, transparent)",
    color: "var(--color-${semantic})",
  }}
>
  ${label}
</span>`,
    },
  }
}

// ── Cards ────────────────────────────────────────────────────────────────────
export function elevatedCardCode(): ComponentCodeSpec {
  return {
    name: "Card — Elevated",
    formats: {
      "react-tailwind": `<div
  className="p-4 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border"
  style={{
    background: "var(--color-surface)",
    borderColor: "var(--color-border)",
    borderWidth: "var(--stroke-1)",
  }}
>
  <div className="w-8 h-8 rounded-[var(--radius-lg)] flex items-center justify-center mb-2.5"
       style={{ background: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
    <span className="w-3.5 h-3.5 rounded-full" style={{ background: "var(--color-primary)" }} />
  </div>
  <div className="font-[var(--font-weight-semibold)] text-[var(--font-size-sm)] mb-1">Elevated Card</div>
  <div className="text-[var(--font-size-xs)]" style={{ color: "var(--color-muted)" }}>
    Uses radius, shadow and stroke tokens.
  </div>
</div>`,
      "html-css": `<div class="card card-elevated">
  <div class="card-icon">
    <span class="card-dot"></span>
  </div>
  <div class="card-title">Elevated Card</div>
  <div class="card-desc">Uses radius, shadow and stroke tokens.</div>
</div>

<style>
  .card-elevated {
    padding: 16px;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    background: var(--color-surface);
    border: var(--stroke-1) solid var(--color-border);
  }
  .card-icon {
    width: 32px; height: 32px;
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--color-primary) 20%, transparent);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 10px;
  }
  .card-dot {
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--color-primary);
  }
  .card-title {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    margin-bottom: 4px;
  }
  .card-desc {
    font-size: var(--font-size-xs);
    color: var(--color-muted);
  }
</style>`,
      "jsx-style": `<div style={{
  padding: 16,
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-lg)",
  background: "var(--color-surface)",
  border: "var(--stroke-1) solid var(--color-border)",
}}>
  <div style={{
    width: 32, height: 32,
    borderRadius: "var(--radius-lg)",
    background: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  }}>
    <span style={{
      width: 14, height: 14, borderRadius: "50%",
      background: "var(--color-primary)",
    }} />
  </div>
  <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginBottom: 4 }}>
    Elevated Card
  </div>
  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-muted)" }}>
    Uses radius, shadow and stroke tokens.
  </div>
</div>`,
    },
  }
}

// ── Inputs ───────────────────────────────────────────────────────────────────
export function inputCode(state: "default" | "focus" | "error" | "disabled"): ComponentCodeSpec {
  const isError = state === "error"
  const isFocus = state === "focus"
  const isDisabled = state === "disabled"
  const borderColor = isError ? "var(--color-danger)" : isFocus ? "var(--color-primary)" : "var(--color-border)"
  const ring = isFocus ? `\n${i(8)}boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-primary) 30%, transparent)",` : ""

  return {
    name: `Input — ${state.charAt(0).toUpperCase() + state.slice(1)}`,
    formats: {
      "react-tailwind": `<input
  ${isDisabled ? "disabled\n  " : ""}placeholder="Enter text..."
  className="w-full px-2.5 py-1.5 rounded-[var(--radius-lg)] text-[var(--font-size-sm)] outline-none transition-colors"
  style={{
    border: "var(--stroke-1) solid ${borderColor}",
    background: ${isDisabled ? '"var(--color-surface-2)"' : '"var(--color-surface)"'},
    color: ${isDisabled ? '"var(--color-muted)"' : '"var(--color-foreground)"'},${ring}
  }}
/>`,
      "html-css": `<input class="input input-${state}" placeholder="Enter text..." ${isDisabled ? "disabled" : ""} />

<style>
  .input-${state} {
    width: 100%;
    padding: 7px 10px;
    border-radius: var(--radius-lg);
    font-size: var(--font-size-sm);
    border: var(--stroke-1) solid ${borderColor};
    background: ${isDisabled ? "var(--color-surface-2)" : "var(--color-surface)"};
    color: ${isDisabled ? "var(--color-muted)" : "var(--color-foreground)"};
    outline: none;
    ${isFocus ? "box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 30%, transparent);" : ""}
  }
</style>`,
      "jsx-style": `<input
  ${isDisabled ? "disabled\n  " : ""}placeholder="Enter text..."
  style={{
    width: "100%",
    padding: "7px 10px",
    borderRadius: "var(--radius-lg)",
    fontSize: "var(--font-size-sm)",
    border: "var(--stroke-1) solid ${borderColor}",
    background: ${isDisabled ? '"var(--color-surface-2)"' : '"var(--color-surface)"'},
    color: ${isDisabled ? '"var(--color-muted)"' : '"var(--color-foreground)"'},
    outline: "none",${ring}
  }}
/>`,
    },
  }
}

// ── Alert ────────────────────────────────────────────────────────────────────
export function alertCode(variant: "info" | "success" | "warning" | "error"): ComponentCodeSpec {
  const colorKey = variant === "error" ? "danger" : variant === "info" ? "primary" : variant
  const titles: Record<string, string> = {
    info: "Heads up!", success: "Success!", warning: "Warning", error: "Error occurred",
  }
  const msgs: Record<string, string> = {
    info: "Here's something you should know about.",
    success: "Your changes have been saved successfully.",
    warning: "This action cannot be easily undone.",
    error: "Something went wrong. Please try again.",
  }
  const icons: Record<string, string> = { info: "i", success: "✓", warning: "!", error: "✕" }
  const title = titles[variant]
  const msg = msgs[variant]
  const icon = icons[variant]

  return {
    name: `Alert — ${title}`,
    formats: {
      "react-tailwind": `<div
  role="alert"
  className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius-lg)]"
  style={{
    background: "color-mix(in srgb, var(--color-${colorKey}) 10%, transparent)",
    border: "var(--stroke-1) solid color-mix(in srgb, var(--color-${colorKey}) 25%, transparent)",
  }}
>
  <span
    className="mt-0.5 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0"
    style={{ background: "var(--color-${colorKey})", color: "#fff" }}
  >
    ${icon}
  </span>
  <div className="flex-1 min-w-0">
    <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] mb-0.5"
       style={{ color: "var(--color-${colorKey})" }}>
      ${title}
    </p>
    <p className="text-[var(--font-size-xs)]"
       style={{ color: "var(--color-foreground)", opacity: 0.8 }}>
      ${msg}
    </p>
  </div>
</div>`,
      "html-css": `<div role="alert" class="alert alert-${variant}">
  <span class="alert-icon">${icon}</span>
  <div class="alert-body">
    <p class="alert-title">${title}</p>
    <p class="alert-msg">${msg}</p>
  </div>
</div>

<style>
  .alert-${variant} {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--color-${colorKey}) 10%, transparent);
    border: var(--stroke-1) solid color-mix(in srgb, var(--color-${colorKey}) 25%, transparent);
  }
  .alert-icon {
    margin-top: 2px; width: 20px; height: 20px; border-radius: 50%;
    background: var(--color-${colorKey}); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }
  .alert-title {
    margin: 0 0 2px;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-${colorKey});
  }
  .alert-msg {
    margin: 0; font-size: var(--font-size-xs);
    color: var(--color-foreground); opacity: 0.8;
  }
</style>`,
      "jsx-style": `<div role="alert" style={{
  display: "flex", alignItems: "flex-start", gap: 12,
  padding: "12px 16px",
  borderRadius: "var(--radius-lg)",
  background: "color-mix(in srgb, var(--color-${colorKey}) 10%, transparent)",
  border: "var(--stroke-1) solid color-mix(in srgb, var(--color-${colorKey}) 25%, transparent)",
}}>
  <span style={{
    marginTop: 2, width: 20, height: 20, borderRadius: "50%",
    background: "var(--color-${colorKey})", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  }}>
    ${icon}
  </span>
  <div>
    <p style={{ margin: "0 0 2px", fontSize: "var(--font-size-sm)", fontWeight: 600,
                color: "var(--color-${colorKey})" }}>
      ${title}
    </p>
    <p style={{ margin: 0, fontSize: "var(--font-size-xs)",
                color: "var(--color-foreground)", opacity: 0.8 }}>
      ${msg}
    </p>
  </div>
</div>`,
    },
  }
}

// ── Toast ────────────────────────────────────────────────────────────────────
export function toastCode(variant: "success" | "error" | "info"): ComponentCodeSpec {
  const colorKey = variant === "error" ? "danger" : variant === "info" ? "primary" : variant
  const msgs: Record<string, string> = {
    success: "Changes saved successfully.",
    error: "Failed to save. Please retry.",
    info: "New update available.",
  }
  const icons: Record<string, string> = { success: "✓", error: "✕", info: "i" }
  const msg = msgs[variant]
  const icon = icons[variant]

  return {
    name: `Toast — ${variant}`,
    formats: {
      "react-tailwind": `<div
  className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]"
  style={{
    background: "var(--color-surface)",
    border: "var(--stroke-1) solid var(--color-border)",
    maxWidth: 320,
  }}
>
  <span
    className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0"
    style={{
      background: "color-mix(in srgb, var(--color-${colorKey}) 15%, transparent)",
      color: "var(--color-${colorKey})",
    }}
  >
    ${icon}
  </span>
  <p className="flex-1 text-[var(--font-size-sm)]"
     style={{ margin: 0, color: "var(--color-foreground)" }}>
    ${msg}
  </p>
  <button
    onClick={onClose}
    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--color-surface-2)]"
    style={{ border: "none", background: "transparent", color: "var(--color-muted)", cursor: "pointer" }}
  >×</button>
</div>`,
      "html-css": `<div class="toast toast-${variant}">
  <span class="toast-icon">${icon}</span>
  <p class="toast-msg">${msg}</p>
  <button class="toast-close" onclick="this.closest('.toast').remove()">×</button>
</div>

<style>
  .toast-${variant} {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: var(--stroke-1) solid var(--color-border);
    box-shadow: var(--shadow-lg);
    max-width: 320px;
  }
  .toast-icon {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    background: color-mix(in srgb, var(--color-${colorKey}) 15%, transparent);
    color: var(--color-${colorKey});
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
  }
  .toast-msg { flex: 1; margin: 0; font-size: var(--font-size-sm); color: var(--color-foreground); }
  .toast-close {
    width: 20px; height: 20px; border: none; background: transparent;
    color: var(--color-muted); cursor: pointer; font-size: 16px;
  }
</style>`,
      "jsx-style": `<div style={{
  display: "flex", alignItems: "center", gap: 12,
  padding: "12px 16px",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface)",
  border: "var(--stroke-1) solid var(--color-border)",
  boxShadow: "var(--shadow-lg)",
  maxWidth: 320,
}}>
  <span style={{
    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
    background: "color-mix(in srgb, var(--color-${colorKey}) 15%, transparent)",
    color: "var(--color-${colorKey})",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700,
  }}>
    ${icon}
  </span>
  <p style={{ flex: 1, margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-foreground)" }}>
    ${msg}
  </p>
  <button
    onClick={onClose}
    style={{ width: 20, height: 20, border: "none", background: "transparent",
             color: "var(--color-muted)", cursor: "pointer", fontSize: 16 }}
  >×</button>
</div>`,
    },
  }
}

// ── Accordion ────────────────────────────────────────────────────────────────
export function accordionCode(): ComponentCodeSpec {
  return {
    name: "Accordion",
    formats: {
      "react-tailwind": `const [openIdx, setOpenIdx] = React.useState<number | null>(0)

const items = [
  { title: "What are design tokens?",
    body: "Design tokens are atomic values — colors, spacing, typography — stored as named variables that drive your UI." },
  { title: "How do I export to Figma?",
    body: "Use the Figma Tokens export format in the Export modal to sync values with your design files." },
  { title: "Can I save custom presets?",
    body: "Yes — configure your tokens and click Save Preset to store them locally and reuse across sessions." },
]

<div className="flex flex-col gap-2">
  {items.map((item, i) => (
    <div key={i} className="border rounded-[var(--radius-lg)] overflow-hidden"
         style={{ borderColor: "var(--color-border)" }}>
      <button
        onClick={() => setOpenIdx(openIdx === i ? null : i)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: "var(--color-surface)", border: "none" }}
      >
        <span className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)]"
              style={{ color: "var(--color-foreground)" }}>
          {item.title}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
             style={{ transform: openIdx === i ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s", flexShrink: 0,
                      color: "var(--color-muted)" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {openIdx === i && (
        <div className="px-4 py-3 border-t text-[var(--font-size-xs)]"
             style={{ borderColor: "var(--color-border)",
                      color: "var(--color-muted)", background: "var(--color-background)",
                      lineHeight: 1.6 }}>
          {item.body}
        </div>
      )}
    </div>
  ))}
</div>`,
      "html-css": `<div class="accordion-list">
  <div class="accordion-item open">
    <button class="accordion-trigger"
            onclick="this.closest('.accordion-item').classList.toggle('open')">
      <span>What are design tokens?</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="accordion-body">
      Design tokens are atomic values — colors, spacing, typography — stored as named variables.
    </div>
  </div>
  <div class="accordion-item">
    <button class="accordion-trigger"
            onclick="this.closest('.accordion-item').classList.toggle('open')">
      <span>Can I save custom presets?</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="accordion-body">
      Yes — configure your tokens and click Save Preset to store them locally.
    </div>
  </div>
</div>

<style>
  .accordion-list { display: flex; flex-direction: column; gap: 8px; }
  .accordion-item {
    border: var(--stroke-1) solid var(--color-border);
    border-radius: var(--radius-lg); overflow: hidden;
  }
  .accordion-trigger {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: var(--color-surface); border: none;
    font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
    color: var(--color-foreground); cursor: pointer; text-align: left;
  }
  .accordion-trigger svg { color: var(--color-muted); transition: transform 0.2s; flex-shrink: 0; }
  .accordion-item.open .accordion-trigger svg { transform: rotate(180deg); }
  .accordion-body {
    display: none; padding: 12px 16px;
    background: var(--color-background);
    border-top: var(--stroke-1) solid var(--color-border);
    font-size: var(--font-size-xs); color: var(--color-muted); line-height: 1.6;
  }
  .accordion-item.open .accordion-body { display: block; }
</style>`,
      "jsx-style": `const [openIdx, setOpenIdx] = React.useState(0)

const items = [
  { title: "What are design tokens?",
    body: "Atomic values — colors, spacing, typography — stored as named variables." },
  { title: "Can I save custom presets?",
    body: "Yes — configure your tokens and click Save Preset." },
]

<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
  {items.map((item, i) => (
    <div key={i} style={{
      border: "var(--stroke-1) solid var(--color-border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
    }}>
      <button
        onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px", background: "var(--color-surface)", border: "none",
          fontSize: "var(--font-size-sm)", fontWeight: 500,
          color: "var(--color-foreground)", cursor: "pointer", textAlign: "left",
        }}
      >
        {item.title}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
             style={{ transform: openIdx === i ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s", flexShrink: 0,
                      color: "var(--color-muted)" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {openIdx === i && (
        <div style={{
          padding: "12px 16px", background: "var(--color-background)",
          borderTop: "var(--stroke-1) solid var(--color-border)",
          fontSize: "var(--font-size-xs)", color: "var(--color-muted)", lineHeight: 1.6,
        }}>
          {item.body}
        </div>
      )}
    </div>
  ))}
</div>`,
    },
  }
}

// ── Progress ─────────────────────────────────────────────────────────────────
export function progressCode(value: number, label = "Progress"): ComponentCodeSpec {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  return {
    name: `Progress — ${pct}%`,
    formats: {
      "react-tailwind": `<div className="w-full">
  <div className="flex justify-between items-center mb-1.5">
    <span className="text-[var(--font-size-xs)] font-[var(--font-weight-medium)]"
          style={{ color: "var(--color-foreground)" }}>
      ${label}
    </span>
    <span className="text-[var(--font-size-xs)]" style={{ color: "var(--color-muted)" }}>
      ${pct}%
    </span>
  </div>
  <div className="w-full h-2 rounded-[var(--radius-full)] overflow-hidden"
       style={{ background: "var(--color-surface-2)" }}>
    <div
      className="h-full rounded-[var(--radius-full)] transition-all duration-500"
      style={{ width: "${pct}%", background: "var(--color-primary)" }}
    />
  </div>
</div>`,
      "html-css": `<div class="progress-wrap">
  <div class="progress-header">
    <span class="progress-label">${label}</span>
    <span class="progress-value">${pct}%</span>
  </div>
  <div class="progress-track">
    <div class="progress-fill" style="width: ${pct}%"></div>
  </div>
</div>

<style>
  .progress-wrap { width: 100%; }
  .progress-header {
    display: flex; justify-content: space-between; margin-bottom: 6px;
  }
  .progress-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-foreground);
  }
  .progress-value { font-size: var(--font-size-xs); color: var(--color-muted); }
  .progress-track {
    width: 100%; height: 8px;
    border-radius: var(--radius-full);
    background: var(--color-surface-2); overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: var(--radius-full);
    background: var(--color-primary); transition: width 0.5s;
  }
</style>`,
      "jsx-style": `<div style={{ width: "100%" }}>
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
    <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 500,
                   color: "var(--color-foreground)" }}>
      ${label}
    </span>
    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-muted)" }}>
      ${pct}%
    </span>
  </div>
  <div style={{
    width: "100%", height: 8,
    borderRadius: "var(--radius-full)",
    background: "var(--color-surface-2)", overflow: "hidden",
  }}>
    <div style={{
      width: "${pct}%", height: "100%",
      borderRadius: "var(--radius-full)",
      background: "var(--color-primary)",
      transition: "width 0.5s",
    }} />
  </div>
</div>`,
    },
  }
}

// ── Avatar Group ─────────────────────────────────────────────────────────────
export function avatarGroupCode(): ComponentCodeSpec {
  return {
    name: "Avatar Group",
    formats: {
      "react-tailwind": `<div className="flex items-center">
  {[
    { initials: "AJ", color: "var(--color-primary)" },
    { initials: "BM", color: "var(--color-success)" },
    { initials: "CL", color: "var(--color-warning)" },
    { initials: "DC", color: "var(--color-danger)" },
  ].map((av, i) => (
    <div
      key={av.initials}
      title={av.initials}
      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold border-2"
      style={{
        background: av.color, color: "#fff",
        borderColor: "var(--color-background)",
        marginLeft: i === 0 ? 0 : -8,
        zIndex: 4 - i, position: "relative",
      }}
    >
      {av.initials}
    </div>
  ))}
  <div
    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold border-2"
    style={{
      background: "var(--color-surface-2)", color: "var(--color-muted)",
      borderColor: "var(--color-background)",
      marginLeft: -8,
    }}
  >
    +2
  </div>
</div>`,
      "html-css": `<div class="avatar-group">
  <div class="avatar" style="background: var(--color-primary)" title="AJ">AJ</div>
  <div class="avatar" style="background: var(--color-success)" title="BM">BM</div>
  <div class="avatar" style="background: var(--color-warning)" title="CL">CL</div>
  <div class="avatar" style="background: var(--color-danger)"  title="DC">DC</div>
  <div class="avatar avatar-overflow">+2</div>
</div>

<style>
  .avatar-group { display: flex; align-items: center; }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: #fff;
    border: 2px solid var(--color-background);
    margin-left: -8px; position: relative;
  }
  .avatar:first-child { margin-left: 0; }
  .avatar-overflow { background: var(--color-surface-2); color: var(--color-muted); }
</style>`,
      "jsx-style": `<div style={{ display: "flex", alignItems: "center" }}>
  {[
    { initials: "AJ", bg: "var(--color-primary)" },
    { initials: "BM", bg: "var(--color-success)" },
    { initials: "CL", bg: "var(--color-warning)" },
    { initials: "DC", bg: "var(--color-danger)" },
  ].map((av, i) => (
    <div key={av.initials} style={{
      width: 32, height: 32, borderRadius: "50%",
      background: av.bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 600,
      border: "2px solid var(--color-background)",
      marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i, position: "relative",
    }}>
      {av.initials}
    </div>
  ))}
  <div style={{
    width: 32, height: 32, borderRadius: "50%",
    background: "var(--color-surface-2)", color: "var(--color-muted)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 600,
    border: "2px solid var(--color-background)",
    marginLeft: -8,
  }}>
    +2
  </div>
</div>`,
    },
  }
}
