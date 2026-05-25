// Role-specific onboarding steps. Each step links to a route and optionally
// a selector the tour overlay can spotlight when the user gets there.
import type { OnboardingStep, Role } from "@/types/onboarding"

const SHARED_FIRST: OnboardingStep[] = [
  {
    id: "find-component",
    title: "Find a component",
    description: "Use ⌘K to search any token or component instantly.",
    route: "/",
    ctaSelector: "[data-tour='search']",
    badge: "explorer",
  },
  {
    id: "use-token",
    title: "Use a token",
    description: "Hover any token to copy its CSS var reference — no hardcoding.",
    route: "/",
    ctaSelector: "[data-tour='editor-panel']",
    badge: "token-aware",
  },
]

export const ONBOARDING_STEPS: Record<Role, OnboardingStep[]> = {
  designer: [
    ...SHARED_FIRST,
    {
      id: "preview-responsive",
      title: "Preview at any breakpoint",
      description: "Switch desktop / tablet / mobile to validate at scale.",
      route: "/",
      badge: "responsive-eye",
    },
    {
      id: "playground",
      title: "Sandbox in the Playground",
      description: "Tweak tokens freely — the playground is isolated from production.",
      route: "/playground",
      badge: "sandbox-runner",
    },
    {
      id: "brand-switch",
      title: "Compare brands side-by-side",
      description: "Open any brand portal and toggle Side-by-side preview.",
      route: "/brands",
      badge: "multi-brand",
    },
  ],

  developer: [
    ...SHARED_FIRST,
    {
      id: "copy-code",
      title: "Export component code",
      description: "Click the <> icon on any preview to grab React/HTML/CSS.",
      route: "/",
      badge: "code-grabber",
    },
    {
      id: "run-audit",
      title: "Run a consistency audit",
      description: "Hit Run audit to scan your repo for hardcoded values.",
      route: "/audit",
      badge: "auditor",
    },
    {
      id: "ci-hook",
      title: "Wire up the CI hook",
      description: "Copy the GitHub Actions workflow from the Audit page.",
      route: "/audit",
      badge: "ci-citizen",
    },
  ],

  manager: [
    ...SHARED_FIRST,
    {
      id: "view-adoption",
      title: "Check adoption analytics",
      description: "See which components teams actually use.",
      route: "/adoption",
      badge: "metric-mover",
    },
    {
      id: "view-scoring",
      title: "Read quality scores",
      description: "Per-component A11y + Brand scoring with trend tracking.",
      route: "/scoring",
      badge: "quality-watcher",
    },
    {
      id: "manage-brands",
      title: "Manage brand variations",
      description: "Each sub-brand inherits core and customizes its layer.",
      route: "/brands",
      badge: "brand-curator",
    },
  ],
}

export function stepsFor(role: Role | null): OnboardingStep[] {
  return role ? ONBOARDING_STEPS[role] : []
}
