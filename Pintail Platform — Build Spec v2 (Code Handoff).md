# Pintail Platform — Build Spec v2 (Autonomous Code Hand-off)

**Author:** Claude (Cowork) · **Date:** 2026-07-30 · **For:** Claude Code, continuous autonomous run
**Supersedes:** `Pintail Experience — Build Spec (QC Remediation).md` (v1). v1's fixes are folded into Phase 1 below — keep v1 in the repo for the granular line-cites; this doc is the source of truth for sequencing and the new architecture.
**Companion docs (read before coding):** `CLAUDE.md`, `Pintail Experience — Software Build Plan.md`, `Pintail Experience — Brand & UI Brief.md`, `Pintail Experience — QC Report 2026-07-30.md`, `Pintail Experience — Trip Naming Corpus.md`.
**Repo:** `github.com/CustomSupplyGroup/Pintail-Experience` · **Supabase ref:** `phwtjtbzdkgaghjjlpse`
**Inaugural trip name (LOCKED):** **First Light** (Reelfoot / West TN + MO rice fields · Dec 30, 2026 – Jan 3, 2027 · 4-day duck).

---

## 0. How to run this

Execute **top to bottom, continuously**; don't stop at phase boundaries. Stop only for a true blocker (a missing credential you can't stub, or a decision not covered here that changes product behavior). Same working rules as v1 and CLAUDE.md:
- Always `const { data, error }` and handle `error`. No silent no-ops.
- Migrations: apply via Supabase MCP (`apply_migration`/`execute_sql`) **and** write SQL to `supabase/migrations/`. Run `get_advisors` after DDL.
- Commit granularly, plain-English imperative messages, push every commit to `origin`.
- Verify: `npx tsc --noEmit` clean **and** `npm run build` green before declaring a phase done.
- Regenerate `lib/database.types.ts` after each schema change (`generate_typescript_types`).

**Checkpoint discipline:** Phase 0 and Phase 1 must leave the app deployable and green before Phase 2 begins. Phase 2 is the big surface rebuild; Phase 3 is polish.

---

## 1. The product model (what we're building now)

Pintail is a **membership community**; hunts/trips are **Experiences** that members join. This replaces the single-trip assumption throughout. Foundation already supports it (real `trips` table, global `vendors`, many-to-many `trip_attendees`), so this is an evolution, not a rewrite.

**Naming decisions (made; flagged so nothing is silent):**
- **Do NOT rename the `trips` table.** It *is* the Experience entity. Renaming touches ~47 files and RLS for a cosmetic gain and the UI uses "hunt/trip" anyway. Keep `trips` internally; surface **"hunt" / "trip"** in UI (interchangeable, per Isaac); each trip carries a unique **name** (First Light) under the parent brand "The Pintail Experience."
- **Members = the `users` table**, extended into a real profile/community identity. A member joins many trips via `trip_attendees` (already many-to-many → multiple rosters just work).
- **Content becomes a reusable library** assigned to trips (so one devotional/curriculum series adapts to any trip length via day-offset).
- **Vendors become a CRM** (contacts, photos, notes) linked to trips via a join — master list stays global, single source of truth.
- **Commerce / hunt-access marketplace = deferred.** Stub only; not built in this run.

**Entity glossary (target):**
| Entity | Table | Notes |
|---|---|---|
| Member | `users` (+profile fields) | Persistent community identity; photo, member_since, bio. |
| Trip / Hunt (Experience) | `trips` (+fields) | Named event; capacity, type, status. Cards on the ERP board. |
| Roster entry | `trip_attendees` | Member↔trip; payment, waiver, room, dietary. Many per member. |
| Content series | `content_series` (new) | Reusable devotional or curriculum set. |
| Content entry | `content_entries` (new) | A day/session in a series; `day_offset`, body, audio, scripture. |
| Trip↔content | `trip_content` (new) | Assign a series to a trip; schedules by day_offset from trip start. |
| Vendor | `vendors` (global) | Master CRM card. |
| Vendor contact | `vendor_contacts` (new) | Multiple contacts per vendor. |
| Trip↔vendor | `trip_vendors` (new) | Which vendors serve which trip, role-on-trip. |
| Inquiry | `inquiries` | Public leads. |

---

## 2. PHASE 0 — Data model foundation

Write each as a numbered migration; regenerate types; `get_advisors` after. Preserve existing First Light data.

### P0-1 · Extend trips for multi-trip + capacity
Add to `trips`: `experience_type text` (e.g. 'duck','goose','deer','fellowship'), `capacity int`, `tagline text null`, `subtitle text null`. Backfill the existing row: `name='First Light'`, `experience_type='duck'`, `capacity=16` (confirm number with Isaac later), status `live`. Keep `slug` (`december-2026` is fine, or set `first-light`).
**Acceptance:** First Light row reflects the locked name + type + capacity; types regenerated.

