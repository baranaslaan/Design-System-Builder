# Setup — one-shot

Tüm faz 23–28 (+ baseline 0001-0002) DB + API entegrasyonu için tek rehber.

## TL;DR

```bash
# 1) Migrations (en kolay yol)
./scripts/setup-supabase.sh

# 2) Dev
npm run dev

# 3) Browser
#    a. Sign in
#    b. Open http://localhost:3000/api/health  → "allMigrationsApplied: true" görmeli
#    c. Studio SQL Editor → supabase/seeds/component_registry.sql çalıştır
#    d. /api/health tekrar  → "componentRegistry.seeded: true"
```

Bu kadar. Aşağısı manuel/alternatif yollar ve test akışı.

---

## 1. Migrations

### Yol A — Otomatik script (önerilen)

```bash
./scripts/setup-supabase.sh
```

Script şunları yapar:
- Supabase CLI'ı doğrular (yoksa kur komutunu söyler)
- `.env.local`'daki `NEXT_PUBLIC_SUPABASE_URL`'den project ref'i çeker
- `supabase login` (tarayıcı açar, bir kerelik)
- `supabase link --project-ref <ref>`
- `supabase db push` → 7 migration sırayla uygulanır (0001 → 0007)

### Yol B — Tek-shot SQL paste

Studio → SQL Editor → `supabase/CONSOLIDATED.sql` içeriğini paste → Run.

Hepsi `IF NOT EXISTS` / `DO $$` guard'lı — daha önce kurulmuş tablolar zarar görmez.

### Yol C — Manuel (her dosya ayrı)

Studio → SQL Editor → sırayla:
```
supabase/migrations/0001_baseline.sql
supabase/migrations/0002_figma_sync.sql
supabase/migrations/0003_adoption.sql
supabase/migrations/0004_audit.sql
supabase/migrations/0005_scoring.sql
supabase/migrations/0006_brands.sql
supabase/migrations/0007_onboarding.sql
```

## 2. Env vars

