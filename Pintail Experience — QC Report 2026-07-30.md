# Pintail Experience — QC Report

**Date:** 2026-07-30 · **Reviewer:** Claude (read-only pass, no code changed)
**Baseline health:** `npm install` ✅ · `tsc --noEmit` ✅ **0 errors** · `next build` blocked only by the macOS-synced drive rejecting file deletes (filesystem quirk, not a code problem — a throwaway Linux copy builds fine).
**Scope:** all 47 routes + `lib/*`, components, config, RLS/migrations. Verified table/column/enum names against `lib/database.types.ts` — no wrong-schema bugs found.

How to use this: each surface has a page-by-page verdict (USABLE / NEEDS WORK / STUB-OR-BROKEN) with concrete issues and line cites. Cross-cutting patterns and a prioritized punch list are at the end. Add your feedback inline per page and send it back all together.

---

## TL;DR — the headline findings

**Good news:** The app is structurally healthy and further along than it looks. It typechecks clean, RLS is genuinely sound (attendee PII is not anon-readable), the brand system is fully wired in `globals.css`, admin CRUD works across every section, and forms use a consistent `useActionState` + toast pattern. No dead links or runtime crashes found in the happy path.

**The five things that will bite in production:**

1. **Empty env vars = "works locally, breaks on Vercel."** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MUX_TOKEN_ID/SECRET`, `NEXT_PUBLIC_POSTHOG_KEY` are all blank. Build passes, but invite/broadcast throw, all email silently no-ops, no video, no analytics. Must be set in Vercel before launch.
2. **Invite action is a security hole (HIGH).** `inviteAttendees` uses the service-role client (bypasses RLS) with **no staff check** — a reachable POST endpoint that can create accounts. Needs a `requireStaff()` gate.
3. **The public inquiry form never emails anyone (HIGH).** The #1 marketing conversion path saves a lead to a table nobody watches. `lib/email.ts` works but isn't called.
4. **PWA won't install (MED-HIGH).** Manifest has only a favicon (no 192/512 PNG), and there's no service worker — so the "lives on their home screen like Strava" wow-moment doesn't work today, especially on iPhone.
5. **The waiver ships placeholder legal text.** It says so on-screen. Must be attorney-finalized before real attendees sign; the sign flow also doesn't refresh to the "Signed" state without a manual reload.

**Systemic convention violation:** CLAUDE.md mandates `const { data, error }` on every Supabase call. ~20 read paths destructure only `data`, so failures render as empty states instead of surfacing. `roster/page.tsx` is the correct template to copy.

---

## Surface 1 — Attendee (client) portal

Mobile-first, guest-open during build phase (re-lock before real attendees). Overall: solid, on-brand, a few Medium items.

| Page | Status | Worst issue |
|---|---|---|
| `app/layout.tsx` (root) | USABLE | "curated" in metadata (brand word-to-avoid); loads unused Geist-Mono — Low |
| `(client)/layout.tsx` | USABLE | Guest-open surface; `notFound()` loses nav chrome — Low |
| `(client)/home` | USABLE | **Countdown timezone bug** — `daysUntil` lacks `T00:00:00`, can be a day off vs `trip/page.tsx` — Med |
| `(client)/schedule` | USABLE | No error handling (L25); no swipe gestures per brief — Low |
| `(client)/curriculum` + `[id]` | USABLE | Audio tag hidden unless scripture ref present; query error 404s silently — Low |
| `(client)/devotionals` + `[id]` | USABLE | Headline "30-day drip" feature buried under /more, not in bottom nav — Low |
| `(client)/photos` | NEEDS WORK | Lightbox a11y (no dialog role/Escape/focus-trap/close btn); photos query unscoped to trip; captions never shown — Med |
| `(client)/roster` | USABLE | Cleanest fetch in the app — **use as the error-handling template** — Low |
| `(client)/vendors` + `[slug]` | USABLE | No error handling; `.maybeSingle()` on non-unique slug (trip-#2 risk) — Low |
| `(client)/logistics` + `[slug]` | USABLE | Same as vendors — Low |
| `(client)/trip` | USABLE | Depends on hardcoded slugs `vision`/`whats-included`; correct date logic (unify with home) — Low |
| `(client)/waiver` | NEEDS WORK | **Placeholder legal text (High content risk)**; no `router.refresh()` after signing — High |
| `(client)/more` | USABLE | "Admin" button shown to every visitor; non-staff get an error toast on tap — Low/Med |
| `onboarding` | USABLE | No error handling on RPC/`.single()`; null profile unguarded — Low/Med |
| `(auth)/login` | USABLE | **OTP `shouldCreateUser:true`** — any email self-creates an account (invite-only?) — Med |
| components (nav/video/audio) | USABLE | On-brand, correct iOS autoplay attrs, ≥44px targets — Low |
| `pwa-install-prompt` + `manifest.ts` | NEEDS WORK | **No real PNG icons, no iOS Add-to-Home path** — install won't fire — Med/High |

**Client cross-cutting:** (1) missing `error` destructure nearly everywhere except roster; (2) everything leans on "single trip + RLS" with no `trip_id` scoping (painted corner for trip #2); (3) two date-parsing impls, one buggy; (4) PWA install is the weakest MVP-critical area; (5) waiver placeholder in a legally-sensitive spot; (6) photo lightbox is the one clear a11y miss; (7) brand execution otherwise on-target (Allura barely appears — page titles use Bitter-italic, a defensible legibility call).

---

## Surface 2 — Admin control room

Desktop-primary. Every section has working create/edit/delete. Overall solid CRUD; the standout risk is the invite action.

| Page | Status | Worst issue |
|---|---|---|
| `admin/layout.tsx` | USABLE | Staff gate lives only here; child actions don't re-check — Low |
| `admin-sidebar.tsx` | NEEDS WORK | Mobile = 11-item horizontal scroll strip, not the spec's hamburger + top-4 tasks — Med |
| `admin` (dashboard) | USABLE | "People" count includes staff, not attendee/roster count — Low |
| `admin/roster` | USABLE | No at-a-glance payment/waiver/dietary — that's the founder's core quick-op — Med |
| `admin/roster/[id]` | NEEDS WORK | **Silent 0-row update** if attendee has no enrollment row → payment/waiver edits lost; fetch error masked as 404 — Med |
| `admin/schedule` (+new/[id]) | USABLE | List page no error handling; **delete has no confirmation** — Med |
| `admin/curriculum` (+new/[id]) | USABLE | Full CRUD, JSON parse guarded; delete no confirm — Med |
| `admin/devotionals` (+new/[id]) | USABLE | Full CRUD, status from `scheduled_for`; delete no confirm — Med |
| `admin/pages` (+new/[id]) | USABLE | Auto-slugify, CRUD good; delete no confirm — Med |
| `admin/vendors` (+new/[id]) | USABLE | Cleanest CRUD in the surface; delete no confirm — Med |
| `admin/trips` + `[id]` | USABLE | No create (fine, single-trip); edit error masked as 404 — Low |
| `admin/photos` | USABLE | Upload + toggles work; `user!.id` non-null assertion can throw; failed toggles only `console.error` — Med |
| `admin/broadcast` | NEEDS WORK | **No push notification** (MVP says push+email); recipient read depends on RLS — Med |
| `admin/invite` | STUB-OR-BROKEN | **HIGH: service-role client, no staff check** — exposed account creation; brittle dup detection — High |
| `admin/inquiries` | USABLE | Read-only viewer; no way to change lead status — Low |

**Admin cross-cutting:** (A) server actions rely on RLS alone for authz — fine *if* RLS is airtight, but invite bypasses RLS with no gate → add a shared `requireStaff()`; (B) the "active trip" lookup is duplicated ~7× and swallows errors, and picks the *earliest* non-draft trip (wrong once trip #2 exists) — extract a helper; (C) missing error handling on schedule/photos reads; (D) destructive deletes have no confirmation (only photos does); (E) broadcast doesn't push; (F) mobile authoring isn't gated to desktop-only per spec; (G) roster silent no-op; (H) good patterns to keep: `useActionState`+toasts, correct enum casts, `revalidatePath` on both surfaces, graceful email degradation.

---

## Surface 3 — Public site + infra + data layer

| Page/file | Status | Worst issue |
|---|---|---|
| `(public)/page.tsx` (landing) | USABLE | **No brand film** (still image only); wordmark is raster PNG, Allura unused; no page metadata; no error handling — Med |
| `(public)/gallery` | USABLE | No error handling; correctly disables realtime for public — Med |
| `(public)/actions.ts` (inquiry) | NEEDS WORK | **Inquiry never emails the founder (High)**; anon insert unthrottled (spam vector); hardcoded trip interest — High |
| `auth/callback` | USABLE | Role lookup ignores error → missing profile silently routes to /home; unvalidated `redirect` param — Med |
| `auth/signout` | USABLE | Clean — none |
| `proxy.ts` + `lib/supabase/middleware.ts` | USABLE | Next 16 uses `proxy.ts` (correct, not a bug); gates only /admin,/onboarding,/waiver by design — Low |

**Infra / lib:**
- `supabase/client|server|admin.ts` — clean; admin client is server-only and throws if key missing (good) — but **service-role key is blank in `.env.local`**.
- `lib/auth.ts` — handles error correctly; `user_role` enum has no `father_in_law`/`vendor` (plan divergence, not a bug).
- `lib/email.ts` — solid, branded, degrades gracefully; **but `welcomeEmailHtml` is defined and never used** (onboarding welcome email not wired), and `RESEND_API_KEY` blank → all email no-ops.
- `lib/photos.ts`, `lib/stock.ts` (real founder images, not placeholders), `lib/utils.ts` — fine.
- `lib/database.types.ts` — matches live schema, richer than the plan (adds trip_pages, roster_visible, featured, RPCs).
- `next.config.ts` / `globals.css` / Tailwind v4 — brand tokens all present and correct; `--font-heading` = Bitter not Allura (minor drift); `viewport.maximumScale:1` disables pinch-zoom (a11y smell).

**Infra cross-cutting risks:** (1) inquiry lead never emails — High; (2) blank required env vars surface at runtime on Vercel, not build — Med, deploy-critical; (3) **duplicate migration version `0006`** (two files) — renumber one to `0007` before a fresh `db push`; (4) systemic missing error handling on public reads; (5) unthrottled anon inquiry insert; (6) **RLS is otherwise sound** — attendee PII not anon-readable, roster RPC revoked from anon, guest-preview policies expose only non-PII content (positive finding); (7) PWA install broken end-to-end (no PNG icons, no service worker).

---

## Prioritized punch list

**HIGH — before any real attendee or public launch**
- Gate `inviteAttendees` (and ideally all admin actions) with `requireStaff()` — service-role bypasses RLS.
- Wire `submitInquiry` to email the founder via `lib/email.ts`.
- Replace waiver placeholder legal text with attorney-finalized release; add `router.refresh()` after signing.
- Set all env vars in Vercel (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MUX_TOKEN_ID/SECRET`, PostHog).
- Decide login model: lock `shouldCreateUser:false` for invite-only, or keep open.

**MEDIUM — usability & correctness**
- PWA: add 192/512 (maskable) PNG icons + service worker; add iOS "Add to Home Screen" hint.
- Fix home countdown timezone bug; unify date logic into one helper.
- Roster list: surface payment/waiver/dietary at a glance; fix silent 0-row update on `roster/[id]`.
- Add confirmation to all destructive deletes.
- Broadcast: implement push (or trim the promise to email + in-app for v1).
- Photo lightbox a11y (dialog role, Escape, focus trap, close button); scope photos query to trip.
- Add brand film / Mux to the landing page (or link out per bailout plan).
- Renumber the duplicate `0006` migration.
- Extract the "active trip" lookup helper with error handling.

**LOW — polish & tech debt**
- Apply the `{ data, error }` pattern everywhere (copy roster).
- Hide the Admin control from non-staff on `/more`.
- Add throttle/honeypot to the public inquiry form.
- Add `trip_id` scoping ahead of trip #2; fix `.maybeSingle()` on non-unique slugs.
- Wire the unused `welcomeEmailHtml`; drop "curated" from brand copy; consider more Allura on section openers.

---

*Nothing in this pass was changed. Ready to start fixing top-down, or to take your consolidated page-by-page feedback first.*
