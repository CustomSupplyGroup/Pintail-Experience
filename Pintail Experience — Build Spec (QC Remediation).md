# Pintail Experience — Build Spec (QC Remediation)

**Author:** Claude (Cowork) · **Date:** 2026-07-30 · **For:** Claude Code, one continuous autonomous run
**Source of truth for issues:** `Pintail Experience — QC Report 2026-07-30.md` (same folder)
**Repo:** `github.com/CustomSupplyGroup/Pintail-Experience` · **Supabase ref:** `phwtjtbzdkgaghjjlpse`

---

## 0. How to run this (read first)

You are executing a remediation spec against an existing, healthy Next.js 16 + Supabase codebase. Work **top to bottom, continuously** — do not stop at phase boundaries or ask permission between tasks. Stop only for a true blocker (a decision that would change product behavior in a way not covered here, or a missing credential you cannot stub).

**Working rules (from CLAUDE.md — reaffirmed):**
- Always destructure `const { data, error }` from every Supabase call and handle `error`. This spec exists partly to fix violations of this rule — do not add new ones.
- Apply DB migrations directly via the Supabase MCP (`apply_migration` / `execute_sql`), AND write the SQL to `supabase/migrations/` for the repo record. Run `get_advisors` after any DDL.
- Commit liberally, one logical change per commit, plain-English imperative messages ("gate invite action behind staff check"). Push every commit to `origin`.
- **Verify before claiming done:** run `npm run build` locally and fix all errors before marking a pass complete. Also run `npx tsc --noEmit`.
- Push back in your summary (not by stopping) if any task conflicts with v1 scope.

**Sequencing:** Pass 1 (correctness, security, deploy-readiness) ships first and must leave the app deployable and green. Pass 2 (PWA, polish) builds on it. Do Pass 1 fully, commit/push, then continue into Pass 2 in the same run unless told otherwise.

---

## 1. Decisions already made (so nothing is silently assumed)

These are my calls as the spec author. If Isaac disagrees with any, he'll say so — otherwise proceed as written.

1. **Login is invite-only.** This is a private, 16-seat, paid trip. Set `shouldCreateUser: false` on the attendee magic-link so only pre-provisioned accounts can sign in. Accounts are created by the admin **invite** flow.
2. **Push notifications are deferred to post-MVP.** Web-push is heavy and, on iOS, only works inside an installed PWA with extra setup. For v1, broadcasts = in-app announcement row + email. Update the broadcast UI copy so it doesn't promise push. (Push can be a later pass.)
3. **PWA icons are generated from the existing brand badge** (`Brand Assets/Logomarks/PNG/Badge Transparent/pintail-badge-transparent-01.png`) — not a human input.
4. **Two passes, not one**, so there's a stable, deployable checkpoint after Pass 1.
5. **Single-trip hardcoding stays** for v1, but every data read gets a shared active-trip helper so the "painted corner" is contained, not spread.

---

## 2. Inputs required from Isaac (human-only — code must not block on them)

Write the code so these degrade gracefully when absent; do NOT leave the build red waiting on them.

| Input | Where it goes | Behavior if missing |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env + local `.env.local` | Invite flow shows the existing "add the key" notice (already handled). |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Vercel env | Email no-ops via existing `emailConfigured()` guard. |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Vercel env | Video players hide/skip gracefully. |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | Vercel env | Analytics init is a no-op. |
| `INQUIRY_NOTIFY_TO` (new) | Vercel env | Founder's email for new-lead alerts. If unset, default to `RESEND_FROM_EMAIL` and log a warning. |
| **Finalized waiver legal text** | `lib/waiver-copy.ts` constant (new) | Ship with the current placeholder text wrapped in a clearly-marked `PLACEHOLDER_WAIVER_TEXT` constant + an on-screen "DRAFT — not legally binding" banner until replaced. |

At the end of the run, output a **"Set these in Vercel before production"** checklist so Isaac can finish deploy config.

---

## 3. PASS 1 — Correctness, Security, Deploy-readiness