### P0-2 · Extend members (users) into a community profile
Add to `users`: `photo_url text null`, `member_since timestamptz default now()`, `bio text null` (if not present), `city text null`. Backfill `member_since` from `created_at`.
**Acceptance:** Profile fields exist; RLS lets a member read/update their own, staff read all.

### P0-3 · Content library (merge devotionals + curriculum)
Create `content_series` (id, kind `content_kind` enum ['devotional','curriculum'], title, description, created_at), `content_entries` (id, series_id fk, day_offset int null, sort int, title, body_md, scripture_reference text null, audio_mux_id text null, video_mux_id text null, discussion_questions jsonb null, published bool default false), and `trip_content` (trip_id fk, series_id fk, primary key both). **Migrate** existing `devotionals` → a devotional series + entries (map `day_offset`/`scheduled_for` → `day_offset`), and `curriculum_sessions` → a curriculum series + entries. Keep old tables until Phase 2 reads switch over, then drop in a later migration.
**Acceptance:** Existing sample devotional/curriculum content is represented in the new tables; a series can be assigned to a trip; entries resolve to real datetimes as `trip.start_date + day_offset`.

### P0-4 · Vendor CRM
Create `vendor_contacts` (id, vendor_id fk, name, role text null, email text null, phone text null, notes text null) and `trip_vendors` (trip_id fk, vendor_id fk, role_on_trip text null, primary key both). Add `notes text null` and `photos jsonb null` (or a `vendor_photos` table) to `vendors`. Seed `trip_vendors` for First Light with the three existing vendors (Pintail Goods, Ruby Ridge Retrievers, J&S Migrators).
**Acceptance:** Vendors are global; First Light references its three via `trip_vendors`; contacts modelable.

### P0-5 · RLS + advisors
Add/adjust RLS for all new tables: staff full access; members read published content for trips they're on and read vendor public info; anon read only guest-preview-safe rows (published content for live trips, featured vendors). Run `get_advisors` and fix all security findings.
**Acceptance:** `get_advisors` clean; no PII exposed to anon; new tables covered.

**End Phase 0 → build green, types regenerated, commit/push.**

---

## 3. PHASE 1 — Security, correctness, deploy-readiness (the QC fixes)

Execute the v1 spec tasks **P1-1 through P1-11** (see `Pintail Experience — Build Spec (QC Remediation).md` for exact files/line-cites), adapted to the new model. Summary + deltas:

- **P1-1 requireStaff()** on every admin server action (esp. `inviteAttendees`, which bypasses RLS via service role). *(unchanged)*
- **P1-2 inquiry → email the founder** via `lib/email.ts` (`INQUIRY_NOTIFY_TO`, non-fatal). *(unchanged)*
- **P1-3 invite-only login** — `shouldCreateUser:false`. *(confirmed by Isaac)*
- **P1-4 active-trip helper** → rename concept to **`getActiveExperience()`** in `lib/trip.ts`; returns the member's/admin's current trip with error handling; prefer `status='live'`. Now also underpins the member **trip switcher** (Phase 2). *(expanded)*
- **P1-5 error-handling sweep** across the ~20 reads. *(unchanged)*
- **P1-6 roster silent 0-row update** → upsert. *(unchanged)*
- **P1-7 countdown timezone** → shared `daysUntilDate` helper. *(unchanged)*
- **P1-8 renumber duplicate `0006` migration.** *(unchanged)*
- **P1-9 confirm on destructive deletes.** *(unchanged)*
- **P1-10 roster at-a-glance** (payment/waiver/dietary). *(unchanged)*
- **P1-11 broadcast: drop the push promise** (email + in-app for v1; push deferred). *(unchanged)*

**End Phase 1 → app deployable and green; commit/push. This is the safe checkpoint.**

---

## 4. PHASE 2 — Rebuild the surfaces on the new model

Three surfaces. Mobile-first member app must now ALSO have a **desktop layout** (responsive; straightforward with breakpoints). Keep the brand system (dark, slate/champagne/cream, Allura/Bitter/Inter).

