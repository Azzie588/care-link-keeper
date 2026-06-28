
# MedTrack — Build Plan

A simple, family-shared app to track medical providers, appointments, and medications. UI is optimized for non-technical users (large tap targets, plain language, minimal jargon). Built on Lovable Cloud (database, auth, file storage) with email + password sign-in.

## Guiding principles

- One screen, one job. Big buttons, large text, clear icons.
- Everything you add is shared with invited family by default; you can mark any individual item private.
- Manual entry always works. Autofill is a helper, never a blocker.

---

## Phase 1 — Foundation & accounts

- Enable Lovable Cloud.
- Email + password sign-up / sign-in / password reset.
- Profiles table (name, relationship label like "Mom"/"Dad"/"Me").
- Roles table (owner, family) — never store roles on profile.
- App shell: bottom tab nav with **Providers · Appointments · Medications · Family**.
- Big-text, high-contrast theme; "Add" floating button on every list.

## Phase 2 — Providers

- Add / edit / delete providers: name, specialty, practice, locations (multiple), phone, portal (MyChart, Athena, FollowMyHealth, Other), notes, active/inactive toggle.
- **Autofill via NPI Registry** (free public API, no key): as the user types a name + optional city/state, suggest matching providers and pre-fill specialty, practice, address, phone.
- List view with sort (name, specialty, most recent appointment) and Active / Inactive toggle.
- Provider detail page shows their upcoming + past appointments and prescriptions tied to them.

## Phase 3 — Appointments

- Add appointment from a provider (pre-fills location/phone) or standalone.
- Fields: provider, date/time, location, reason, notes.
- **Calendar view** (month + agenda) and **Upcoming list**.
- Reminders: in-app banner + browser push + scheduled email at 1 week, 1 day, and 2 hours before.
- After the appointment date, prompt: "How did it go? Add follow-ups, referrals, or next steps."
- (Calendar import deferred — manual entry only in v1, per your choice.)

## Phase 4 — Medications

- Add / edit medications: name, dose, instructions, prescriber (link to provider), date filled, days supply, refills remaining, active/inactive, notes.
- **Autofill via RxNorm + openFDA**: type-ahead drug name + strength suggestions so spelling is correct.
- Auto-computed refill date = filled + days supply; reminders at 5 days and 1 day before running out.
- "Change medication" action: marks the old entry as ended (keeping history) and creates a new linked entry — clean handling of dose changes / replacements.

## Phase 5 — Family sharing

- Invite family by email; they create their own account and get linked to your circle.
- Default: invited family sees everything.
- **Private toggle on every provider, appointment, and medication** — hidden from family when on.
- Shared calendar view: see your own + family's (non-private) appointments, color-coded per person.
- Per-person view filter ("Show: Me / Mom / Dad / Everyone").

## Phase 6 — Polish for non-technical users

- Onboarding walkthrough (3 screens): add a provider → add an appointment → invite family.
- Empty states with one clear next action.
- Confirmation on destructive actions; undo toast on delete.
- Accessibility pass: font sizing, contrast, screen-reader labels.

---

## Future (not built in v1, captured for later)

- Lab results / referrals tracking (received? pending?).
- Integration with your planned medical-records app (post-visit notes reminder).
- Portal integrations / Guava Health — these generally require per-provider partnerships or paid aggregators (Particle Health, Health Gorilla, 1upHealth); revisit once the core app is in use.
- .ics / Google Calendar import for appointments.
- SMS reminders (requires a paid SMS provider).

---

## Technical notes

- **Stack:** TanStack Start + Lovable Cloud (Postgres + Auth + Storage + server functions).
- **Schema (v1):** `profiles`, `user_roles`, `family_links`, `providers`, `provider_locations`, `appointments`, `appointment_followups`, `medications`. Every row has `owner_id` + `is_private`; RLS lets owner see all, linked family see non-private.
- **Autofill APIs (free, no key):** NPI Registry (providers), RxNorm + openFDA (medications) — called from server functions to avoid CORS.
- **Reminders:** scheduled via a cron-triggered server route that queries upcoming appointments / refill dates and sends email + writes in-app notifications.
- **Auth:** email + password, password reset page at `/reset-password`.

## Suggested build order

1. Phase 1 (foundation) — ship as a usable shell.
2. Phase 2 (providers + NPI autofill).
3. Phase 3 (appointments + reminders + calendar).
4. Phase 4 (medications + refill reminders).
5. Phase 5 (family sharing + private toggle + shared calendar).
6. Phase 6 (onboarding + polish).

Each phase is independently shippable so you and your parents can start using it after Phase 3.
