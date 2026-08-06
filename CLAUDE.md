# Pintail Experience — Project Context

A private, branded experience portal for **The Pintail Experience** — a curated, faith-based, multi-day hunting retreat. The first trip is December 30, 2026, with 16 attendees already paid. The software is the differentiator vs every other faith hunting ministry, most of whom email PDFs and have terrible websites.

## Agent working standards (2026-08-05)

Set after the CustomAI post-org-move infra audit (repos → **CustomSupplyGroup** GitHub org,
Vercel → **customsupply's projects**, Supabase → **CustomSupply's Org**). Layers on top of
`~/.claude/CLAUDE.md`.

- **Working autonomy.** Create, commit, write/apply migrations, alter structures, and use
  connected MCPs without asking on routine work. Act, don't ask. Pause only for genuinely
  destructive/irreversible actions (dropping tables, force-push, deleting branches, `rm -rf`).
- **Clean-state rule (non-negotiable — treat as hard).** Every task ends complete and
  committed. No uncommitted edits; **no orphan migrations** (write **and** apply to the right
  env **and** commit in the same pass, or don't write it); no half-finished branches. Finish
  the unit of work or revert it.
- **Deploy policy — CLIENT (CustomAI).** Full autonomy + clean-state on all *work* — complete
  it and commit to a branch/PR. Migrations go to a **staging / preview** Supabase env, never
  the production DB unsolicited. The one human gate is the **final promotion to production**
  (prod deploy + prod-DB migration) — a promotion gate, not a permission-to-work gate.
  Everything up to that promotion is autonomous. (These are real paid attendees — the prod
  gate matters.)

## What this codebase is

A Next.js 15 web app, PWA-installable, that serves three user types:

- **Attendees** — mobile-first client portal. Daily devotionals, schedule, curriculum, photos, vendor info. Lives on their home screen as a PWA. Feel: Strava.
- **Founder + father-in-law** — desktop-primary admin. Trip management, content authoring, broadcasts, photo upload. Feel: Linear.
- **Public visitors** — landing page + inquiry form + public photo gallery (post-trip). Responsive.

## Critical context

- **Deadline:** December 30, 2026 — the inaugural trip.
- **Attendees on the books:** 16, fully paid. Real people. Real money. Real expectations even though they don't know what's coming.
- **Velocity assumption:** ~12–15 focused hours/week by Isaac with Claude Code.
- **No App Store goal for v1** — PWA only; a Capacitor wrap is a year-2 option if needed.
- **Single trip in v1** — don't over-generalize for multi-trip, just don't paint into a corner. The schema supports multiple trips; the UI hard-codes "the current trip" where it speeds shipping.

## Stack (locked)

| Layer | Tool |
|---|---|
| Frontend | Next.js 15 (App Router) + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| DB + Auth + Storage + Realtime | Supabase |
| Hosting | Vercel (default subdomain through build phase; custom domain ~Sept/Oct) |
| Email | Resend |
| Video | Mux |
| Analytics | PostHog (free tier) |

## Architecture — two surfaces, one codebase

Two route groups in the App Router:

- `app/(client)/` — mobile-first (375px baseline). Bottom-tab nav (Home / Schedule / Curriculum / Photos / More). PWA-installable. Push notifications. Touch targets ≥44px. Swipe gestures on schedule and photo gallery.
- `app/(admin)/` — desktop-primary (1280px baseline). Left sidebar nav on desktop, hamburger + bottom strip on mobile. Dense tables on desktop, scannable cards on mobile. **Authoring views are desktop-only in v1** — mobile admin gets a "view-only with edit-on-desktop hint" pattern.
- `app/(public)/` — landing page, inquiry form, public photo gallery. Responsive.

Shared across all three: database schema, auth, brand tokens. Diverged: layouts, navigation, design priorities.

## Canonical planning docs (read these before coding)

All in this folder:

- `Pintail Experience — Software Build Plan.md` — **the canonical software roadmap.** When in doubt about scope, design, or data model, this is the answer.
- `Pintail Experience — Brand & UI Brief.md` — **the canonical brand reference.** Color palette, typography, voice, imagery, component conventions. Read this before setting any design tokens.
- `Pintail Experience — Action Plan.md` — the trip game plan (non-software).
- `Pintail Experience — Background Brief.md` — the original vision.
- `Pintail Experience — Deep-Dive Research.md` — market research and competitive analysis. Useful context, not load-bearing for build decisions.

## Brand direction (summary — full detail in the Brand & UI Brief)

- **Feel:** Pintail Goods grown up — same DNA (heirloom craftsmanship, reverence, intentionality), scaled to a premium retreat brand. Garden & Gun aesthetic, leather-bound seminary book seriousness.
- **Color baseline:** dark mode default. Primary surface is **Pintail Slate `#47524C`** (pulled from pintailgoods.com about page). Accents in **champagne `#E5C188`** and **cream `#EEE7E0`**. Deeper night tones (`#1F2421`, `#2C332F`) for UI cards.
- **Typography:** **Allura** (script, closest free match to Squarespace's "Lakeside") for wordmark + hero display; **Bitter** (slab serif) for body and reading; **Inter** for functional UI (tables, forms, small text).
- **Photography target:** dawn duck blinds with fog, dogs working, fire-lit teaching moments, hands holding birds, fathers with sons. Faces matter more than birds. If it would look at home in a Garden & Gun feature, it's right.
- **Voice:** reverent, intentional, declarative. "For the inspired sportsman." Short. Confident. Quiet authority. See the Brand & UI Brief for the words-to-use / words-to-avoid lists.

## Working conventions for this project

- **Talk to me like I'm 5, skip the jargon, be decisive.** No "it depends" answers when you have enough info to pick.
- **Commit liberally and push every commit to origin** (same setup as CSG Core). Plain-English commit messages, imperative voice ("add roster table" not "added roster table"). I'll review on GitHub or by pulling locally.
- **Don't stop between phases.** Work through the Software Build Plan continuously until you hit a real blocker (missing key, needing me to apply a migration, an actual ambiguity). Phase boundaries are for planning, not for waiting on permission.
- **Verify before claiming done.** Run `npm run build` locally before saying a phase is shipped. Vercel build errors from things that would have linted locally are not acceptable.
- **Destructure Supabase errors.** Never write `const { data } = await supabase...` without `const { data, error }` and explicit error handling. Silent no-ops are a known footgun.
- **Migrations: apply directly via the Supabase MCP.** The Supabase MCP is connected to this project (ref `phwtjtbzdkgaghjjlpse`), so apply migrations autonomously with `apply_migration` / `execute_sql` — no pasting into Studio. Still write the migration SQL to `supabase/migrations/` for the repo record, and show the SQL in your response so it's visible. After DDL changes, run `get_advisors` to catch missing RLS or exposed functions.
- **Push back when an ask conflicts with the build plan or v1 scope discipline.** Don't quietly expand scope.

## v1 scope discipline (what we are NOT building)

(Full list in the Software Build Plan. The big ones:)

- Multi-trip product (it's one trip — hardcode where it makes shipping faster)
- Native iOS/Android in the App Store (PWA is enough for v1)
- Mobile authoring in the admin (desktop-only authoring; mobile admin is read + quick-ops)
- Payment processing in-app (link out to WeTravel or Stripe checkout)
- Vendor self-service portal (founder edits vendor pages)
- Chat / forums / DMs between attendees
- Multi-language, calendar sync, maps integration

## Phase 1 — Foundation (current phase)

Goal: app exists, you can log in, schema is live, the home screen renders.

See the Software Build Plan for the full 7-phase breakdown. Don't get ahead of the phase boundaries — Phase 1 is foundation only, not features.
