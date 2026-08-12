# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: **a member of a family at home**, checking in from a phone. They open the
app for a few seconds — usually standing, one-handed, often on the way somewhere — to say
whether they are eating lunch and/or dinner on a given day of the week, and occasionally to
leave a short note about a meal ("back late", "bringing someone").

The second, decisive reading is by **whoever is cooking or shopping**: they need the
headcount per meal per day, by name, for the week ahead.

One person per group acts as **group admin** (the group's creator): they invite, rename,
remove members, and delete the group. Admins are ordinary family members, not operators.

## Product Purpose

Meal Planner answers one question for a household: **who is eating, and when.**

Members declare attendance for lunch and dinner on a weekly grid; everyone in the group
sees the resulting per-day, per-meal roster. A "default schedule" ("the usual") pre-fills
the recurring pattern so the weekly act is a correction, not data entry.

Success is a cook who never has to ask around, and a member who can answer for the whole
week in under ten seconds without ever pressing Save.

## Positioning

It plans **people, not menus.** Meal-planning apps organize recipes, groceries and
nutrition; this one organizes attendance. There is no recipe, no shopping list, no
calorie count — the entire product is a shared attendance board for the two meals of a
day, scoped to a real household that already knows what it is cooking.

The interaction model is the differentiator: the **whole week is visible and editable at
once**, one tap per meal, optimistic and instantly saved, with attendance colour-coded
rather than greyed — green means in, red means out. There is no day drill-down, no save
button, no confirmation dialog anywhere in the core loop.

## Operating Context

- **Home-screen PWA on a phone.** Installed, launched between other things, used in
  seconds. Desktop use is incidental.
- **Weekly rhythm.** Data is organized by ISO week (`<year>-<week>`). Navigation is
  current week or forward only — the past is read-only and dimmed.
- **Two meals a day**, seven days a week, per group. Attendance is encoded per day as
  0 = neither, 1 = lunch, 2 = dinner, 3 = both.
- **Ephemeral by design.** Schedules, comments and notices auto-expire 14 days after
  their week. The app holds the near future, not a history.
- **Joining happens by link.** An admin mints an invite link and shares it (Web Share
  API / copy) through whatever messaging the family already uses; the invitee lands on a
  public invite page, signs in, and is auto-approved on redeem.
- **Uninvited signups are gated by a human.** Self-registration raises a Slack alert with
  Approve / Reject buttons; until approved, the user sees a pending-approval screen.
- **Admin operations happen outside the UI** via a Go CLI (users / groups / invites) run
  with AWS credentials.

## Capabilities and Constraints

Confirmed capabilities:

- Group membership: create, rename, delete a group; invite by reusable 7-day link; kick a
  member; leave a group (the sole admin cannot leave — they must delete the group).
- Weekly schedule per group with two views: **"My week"** (own attendance, one-tap tiles)
  and **"Everyone"** (day-centric roster of who is in for lunch and dinner, plus notes).
- **Default schedule** per member per group ("the usual"), used as the recurring baseline.
- Per-day meal notes, autosaved on dismiss.
- Authentication via Cognito: email/password and Google OAuth, with an approval claim
  (`custom:Approved`) gating the app.
- One admin per group. Exactly one.

Durable constraints:

- **Phone-first, one-handed, seconds-long sessions.** Layouts assume a narrow viewport
  (the app shell is capped at `max-w-md`), a bottom nav, and safe-area padding for
  notches. Anything requiring precision, patience or a wide screen is wrong for this product.
- **No save buttons in the core loop.** Attendance and notes persist optimistically.
- **English UI copy only.** No i18n layer is planned. The French motif *"à table."* is a
  deliberate flourish, not a language.
- Data older than two weeks is gone; the design must never imply history or analytics.

Explicitly undecided:

- Whether the product ever gains a public marketing surface (see Reach, below).
- Whether light mode is ever revisited (currently dark-only, by decision).

## Brand Commitments

- **Name:** Meal Planner. Wordmark set in Caveat.
- **Ardoise is the pinned visual world and is binding.** French for *slate / chalkboard*:
  a warm dark chalkboard café board you check to see who is eating. Documented in
  `docs/ui-design/ardoise/ardoise.md`; implemented in
  `packages/web-client-v2/src/index.css` (`@theme` tokens) and
  `src/components/Icon.jsx`. Its non-negotiables:
  - Dark-only. Warm slate surfaces (`#171b18` → `#262c28`) over a radial page gradient,
    chalk-dust grain baked into the body background.
  - Chalk palette: `--color-chalk` text, one warm accent family (**coral** primary,
    **mustard** secondary), with **sage** = eating / in and **red** = not eating / out.
  - Three typefaces: **Caveat** (hand-lettered headings, the personality), **Archivo**
    (body/UI; uppercase letter-spaced micro-labels), **JetBrains Mono** (data).
  - Hand-drawn chalk iconography: stroked SVG roughened by a shared displacement filter.
  - Banned as generic tells: soft drop-shadow floating cards, gradient app bars, blurred
    gradient blobs, gratuitous entrance animation.
- **Voice:** a café board — warm, communal, a little hand-made, never corporate.
- **Terminology is fixed:** "Groups" (never "Tables"), "N members", the schedule toggle is
  **"My week" / "Everyone"** (never "The table").
- **The login screen has no tagline or subtitle** — crest, "Meal Planner", fields, Google.
- **App icon:** chalk fork · clock · knife place setting on slate, white strokes,
  maskable-safe (`docs/ui-design/ardoise/app-icon.svg` / `.png`).

## Evidence on Hand

- Shipped, deployed product at `meal-planner.isnan.eu` (CloudFront + S3 + API Gateway +
  Go Lambda + DynamoDB + Cognito, eu-central-1).
- Full reference mockup of all 14 screens: `docs/ui-design/ardoise/ardoise.html`, with
  `mock-data.js` for sample members and weeks (illustrative data only).
- Design direction document: `docs/ui-design/ardoise/ardoise.md`.
- App icon source and rendered raster: `docs/ui-design/ardoise/app-icon.svg` / `.png`.
- Group-management mockup: `docs/ui-design/group-mgmt/group-mgmt.html`.
- Design specs and plans under `docs/superpowers/`.
- API contract: `packages/functions/api/openapi.yaml`.

**Absences future work must not fabricate:** there are no customers, testimonials, case
studies, press, usage metrics, pricing, plans, licensing, uptime claims, or third-party
integrations beyond Google sign-in and the internal Slack approval alert. There is no
landing page and no public marketing copy.

## Product Principles

1. **One question, answered fast.** Who is eating, and when. Every screen either answers
   it or gets out of the way. Features that do not serve the headcount do not belong.
2. **The whole week, at a glance and at a tap.** Never make someone drill into a day to
   declare a meal, and never make them confirm it.
3. **State is a colour, not an absence.** "Not eating" is a decision worth showing in red,
   not a greyed, unset checkbox — a member's silence and a member's "no" are different.
4. **Reach is invite-driven, not open.** Anyone may sign up, but a human approves, and
   groups grow by a link shared inside a family. Design for arriving *by invitation*, not
   for converting a stranger.
5. **The chalkboard is the product's face.** Ardoise is not decoration to be diluted
   toward a default app look; it is the reason this feels like a household's board rather
   than software.