`.env.local` (yoksa `.env.local.example`'den kopyala):

| Var | Faz | Zorunlu | Nereden |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Tümü | ✅ | Supabase project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tümü | ✅ | Aynı sayfa |
| `FIGMA_CLIENT_ID` | 22 | Figma sync için | figma.com/developers/apps |
| `FIGMA_CLIENT_SECRET` | 22 | Figma sync için | Aynı |
| `ANTHROPIC_API_KEY` | 24 | AI audit için (yoksa rule-based) | console.anthropic.com/settings/keys |

Figma PAT ve GitHub PAT **env'e gitmez** — UI'da scan butonunun yanında textbox'a girilir.

## 3. Sağlık kontrolü

```bash
npm run dev
```

Sign-in sonra: <http://localhost:3000/api/health>

Beklenen JSON:
```json
{
  "authed": true,
  "env": { "NEXT_PUBLIC_SUPABASE_URL": true, ... },
  "allMigrationsApplied": true,
  "missing": [],
  "componentRegistry": { "seeded": false, "count": 0, "hint": "Run supabase/seeds/..." }
}
```

`missing[]` boş değilse: o tablonun migration'ı uygulanmamış. İlgili dosyayı Studio'ya tekrar paste et.

## 4. Component registry seed (Adoption + Scoring için)

Studio'da o kullanıcı olarak login → SQL Editor → `supabase/seeds/component_registry.sql` paste → Run.

15 component + 4 örnek snapshot ekler. Liste DS'inle uyumlu değilse dosyayı düzenle.

Doğrula: `/api/health` → `componentRegistry.seeded: true`.

## 5. Topbar nav — yeni ikonlar

Login sonrası topbar'da bu yeni icon'lar görünür:

| Icon | Route | Faz |
|---|---|---|
| 📊 BarChart3 | `/adoption` | 23 |
| 🛡 ShieldCheck | `/audit` | 24 |
| ⚡ Gauge | `/scoring` | 25 |
| 🗂 Layers | `/brands` | 26 |
| 🎓 GraduationCap | `/onboarding` | 27 |
| 📦 Box | `/spatial` | 28 |

## 6. Faz-bazlı smoke test (sırayla)

### Faz 23 — Adoption (`/adoption`)
1. Sources → GitHub Repos → `owner/repo` (örn. `shadcn-ui/ui`) → +
2. Listede 🔄 Refresh → ~60 sn → Components + Rogue tabloları dolar
3. KPI'lar 0/0 değilse seed OK

### Faz 24 — Audit (`/audit`)
1. Use AI toggle (Anthropic key varsa)
2. Run audit → Critical/Warning/Info tabları dolar
3. CI panelinden YAML kopyala (kullanmak istersen)

### Faz 25 — Scoring (`/scoring`)
1. Run scoring → ~3 sn → 6 component card
2. Editor'de bir token değiştir → tekrar Run → **Diff** butonunda kırmızı rozet
3. Export PDF → print dialog

### Faz 26 — Brands (`/brands`)
1. "Acme" brand yarat → portal açılır → inheritance tree dolar
2. Bir color leaf seç → sağdaki editor'de Override at: brand → renk değiştir → Save → tree'de rozet `brand`'e döner
3. İkinci brand + Compare with → Side-by-side
4. Owner sıfatıyla core'da override ettiğin path'i değiştir → ConflictResolver pop-up

### Faz 27 — Onboarding (`/onboarding`)
1. Rol seç → Start tour → spotlight + Next ile geç
2. Tüm step'ler ✓ → Certificate çıkar → Save as PDF
3. Playground → accent picker değiştir → editor'daki gerçek tokens etkilenmiyor

### Faz 28 — Spatial (`/spatial`)
1. Pattern tab → slider'lar → shadow'lar realtime
2. Auto-rotate
3. CSS output → Copy

## 7. CI hook (Faz 24)

GH repo → Settings → Secrets → 4 secret:
- `DSB_URL` — deploy URL
- `DSB_TOKEN` — Supabase session access token (browser console: `(await window.supabase.auth.getSession()).data.session.access_token`)
- `DSB_TOKENS_JSON` — export'tan tokens JSON, tek satır (`jq -c < tokens.json`)
- `DSB_GH_PAT` — opsiyonel

Workflow YAML: `public/ci/ds-audit.yml` → `.github/workflows/ds-audit.yml`'a kopyala.

## 8. Sorun giderme

| Belirti | Çözüm |
|---|---|
| `/api/health` `authed: false` | Login değilsin, Topbar profil → sign in |
| `missing[]` dolu | İlgili migration uygulanmadı, Studio'dan tekrar paste |
| `setup-supabase.sh` "could not extract project ref" | `.env.local`'daki `NEXT_PUBLIC_SUPABASE_URL` Supabase-style URL değil |
| Adoption KPI 0/0 | `component_registry` seed edilmedi, adım 4 |
| GH scan 403 | Rate limit veya private repo, UI'daki PAT input'una PAT gir |
| AI audit sessizce skip | `ANTHROPIC_API_KEY` yok veya hatalı — sorun değil, rule-based fallback çalışır |
| Brand portal "missing core layer" | İlk brand'i sen yaratmadın → owner ile bir kez yarat |

## 9. Senin yapman gerekenlerin minimum listesi

Otomatize ettiğim: CLI install, 0001 migration ekleme, consolidated SQL, seed file, health endpoint, setup script, env example, runbook.

**Manuel yapacakların** (mecburi):
1. `.env.local` doldur (Supabase URL/key)
2. `./scripts/setup-supabase.sh` (veya CONSOLIDATED.sql paste)
3. `npm run dev` + login
4. Studio'da `supabase/seeds/component_registry.sql` çalıştır
5. `/api/health` ile doğrula

Bu 5 adım sonrası 6 yeni faz tamamen çalışır halde.
