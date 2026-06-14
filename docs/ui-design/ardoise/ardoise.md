# Ardoise — Meal Planner design direction

> **Ardoise** (French for *chalkboard / slate*) is the pinned visual direction for the
> Meal Planner PWA. It replaces the previous generic "Warm Bistro" soft-MUI look with a
> warm, dark **chalkboard café** identity: a daily-specials board you check to see who's
> eating, and when.

This folder is the **input for the port** into `packages/web-client-v2`.

## Files in this folder

| File | Purpose |
|------|---------|
| `ardoise.html` | Interactive reference mockup — all 14 screens. Open in a browser (loads fonts from Google Fonts; needs internet). |
| `mock-data.js` | Sample members / week / attendance used by the mockup. Illustrative only. |
| `app-icon.svg` | Source for the PWA app icon (slate board + chalk fork·clock·knife). |
| `app-icon.png` | Rendered app icon, 512×512, maskable-safe. The single reference raster. |

> The mockup is plain HTML/CSS/JS and is **not bound to MUI**. The port may keep MUI or
> drop its styling conventions where they fight the identity — whatever renders the design
> faithfully. Treat the mockup as the source of truth for *look & behavior*, not structure.

---

## Concept

- **Surface = chalkboard.** Warm dark slate, hand-lettered chalk headings, a subtle chalk-dust
  grain. Hairlines are thin chalk rules (often dashed).