### P1-1 · Add a `requireStaff()` guard and lock down the invite action (SECURITY, HIGH)
**Files:** `lib/auth.ts`, `app/(admin)/admin/invite/actions.ts`, then all admin server actions.
**Problem:** `inviteAttendees` uses the service-role client (bypasses RLS) with no role check — a reachable POST that can create accounts. Other admin actions rely on RLS alone.
**Change:**
- In `lib/auth.ts` add:
  ```ts
  export async function requireStaff(): Promise<AppUser> {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) throw new Error("Forbidden: staff access required");
    return user;
  }
  ```
- Call `await requireStaff();` as the first line of every admin mutation action: `inviteAttendees`, `updateAttendee`, `saveVendor`, `deleteVendor`, `save/deleteScheduleItem`, `save/deleteCurriculum`, `save/deleteDevotional`, `save/deletePage`, `updateTrip`, and the photo toggle/delete/upload actions, plus `sendBroadcast`.
- Wrap each action body so a thrown `Forbidden` returns the action's normal error state (`{ ok: false, message: "You don't have access to do that." }`) rather than an unhandled throw where the action returns a state object.
**Acceptance:** A non-staff (or unauthenticated) call to any admin action is rejected before any write; `inviteAttendees` never reaches `createAdminClient()` without a staff check. `npm run build` green.

### P1-2 · Wire the public inquiry form to notify the founder (MARKETING, HIGH)
**Files:** `app/(public)/actions.ts`, `lib/email.ts`.
**Problem:** Leads save to `inquiries` but nobody is emailed — the #1 conversion path is silent.
**Change:**
- Add an `inquiryNotificationHtml({ name, email, phone, message })` template to `lib/email.ts` (reuse the `shell()` styling).
- In `submitInquiry`, after a successful insert, `await sendEmail({ to: process.env.INQUIRY_NOTIFY_TO ?? FROM_FALLBACK, subject: `New Pintail inquiry — ${name}`, html: ... })`. Make it **non-fatal**: if email fails/skips, still return success to the visitor (log the failure).
**Acceptance:** Submitting the form inserts the row AND (when Resend is configured) sends a notification; with no key it still succeeds for the user and logs a skip. Build green.

### P1-3 · Set attendee login to invite-only (ACCESS CONTROL)
**Files:** `app/(auth)/login/login-form.tsx`.
**Problem:** `signInWithOtp` defaults to `shouldCreateUser: true` — any email self-creates an account.
**Change:** Pass `options: { shouldCreateUser: false, emailRedirectTo: ... }`. Update the "link sent" copy to gently handle the not-a-member case ("If you're on the trip roster, a sign-in link is on its way.").
**Acceptance:** An email not already provisioned does not create an account. Existing invited users still receive links. Build green.

### P1-4 · Extract a single active-trip helper with error handling (CORRECTNESS)
**Files:** new `lib/trip.ts`; update the ~7 call sites (`roster/[id]`, `schedule/new`, `curriculum/new`, `devotionals/new`, `pages/new`, `admin/photos`, `broadcast`, `invite`, and any client page that inlines the same query).
**Problem:** The `trips … neq('status','draft').order('start_date').limit(1).maybeSingle()` lookup is duplicated and every copy swallows `error`; it also picks the earliest non-draft trip (wrong once a second trip exists).
**Change:** Add `export async function getActiveTrip(supabase)` that returns `{ trip, error }`, selects the current live trip (prefer `status = 'live'`, fall back to earliest non-draft), and handles error. Replace inline copies with it and handle the error at each call site.
**Acceptance:** One source for "the active trip"; no call site ignores its error. Build green.