### Public site
- **P2-PUB-1 Home = essence, not one trip.** Hero sells the Pintail ethos (intentional, faith, craftsmanship, the outdoors) with an **"Upcoming Hunts"** list beneath (each trip a card: name, place, dates, seats-left/Full). First Light is one card, not the whole page. Big **"Request an Invitation"** CTA; move **"Member sign in" to the top-right**.
- **P2-PUB-2 Trip detail (public).** Per-trip marketing page (name, film/photos, vision, what's included, vendors, inquiry CTA). Fed by `trips` + `trip_content`/`trip_vendors`.
- **P2-PUB-3** Inquiry email wired (from P1-2); gallery unchanged.

### Member app (responsive)
- **P2-MEM-1 Trip switcher.** Top-of-app selector across the member's trips (`trip_attendees`), defaulting to nearest upcoming/live. Scopes Home/Schedule/Devotional/Photos/Trip Info to the selected trip. Solves multiple-rosters cleanly.
- **P2-MEM-2 Home.** Selected-trip essence + countdown + **latest devotional** (the most recent `content_entries` for that trip's assigned devotional series whose `day_offset`-resolved datetime ≤ now). Explain-in-UI why a given devotional is showing.
- **P2-MEM-3 Nav.** Bottom tabs → **Home / Schedule / Devotional / Photos / More**. **Drop the Curriculum tab** (curriculum lives in Trip Info). Single **Devotional** tab.
- **P2-MEM-4 Trip Info.** Merge Logistics + Info into one **"Trip Info"** page; make it the destination of the home "phone" tile. Pulls the trip's `trip_content` (curriculum/logistics pages), schedule summary, vendors.
- **P2-MEM-5 More / Profile.** Robust profile: **photo, "Member since," My Trips** (past + upcoming from `trip_attendees`), sign in/out. **Admin control:** on tap by a non-staff user, show a popup **"Admin Access Only"** (not an error toast); hide entirely for guests.
- **P2-MEM-6 Desktop layout** for the member app (responsive; don't ship mobile-only).

### Admin (ERP control room)
- **P2-ADM-1 Dashboard.** Three cards: **Total Members · Upcoming Hunts (with capacity: Full vs open seats) · New Inquiries.** Upcoming-hunts card lists each trip with seats filled/left.
- **P2-ADM-2 Members directory.** New section, distinct from per-trip roster: the global community list (name, photo, member since, # trips, contact). Member detail = profile + trip history. This is the CRM backbone (commerce later).
- **P2-ADM-3 Hunts board (the ERP).** Kanban of trips as **cards** with status (`Scoping → Booked → Prepping → Ready → Live → Wrapped` — add a `planning_status` enum to `trips`), owner, date. Cards are the source of truth. Open a card → **trip workspace** with tabs: Overview · Schedule · Vendors (pick from master) · Roster · Content (assign series) · Trip Info · Photos · Broadcast. Add a **per-trip checklist** (vendors confirmed, deposits, rooms, waivers, content scheduled) that drives the card's status and the dashboard's "needs attention."
- **P2-ADM-4 Master Vendor CRM.** Card-based vendor database: each vendor card = role, multiple `vendor_contacts`, phone/email, notes, photos, and trip history (`trip_vendors`). Reusable across trips; single source of truth.
- **P2-ADM-5 Content library admin.** One section managing `content_series` (devotional + curriculum), authoring `content_entries` by day-offset, and **assigning a series to a trip**. Replaces the separate devotionals/curriculum admin tabs. Bulk content will be provided; support building variants per trip length/type.
- **P2-ADM-6 Inquiries.** Add a status control (new → contacted → qualified → closed).
- **P2-ADM-7** Switch all member/admin reads from the old `devotionals`/`curriculum_sessions` tables to the library; then a migration to drop the old tables.

**End Phase 2 → build green; the platform works on the new model; commit/push.**

---

## 5. PHASE 3 — PWA, accessibility, brand, polish

Execute v1 Phase 2 (P2-1..P2-5):
- **PWA installable** — real 192/512/maskable PNG icons generated from `Brand Assets/Logomarks/PNG/Badge Transparent/pintail-badge-transparent-01.png`; Serwist service worker (Next 16/Turbopack-compatible); iOS "Add to Home Screen" hint.
- **Photo lightbox a11y** (dialog role, Escape, focus trap, close button, captions).
- **Landing brand film** (Mux when set, else `hero-1.mp4`, else still) + landing metadata/OG.
- **Waiver** — draft banner + `router.refresh()` after sign; text in `lib/waiver-copy.ts`.
- **Low-pri batch** — honeypot on inquiry, wire `welcomeEmailHtml`, `aria-current` on nav, drop "curated," trip-scoping already handled by the new model.

---

## 6. Human inputs (code must not block on them)

| Input | Handling |
|---|---|
| First Light name/type/capacity | **Locked** (capacity 16 — confirm). Seeded in P0-1. |
| `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MUX_*`, `POSTHOG_*`, `INQUIRY_NOTIFY_TO` | Set in Vercel; code degrades gracefully when absent. Output a "set these in Vercel" checklist at the end. |
| Finalized waiver legal text | Ships as `PLACEHOLDER_WAIVER_TEXT` + "DRAFT — not binding" banner until replaced. |
| Brand film Mux ID; member photos | Optional; UI degrades without them. |
| Bulk devotional/curriculum content | Content library accepts it later; seed with existing samples for now. |

---

## 7. Definition of done

All four phases committed and pushed; `tsc` clean; `npm run build` green; `get_advisors` clean. The platform: public Home sells the ethos with an upcoming-hunts list; members can sign in (invite-only), switch between their trips, and see scoped Home/Schedule/Devotional/Trip Info/Photos with a real profile; admins manage a Members directory, a Hunts board with per-trip workspaces and checklists, a Vendor CRM, and a Content library; security holes closed and inquiries notify the founder. First Light is seeded and correct. End with: (a) what shipped per phase, (b) the Vercel env checklist, (c) outstanding human inputs, (d) anything deferred (commerce, push, hunt-access marketplace).