- **One accent family:** coral + mustard (warm chalk), with green/red reserved for meal state.
- **Voice:** a café board — "à table." (dinner's ready). Warm, communal, a little hand-made.

---

## Color tokens

Dark theme is the primary (and currently only) mode. Use CSS variables / theme tokens.

| Token | Value | Use |
|-------|-------|-----|
| `--slate-0` | `#171b18` | deepest background, app bar base |
| `--slate-1` | `#1f2421` | phone/page surface (top of gradient) |
| `--slate-2` | `#262c28` | raised surface |
| page bg | `radial-gradient(circle at 30% 0%, #16201a 0%, #0d100e 60%)` | behind everything |
| `--chalk` | `#f1ead9` | primary text / chalk strokes |
| `--chalk-dim` | `rgba(241,234,217,.56)` | secondary text |
| `--chalk-faint` | `rgba(241,234,217,.26)` | tertiary text, dashed rules |
| `--line` | `rgba(241,234,217,.18)` | borders / dividers |
| `--coral` | `#e9806a` | **primary accent** — buttons, links, today marker, icon boxes |
| `--mustard` | `#e7c24d` | secondary accent — "now" chips, logo strokes, lunch label |
| `--sage` | `#9cc08a` | **"eating / in"** state (green) |
| `--red` | `#df6253` | **"not eating / out"** state (red) |

Surface fills are translucent chalk over slate, e.g. cards use `rgba(241,234,217,.04–.06)` with a
`--line` border.

---

## Typography

Three families (mockup loads them from Google Fonts; for the port, use Google Fonts **or**
self-host — self-hosting is better for a PWA / avoids layout shift).

| Role | Family | Notes |
|------|--------|-------|
| Display / headings ("hand") | **Caveat** | weights 400/600/700. Used for the wordmark, page/section titles, day names headers, meal labels in "Everyone", week number, group names. This hand-lettered face *is* the chalk personality — use it generously for headings. |
| Body / UI ("body") | **Archivo** | weights 400/500/600/700. All body text, labels, buttons, nav, inputs. UPPERCASE + letter-spacing for small labels (`letter-spacing:.16–.24em`). |
| Data / mono | **JetBrains Mono** | weights 400/500/700. Version/build values, code-ish bits. |

Buttons: Archivo, 700, uppercase, `letter-spacing:.1em`, **no** text-transform fights with that —
they read as small-caps chalk labels.

---

## Shape, texture, motion

- **Radius:** cards/sheets ~16–18px; buttons 14px; pills/chips 999px; phone frame 46px.
- **Borders:** 1px–1.5px `--line`; decorative rules often `dashed` `--chalk-faint`.
- **Grain:** a faint `feTurbulence` noise overlay on surfaces (`mix-blend-mode: soft-light`, ~0.5
  opacity) — gives the chalk-dust feel. Subtle; don't overdo.
- **Motion:** restrained. `:active` scale-down on tappable things (0.93–0.98); the splash crest
  "breathes"; meal toggles transition color/scale. No gratuitous entrance animation.
- **No** soft drop-shadow "floating cards", **no** gradient app bars, **no** blurred gradient
  blobs (those were the generic tells we're removing).

---

## Iconography — hand-drawn chalk

All glyphs are **stroked SVG** (`currentColor`, `fill:none`, round caps/joins) roughened by a
shared `feTurbulence`+`feDisplacementMap` filter so the lines look chalk-drawn (not clean vector).
The mockup defines them as an inline `<symbol>` sprite; the port can ship them as an icon
component / sprite.

- **Logo — `ic-meal`:** a **fork · clock · knife** place setting (the clock = meal-*time*, fitting
  a planner). Used on login crest, splash, sign-up, first-run ring, about. `currentColor` → mustard
  on crests, faint-chalk in the empty ring.
- **UI set (chalk-styled):** key, lock, info, logout, code, branch, copy — replacing generic MUI
  glyphs in settings.
- Tune the displacement scale **down** at small sizes for legibility.

---

## Core interaction patterns (the non-negotiables)

### 1. "My week" — set your own meals with one tap
- The **whole week is visible** at once (7 day rows). No day drill-down to set attendance.
- Each day has two tap targets: **Lunch** and **Dinner**.
- **One tap toggles** a meal on/off, **instant / optimistic, no save button, no dialog.**
- State is **colour-coded, not greyed**: green (`--sage`, ✓) = *in*; **red** (`--red`, ✕) = *out*.
  (User requirement: the "not eating" state must be visibly red, not a dull grey checkbox.)
- Today is marked with a coral left-bar; past days are dimmed and not editable.

### 2. "Everyone" — who's eating, by name (day-centric)
- This **replaces** the old member-row layout (`MembersScheduleView`). It is **day-centric**.
- A horizontal **day strip** (Mon–Sun, with date + a dot on days that have anyone signed up)
  selects the day.
- Below it, two groups: **Lunch** and **Dinner**, each showing a **count** and the **attendees as
  compact name badges** (avatar + name) that **wrap** — you see everyone without scrolling.
  ("you" is highlighted.) Empty meals show a small chalk note.
- The backend already returns all members' schedules/comments per week, so this is a
  presentation change — no API change needed.

### 3. Week selector (on both My week and Everyone)
- Prev / next chevrons, a centered **"Week NN / year"** chip, a mustard **"Now"** chip when on the
  current week, and a coral dashed **jump-to-today** button.
- The central week box is a **fixed width** (independent of "Now"), so it never resizes as you
  navigate. The week label **fills the box** (flex, left-aligned); the "Now" chip sits at the right
  edge on the current week and is **removed** otherwise, so the label reclaims that space rather
  than leaving a phantom gap. The jump-to-today button slot is reserved (hidden, not removed).
  Keep the week label on a **single line** (`nowrap`) and the box wide enough to fit label+chip, so
  the box's **height** stays constant too (otherwise the chip squeezes the label, it wraps, and the
  box grows taller on the current week).
- **The prev/next/jump buttons MUST stay perfectly circular.** In the mockup they render slightly
  elliptical because the whole selector row (3 round buttons + the fixed week box + gaps) is wider
  than the narrow phone content area, so flex shrinks the buttons horizontally. At port time: give
  the buttons a fixed size that flex can't shrink (`flex: 0 0 auto`, equal width/height) and size
  the week box / row to the real viewport so the row fits without squishing them. (Tune on real
  device widths — deferred to the port.)
- **You can only navigate to the current week or forward** — "previous" is disabled at the current
  week (matches existing `WeekNavigator` logic). Real ISO-week math; today highlight tracks the
  live date.
- In the real app this week state is **shared** across the My-week / Everyone toggle (same group
  page). The mockup shows them as separate phones with independent state — that's a mockup
  artifact, not the intended behavior.

---

## Terminology & copy

- Use **"Groups"** everywhere (never "Tables"): nav label, "Your groups", "N members".
- The group views toggle is **"My week" / "Everyone"** (the second is **not** called "The table").
- **Login has no tagline/subtitle** (user removed it): crest + "Meal Planner" + fields + Google.
- Motif phrase **"à table."** (Caveat) appears on splash & about as a light flourish — optional.
- Pending-approval copy (unchanged from app): *"Your registration is pending approval. An
  administrator will review your request."*

---

## Screen inventory (in `ardoise.html`)

**The everyday app:** Login · Groups · My week · Everyone
**New users & system:** Splash · Sign up · Pending approval · First run (empty groups) · PWA update prompt
**Settings:** Settings home · Account (change password + sign out) · About
**Installed:** app-icon asset + home-screen preview

Maps to real files: `LoginPage`, `GroupsPage`, `GroupSchedulePage` (+`PersonalScheduleView`,
rebuilt `MembersScheduleView`→"Everyone", `WeekNavigator`), `SignUpPage`, `SettingsPage`,
`AccountPage`, `AboutPage`, `SplashScreen`, `UpdatePrompt`, `App` (bottom nav), `theme.js`.

---

## PWA app icon

- `app-icon.svg` / `app-icon.png` (512×512): the chalk place setting on the **slate board**.
- Strokes are **chalk-white** (not mustard) here — white-on-slate stays legible at ~48px on a busy
  home screen. This is the one intentional deviation from the in-app crests.
- Artwork is kept inside the central **maskable safe zone (~80%)**; background bleeds full to edges.
- Port: derive the manifest set from this (192, 512, a `purpose:"maskable"` variant, a 180
  apple-touch-icon) via `vite-plugin-pwa`; add `apple-touch-icon` in `index.html`.

### Updating the home-screen icon on existing installs

Changing the icon and deploying does **not** reliably update the icon for people who already
installed the PWA. Behavior differs by platform — plan for this:

- **New installs** (added after deploy): always get the new icon. ✅
- **iOS (Add to Home Screen):** the icon is **captured at install time and frozen**. A redeploy
  will **not** change an already-installed icon — the user must remove and re-add the app. ❌
  (Worth a one-line note in release notes if we care.)
- **Android (installed Chrome WebAPK):** Chrome re-checks the manifest on its own throttled
  schedule (~daily) and *can* regenerate the icon, but it's **delayed and not guaranteed** — most
  reliable when the icon **URL actually changes**, not just its bytes at the same filename.
- **Desktop installed PWA:** similar manifest-update mechanics; updates on relaunch, inconsistently.

Note: the **in-app** icon (login/splash crest, about page) updates instantly on deploy like any
code — only the **OS home-screen tile** is sticky.

**To maximize the chance existing Android installs pick it up:**
1. **Content-hash / rename the icon files** so the manifest references new URLs (`vite-plugin-pwa`
   can hash them). This is the single biggest factor for Android detecting the change.
2. Keep the **webmanifest in the no-cache app-shell group** (already the project's rule) so it's
   re-fetched and the new icon URLs are seen.
3. **Invalidate `/*`** on deploy (already the routine).
4. For iOS, accept that it's "remove & re-add"; surface it to users if it matters.

Bottom line: new installs perfect; Android existing-installs update within ~a day **if** filenames
are hashed; iOS existing-installs need a manual re-add.

---

## Porting notes

- Foundation first: rebuild `theme.js` with the tokens/fonts above; everything inherits from it.
- The biggest structural change is the **"Everyone" day-centric layout** (vs. member rows).
- Keep the existing PWA cache discipline (no-cache app shell incl. webmanifest, immutable hashed
  `/assets/*`, hourly `registration.update()`).
- Dark-only for now; the old light/dark split can be dropped unless we decide otherwise.