### P1-5 · Sweep missing `{ data, error }` handling (CONVENTION)
**Files (client):** `home`, `schedule`, `curriculum` list+`[id]`, `devotionals` list+`[id]`, `photos`, `vendors` list+`[slug]`, `logistics` list+`[slug]`, `trip`, `waiver`, `onboarding`.
**Files (admin):** `admin/schedule` list, `admin/photos`.
**Files (public/infra):** `(public)/page.tsx`, `(public)/gallery/page.tsx`, `auth/callback/route.ts` role lookup.
**Change:** Destructure `error` on each and handle it — render a minimal error state (or log + safe fallback) instead of a silent empty state. Copy the pattern already in `app/(client)/roster/page.tsx`. For `auth/callback`, if the role lookup errors, log and fall back to `/home` explicitly (don't let a missing profile silently misroute).
**Acceptance:** No server-component Supabase read in the repo destructures only `data`. `grep` for `const { data:` without a sibling `error` returns only intentional exceptions. Build green.

### P1-6 · Fix the roster silent 0-row update (CORRECTNESS)
**Files:** `app/(admin)/admin/roster/[id]/actions.ts` (`updateAttendee`), `roster/[id]/page.tsx`.
**Problem:** `UPDATE trip_attendees WHERE trip_id AND user_id` no-ops if the attendee has no enrollment row, but still reports success — payment/waiver edits are silently lost.
**Change:** Convert to an upsert on `(trip_id, user_id)` (or check affected rows and, if zero, insert then report accurately). Also stop masking fetch errors as `notFound()` — distinguish "not found" from "query error."
**Acceptance:** Editing an attendee with no prior enrollment row persists and reports truthfully. Build green.

### P1-7 · Fix the home countdown timezone bug + unify date logic (CORRECTNESS)
**Files:** new helper in `lib/utils.ts` (e.g. `daysUntilDate(dateStr)` that appends `T00:00:00`); `app/(client)/home/page.tsx` and `app/(client)/trip/page.tsx` use it.
**Problem:** `home` parses a bare `date` string as UTC midnight → countdown can be a day off; `trip` already does it correctly. Two impls.
**Acceptance:** Both pages show the same, correct day count regardless of viewer timezone. Build green.

### P1-8 · Renumber the duplicate `0006` migration (DEPLOY)
**Files:** `supabase/migrations/0006_guest_preview_reads.sql`, `0006_roles_founder_admin_staff.sql`.
**Problem:** Two files share version `0006`; a fresh `db push` can choke.
**Change:** Rename the roles one to `0007_roles_founder_admin_staff.sql` (keep the earlier-applied one as 0006 to match remote history). Confirm against `list_migrations` so local order matches what's already applied remotely — do not reorder already-applied migrations; only fix the filename collision safely.
**Acceptance:** No two migration files share a version; `list_migrations` reconciles.

### P1-9 · Add confirmation to destructive deletes (SAFETY)
**Files:** delete buttons in admin `schedule/[id]`, `curriculum/[id]`, `devotionals/[id]`, `pages/[id]`, `vendors/[id]`.
**Change:** Gate each delete submit behind a confirm step (match the existing `confirm()` pattern already used in the photo grid, or a small confirm dialog). 
**Acceptance:** No admin delete fires on a single unconfirmed click. Build green.

### P1-10 · Roster list at-a-glance (USABILITY)
**Files:** `app/(admin)/admin/roster/page.tsx`.
**Change:** Add payment status, waiver status, and a dietary flag as columns/badges in the list (data already exists on `trip_attendees`). This is the founder's core quick-op.
**Acceptance:** The roster list shows paid/unpaid, waiver signed/not, and a dietary indicator without opening each attendee. Build green.

### P1-11 · Broadcast: match reality (SCOPE)
**Files:** `app/(admin)/admin/broadcast/broadcast-form.tsx` + `actions.ts`.
**Change:** Remove the push promise from the UI (channels = In-app / In-app + Email). Confirm the recipient email read works under the founder's RLS (join `trip_attendees → users(email)`); if RLS blocks reading other users' emails, read recipients via the service-role client inside the already-staff-gated action. Keep the email-failure reporting.
**Acceptance:** Broadcast sends in-app + email to all attendees; UI makes no claim it can't keep. Build green.

**End of Pass 1 → commit, push, run `npm run build`. The app must be deployable here.**

---

## 4. PASS 2 — PWA, accessibility, polish

### P2-1 · Make the PWA actually installable (MVP WOW)
**Files:** `app/manifest.ts`, new icon assets in `public/icons/`, `app/layout.tsx` (apple-touch-icon), service worker.
**Change:**
- Generate PNG icons from `Brand Assets/Logomarks/PNG/Badge Transparent/pintail-badge-transparent-01.png`: `icon-192.png`, `icon-512.png`, and a **maskable** 512 (badge centered on a `#1f2421` safe-area square). Add `apple-touch-icon.png` (180). Reference all in `manifest.ts` with correct `purpose` values.
- Add a service worker for installability + basic offline caching of the app shell and already-viewed curriculum/devotionals/photos. Use **Serwist** (`@serwist/next`) — it's the maintained, Next 16 / Turbopack-compatible choice (next-pwa is stale). Register it, precache the shell, runtime-cache Supabase image/storage GETs with a stale-while-revalidate strategy.
- Add an **iOS "Add to Home Screen" affordance**: since iOS Safari never fires `beforeinstallprompt`, detect iOS + not-standalone and show a one-time hint sheet with the Share → Add to Home Screen steps. Keep the existing Android `beforeinstallprompt` path.
**Acceptance:** Chrome/Android shows the install prompt and installs with proper icons; iOS shows the manual hint; installed app launches standalone from `/home` with the badge icon; Lighthouse PWA "installable" checks pass. Build green.

### P2-2 · Photo lightbox accessibility (A11Y)
**Files:** `components/photo-gallery.tsx`.
**Change:** Make the lightbox a real dialog — `role="dialog"` + `aria-modal`, Escape-to-close, focus trap, a visible close button, `stopPropagation` on the image, and body-scroll lock while open. Show `caption` in the lightbox (and optionally under grid items).
**Acceptance:** Keyboard users can open/close and are trapped in the modal; captions render; screen reader announces the dialog. Build green.

### P2-3 · Landing page brand film + wordmark (BRAND)
**Files:** `app/(public)/page.tsx`.
**Change:** Add the brand film to the hero — Mux player when `MUX` env + a `brand_film_mux_id` on the trip is set, else fall back to the existing `hero-1.mp4` `VideoBackground`, else the still image. Add `export const metadata` (title/description/OG) for the landing route. Optional: render the wordmark using the Allura display font or the transparent wordmark PNG per the brand brief.
**Acceptance:** Landing shows motion when assets exist and degrades cleanly; page has its own metadata/OG tags. Build green.

### P2-4 · Waiver flow polish + draft banner (CONTENT SAFETY)
**Files:** `app/(client)/waiver/*`, new `lib/waiver-copy.ts`.
**Change:** Move waiver body text into `lib/waiver-copy.ts` as `PLACEHOLDER_WAIVER_TEXT` with a prominent "DRAFT — not legally binding until finalized" banner shown until Isaac swaps in the real release. After a successful sign, call `router.refresh()` so the UI flips to the signed state without a manual reload.
**Acceptance:** Signing immediately shows the confirmed state; the draft banner is obvious; real text is a one-constant swap. Build green.

### P2-5 · Low-priority polish (batch)
**Files:** various.
- Hide the Admin control on `/more` for non-staff (check role; don't render the button for guests/attendees).
- Add a honeypot + simple rate-limit/dedupe to the public inquiry form.
- Wire `welcomeEmailHtml` into the invite/onboarding flow (send on successful invite or first onboarding).
- Inquiries admin: add a status control (new → contacted → qualified → closed).
- Add `aria-current="page"` to the active bottom-nav tab.
- Drop "curated" from brand copy (root metadata, manifest description) per the voice guide.
- Add `trip_id` scoping to client reads where trivial (schedule, photos, curriculum, devotionals) using `getActiveTrip`.
**Acceptance:** Each is done or explicitly deferred with a note; build green.

---

## 5. Global conventions & final verification

- After all DDL: run Supabase `get_advisors` (security + performance) and fix anything new.
- Run `npx tsc --noEmit` (0 errors) and `npm run build` (green) at the end of each pass.
- Commit granularly; push all commits to `origin/main`.
- Produce a final summary containing: (a) what shipped per pass, (b) the **"Set these in Vercel before production"** env checklist, (c) the human inputs still outstanding (finalized waiver text; confirm invite-only login; provide the brand-film Mux ID), and (d) anything you intentionally deferred.

**Definition of done for the whole spec:** Pass 1 + Pass 2 committed and pushed; `tsc` clean; `npm run build` green; RLS advisors clean; the app deploys to Vercel and an invited attendee can sign in, complete onboarding, see the home/schedule/curriculum/devotionals/photos, and the founder can manage roster/content/broadcast — with the security holes closed and the inquiry form notifying the founder.
