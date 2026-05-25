"use client"
// Printable SVG certificate. Triggers window.print() for PDF save.
import { Button } from "@/components/ui/button"
import { FileDown, Award } from "lucide-react"
import type { Role } from "@/types/onboarding"

const ROLE_LABEL: Record<Role, string> = {
  designer: "Design Systems Designer",
  developer: "Design Systems Developer",
  manager: "Design Systems Manager",
}

export function Certificate({ name, role, badges, issuedAt }: {
  name: string; role: Role; badges: string[]; issuedAt: string
}) {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden; }
          .cert, .cert * { visibility: visible; }
          .cert { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="cert relative bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border-2 border-[var(--accent)] rounded-xl p-12 text-center overflow-hidden">
        <div className="absolute top-4 right-4 no-print">
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-1.5">
            <FileDown size={12} /> Save as PDF
          </Button>
        </div>
        {/* Decorative corner */}
        <Award size={48} className="mx-auto text-[var(--accent)]" />
        <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Certificate of Completion</p>
        <h1 className="mt-6 text-2xl font-serif italic text-[var(--muted-foreground)]">This certifies that</h1>
        <h2 className="mt-2 text-4xl font-bold text-[var(--foreground)]">{name}</h2>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">has completed the onboarding programme as a</p>
        <p className="mt-2 text-lg font-semibold text-[var(--accent)]">{ROLE_LABEL[role]}</p>
        {badges.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-1.5">
            {badges.map(b => (
              <span key={b} className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[var(--accent)] text-white">
                {b}
              </span>
            ))}
          </div>
        )}
        <p className="mt-8 text-[10px] text-[var(--muted-foreground)] tabular-nums">
          Issued {new Date(issuedAt).toLocaleDateString()}
        </p>
      </div>
    </>
  )
}
