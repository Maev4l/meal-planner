# Ardoise redesign — `web-client-v2` design spec

**Date:** 2026-06-13
**Scope:** Visual + interaction redesign of the existing Meal Planner PWA frontend
(`packages/web-client-v2`) to the **Ardoise** ("chalkboard café") direction. Drop MUI;
rebuild on Tailwind v4. Restyle only the screens that exist today plus the chalk treatment
of comments. **Group management is out of scope** (not built today; deferred to a separate project).

Authoritative visual source: `docs/ui-design/ardoise/ardoise.md` + `ardoise.html` (the mockup is
the source of truth for *look & behavior*, not file structure).

---

## 1. Goals & non-goals

**Goals**
- Replace the "Warm Bistro" soft-MUI look with the dark Ardoise chalkboard identity.
- Remove all MUI / Emotion dependencies; style with Tailwind v4 + a small set of hand-built primitives.
- Keep every existing capability working: auth, groups list, weekly schedule (My week / Everyone),
  default schedule, per-day comments, settings/account/about, splash, PWA update prompt.
- Rebuild the "Everyone" view as **day-centric** (mockup core change).
- Preserve PWA cache discipline and update behavior.

**Non-goals**
- No group management UI (create / invite / members / rename / delete). Not built today; stays out.
- No backend/API changes. The redesign is presentation-only.
- No new features beyond the chalk treatment of existing ones.
- Light mode is dropped (dark-only).

---

## 2. Approach

**Foundation-first, convert all, drop MUI last (approach A).**
1. Build the Tailwind foundation: tokens, fonts, chalk icon sprite, global background/grain, primitives.
2. Convert screens in dependency order (leaf components → pages), app stays runnable throughout.
3. Remove `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` only in the
   final step, once nothing imports them.

Rationale: matches the porting note "rebuild `theme.js` first, everything inherits from it," and
avoids running two design languages (Ardoise dark vs. MUI Warm-Bistro) side by side.

---

## 3. Tech foundation

### 3.1 Styling — Tailwind v4
- `tailwindcss` v4 + `@tailwindcss/vite` plugin (Vite 6, CSS-first config; no `tailwind.config.js`).
- Ardoise tokens declared in CSS via `@theme` so they're available both as Tailwind utilities and
  as CSS variables:

| Token | Value | Use |
|-------|-------|-----|
| `--slate-0` | `#171b18` | deepest bg, app bar base |
| `--slate-1` | `#1f2421` | page surface (top of gradient) |
| `--slate-2` | `#262c28` | raised surface (bottom sheet) |
| `--chalk` | `#f1ead9` | primary text / chalk strokes |
| `--chalk-dim` | `rgba(241,234,217,.56)` | secondary text |
| `--chalk-faint` | `rgba(241,234,217,.26)` | tertiary text, dashed rules |
| `--line` | `rgba(241,234,217,.18)` | borders / dividers |
| `--coral` | `#e9806a` | primary accent (buttons, links, today, icon boxes) |
| `--mustard` | `#e7c24d` | secondary accent (now chip, lunch label, "you") |
| `--sage` | `#9cc08a` | "eating / in" state |
| `--red` | `#df6253` | "not eating / out" state |

- Page background: `radial-gradient(circle at 30% 0%, #16201a 0%, #0d100e 60%)`.
- Chalk-dust grain: a faint `feTurbulence` SVG overlay, `mix-blend-mode:soft-light`, ~0.5 opacity.
- Radii: cards/sheets 16–18px; buttons 14px; pills/chips 999px.
- Borders 1–1.5px `--line`; decorative rules `dashed` `--chalk-faint`. **No** drop-shadow floating
  cards, **no** gradient app bars.
- Safe-area padding on all top bars: `pt-[max(1rem,env(safe-area-inset-top))]`;
  `viewport-fit=cover` confirmed in the viewport meta.

### 3.2 Typography — self-hosted
- Self-host via `@fontsource` (avoids layout shift; PWA-friendly):
  - **Caveat** (400/600/700) — display "hand": wordmark, page/section/day titles, meal labels, group names.
  - **Archivo** (400/500/600/700) — body/UI; small labels UPPERCASE + `letter-spacing:.16–.24em`.
  - **JetBrains Mono** (400/500/700) — version/build values.
- Buttons: Archivo 700, uppercase, `letter-spacing:.1em`.

### 3.3 Chalk icon system
- One inline SVG `<symbol>` sprite with the shared `feTurbulence`+`feDisplacementMap` "chalk" filter
  (from the mockup); displacement scale tuned **down** at small sizes for legibility.
- `<Icon name="…" />` component renders `<use href="#ic-…">`.
- Set: `ic-meal` (fork·clock·knife logo), `ic-key`, `ic-lock`, `ic-info`, `ic-logout`, `ic-code`,
  `ic-branch`, `ic-copy`, plus nav/meal/note/back/settings glyphs as needed.
- Fully replaces `@mui/icons-material`.

### 3.4 Primitive components (replace MUI)
Built once, reused everywhere:
`Button` (primary / ghost / danger), `IconButton` (round chalk), `Field`/`Input` (chalk underline),
`Textarea` (dashed-underline chalk), `BottomSheet` (replaces `Drawer`), `Toast` (replaces `Snackbar`),
`Spinner`, `Avatar` (initials + per-name palette color), `Badge`/`Chip`, `Card`, `TopBar`,
`BottomNav`, `MealTile` (green=in / red=out tap target), `Icon`.

Member→color mapping: keep a deterministic name→palette hash (reuse existing logic, repointed to the
Ardoise palette: coral / mustard / sage). No special-casing of the current user — everyone, including
"you", renders uniformly by name (simpler component logic, no identity comparison in the views).

### 3.5 Dependencies
- **Add:** `tailwindcss` v4, `@tailwindcss/vite`, `@fontsource/archivo`, `@fontsource/caveat`,
  `@fontsource/jetbrains-mono` (all strict-pinned).
- **Remove:** `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`.
- **Keep:** `aws-amplify`, `react`, `react-dom`, `react-router-dom`, `dayjs`,
  `react-simple-pull-to-refresh`, `vite-plugin-pwa`, `workbox-window`.

---

## 4. Screens

### 4.1 Direct ports of the mockup (1:1)
- **Splash** — chalk crest (breathe animation) + "Meal Planner" (Caveat) + "à table." motif + bouncing
  coral/mustard/sage dots. Replaces `SplashScreen`.
- **Login** — crest + "Meal Planner" + Email/Password chalk fields + coral "Sign in" + dashed "or" +
  ghost "Continue with Google" + "New here? Pull up a chair" → sign up. **No tagline/subtitle.**
- **Sign up** — chalk form: Email, Name (live `n / 20` counter), Password (live strength help),
  Confirm (live match help), coral "Create account", "Already have an account? Sign in".
- **Pending approval** — sage solid-ring crest with ✓ + "Account created" + unchanged pending copy
  ("Your registration is pending approval. An administrator will review your request.") + ghost
  "Back to sign in".
- **Groups list** — top bar "Your groups / N groups". Each group = chalk row: rotated initials mark
  (palette color), group name (Caveat), "N members" + stacked avatars, `→` chevron. Tap → group page.
- **Settings home** — profile card (avatar + name + email + copy icon) + "Account details" item +
  "About" item.
- **Account** — chalk "Change password" card: Current / New / Confirm chalk fields + live password
  requirements list (check/cross chalk rows) + coral "Change password"; danger "Sign out" button.
- **About** — dashed-ring crest + "Meal Planner" + "à table." + Version + Build (JetBrains Mono) +
  footer "made with care for shared meals."
- **PWA update prompt** — chalk banner (coral border, `↻` icon box, "Update available / Tap to
  refresh to the latest version"), dims content behind. Keep existing update logic: `registerType:
  'prompt'`, hourly `registration.update()`, `visibilitychange` re-check.
- **Bottom nav** — two tabs, Groups · Settings, chalk icons; active = `--chalk`.

### 4.2 Group page (core) — `GroupSchedulePage`
- Top bar: back `←` + group name (Caveat) + `⚙` (→ default schedule).
- View switch: **My week / Everyone** chalk segmented control. **Week state shared across both views**
  (already true today).
- Chalk **week selector** (`WeekNavigator`):
  - prev / next round buttons + centered fixed-width "Week NN / year" box + mustard "Now" chip on the
    current week + coral dashed jump-to-today button.
  - Buttons stay perfectly circular: `flex:0 0 auto`, equal w/h, sized to the real viewport.
  - Fixed-width week box, single-line label (`nowrap`); "Now" chip removed off-current-week (label
    reclaims the space); jump slot reserved (hidden, not removed) so height stays constant.
  - **Navigate to current week or forward only** — prev disabled at the current week (existing logic).
    Real ISO-week math; today highlight tracks the live date.

**My week** (`PersonalScheduleView` rebuilt)
- 7 day rows; each row: day name + date, then two `MealTile` tap targets (Lunch, Dinner).
- **One tap toggles instantly / optimistically** — no save button, no dialog. Colour-coded:
  green (`--sage`, ✓) = in; **red** (`--red`, ✕) = out (not greyed).
- Today = coral left-bar + coral day name. Past days dimmed (~0.45) and not editable.
- Plus the **comment trigger** per row — see §4.4.
- Small legend ("in for it" / "not eating") + a hand-lettered hint ("tap a meal — saved instantly").

**Everyone** (`MembersScheduleView` rebuilt → day-centric)
- Horizontal **day strip** (Mon–Sun: weekday abbrev + date). A coral attendance dot on days where
  anyone is signed up; a mustard note dot on days carrying any comment (see §4.4). Selecting a chip
  picks the day.
- Below: **Lunch** then **Dinner** blocks — each a Caveat heading (mustard lunch / coral dinner) +
  count chip + wrapping compact name **badges** (avatar + name). All members render uniformly (no
  "you" highlight). Empty meal → chalk italic note.
- Then the **Notes** block when present (see §4.4).

### 4.3 Default schedule — `DefaultSchedulePage`
- Reached from the group-bar `⚙`. Reuses the My-week board so it reads as the same object minus time.
- Caveat title "The usual" + Archivo subtitle "applied to new weeks automatically."
- Seven **weekday-only** rows (Mon–Sun, no dates), same green=in / red=out `MealTile`s, one-tap
  optimistic toggle. Nothing dimmed, nothing locked (every day editable). No week navigator.
- The seven rows sit in a panel bordered with a **dashed** chalk rule (vs. solid hairlines on the live
  week) — the dashed edge signals "draft / repeating template" in the same visual language.

### 4.4 Comments (chalk treatment)

Per-day, per-member notes for lunch and dinner. Backend already returns all members'
schedules + comments per week — presentation change only.

**Editing my own notes — chalk "order ticket" bottom sheet** (`CommentsPage` → BottomSheet)
- Trigger: a small chalk **note glyph** at the right edge of each *editable* My-week row (the slot the
  chevron occupies today). Outline `--chalk-faint`; coral-filled + tiny coral dot when a note exists
  (scannable down the column).
- `BottomSheet` rises to `min-content` (not full height), `--slate-2` surface, top radius 22px, short
  **dashed** grab-rule. Header: day name (Caveat, large) + date (Archivo uppercase, spaced).
- Two stacked fields, Lunch then Dinner: mustard "Lunch" / coral "Dinner" hand-label + a borderless
  auto-grow textarea on a **dashed underline spanning the field** (chalk-on-board, not a boxed input);
  placeholder italic Caveat.
- **Autosave on blur / sheet dismiss**, with a quiet "saved" chalk toast — consistent with the no-save
  one-tap board ethos. (Saves via existing `api.createComments`, preserving other days' values.)
- **Past day**: sheet opens read-only — static chalk text on the dashed rules, no caret, faint
  "past — read only"; empty past day → chalk italic empty line.
- Motion: 160ms ease-out rise + backdrop fade; `:active` scale on the trigger. Nothing else.

**Viewing everyone's notes — inline "Notes" block** (replaces `CommentsDrawer`)
- In the Everyone view, after the Lunch/Dinner blocks: a dashed-rule divider then a **Notes** block
  (same `mealhead` rhythm: Caveat "Notes" + count chip). **Rendered only when the selected day has
  notes.**
- Each note = a chalk note card: avatar chip (initials, member palette color) + name (Archivo 600);
  below, one line per meal with text, prefixed by a tiny mustard "L" / coral "D" tick (not a full
  icon), note text in `--chalk-dim`. All authors render uniformly (no "you" treatment).
- Day-strip chips show a second mustard micro-dot beside the coral attendance dot on days with notes.
- Empty → no block at all (never an empty card), preserving "see everyone at a glance."

### 4.5 PWA app icon
- Derive the manifest icon set from `docs/ui-design/ardoise/app-icon.png` (chalk place setting on
  slate): 192, 512, a `purpose:"maskable"` 512, and a 180 `apple-touch-icon`.
- **Content-hash / rename** icon files (via `vite-plugin-pwa`) so the manifest references new URLs —
  the single biggest factor for Android existing-installs to pick up the new icon.
- Add `apple-touch-icon` link in `index.html`. Set slate `theme_color` / `background_color` in the
  manifest. Keep the webmanifest in the no-cache app-shell group; invalidate `/*` on deploy.
- iOS existing installs freeze the icon at install time → "remove & re-add" (note in release notes if
  it matters). New installs always get the new icon.

---

## 5. Deliberate deviations from the mockup (scope-driven)
- **No functional Groups `+`** — group management is out of scope and not built today.
- **Empty-groups state is informational** — chalk empty-ring + "No groups yet" + explanatory copy,
  **without** the mockup's "New group" / "I have an invite" action buttons (those flows don't exist).
- **No "you" highlight** — the mockup highlights the current user in Everyone/Notes; we render all
  members uniformly by name to simplify component logic and design.

---

## 6. File-level impact (within `packages/web-client-v2`)

- `vite.config.js` — add `@tailwindcss/vite`; rework PWA manifest (Ardoise icons, slate colors).
- `index.html` — `apple-touch-icon`, confirm `viewport-fit=cover`.
- `src/theme.js` — **removed**; replaced by Tailwind `@theme` tokens + a global stylesheet
  (`src/index.css` or similar) for bg gradient, grain, base body, fonts.
- `src/App.jsx` — drop MUI `Container`/`Paper`/`BottomNavigation`; new chalk `BottomNav` + layout.
  Routes mostly unchanged; the per-day comments route (`/groups/:groupId/:groupName/day/:day`) is
  **removed** since comment editing moves into the in-page `BottomSheet`.
- New: `src/components/ui/*` primitives (§3.4), `src/components/Icon.jsx` + sprite,
  `src/components/BottomSheet.jsx`.
- Rebuilt: `LoginPage`, `SignUpPage`, `GroupsPage`, `GroupSchedulePage`, `PersonalScheduleView`,
  `MembersScheduleView` (→ day-centric), `WeekNavigator`, `DefaultSchedulePage`, `CommentsPage`
  (→ bottom sheet), `CommentsDrawer` (→ inline Notes block; likely removed), `SettingsPage`,
  `AccountPage`, `AboutPage`, `SplashScreen`, `UpdatePrompt`.
- Unchanged logic: `contexts/AuthContext.jsx`, `contexts/SchedulesContext.jsx`, `services/api.js`,
  `constants/schedule.js`, `config.js`.
- Final step: remove MUI/Emotion deps from `package.json`; `yarn lint` clean.

---

## 7. Acceptance criteria
- App builds and runs with **zero `@mui/*` or `@emotion/*` imports**; those deps removed from
  `package.json`.
- Every existing capability works: sign in (email + Google), sign up + pending approval, list groups,
  toggle weekly meals (optimistic), view Everyone day-centric, edit own comments, view everyone's
  notes, edit default schedule, change password, sign out, about/version, splash, update prompt.
- Visual parity with `ardoise.html` for the 11 ported screens; gap screens follow §4.3–4.4.
- Dark-only; chalk identity (fonts, palette, grain, dashed rules) applied throughout.
- Week navigation: current-week-or-forward only; circular nav buttons; constant-size week box.
- PWA: self-hosted fonts (no layout shift), Ardoise icon set with hashed filenames, app-shell
  no-cache + immutable hashed `/assets/*` preserved, hourly + visibilitychange update checks.
- `yarn lint` passes.

---

## 8. Documentation updates (on completion)
- `.claude/ui.md` — new component/primitive inventory, Tailwind (drop MUI), day-centric Everyone,
  comment bottom sheet + inline Notes, informational empty state.
- `README.md` / `CLAUDE.md` — note the MUI→Tailwind v4 switch if architecture-relevant.
- Memory: `web-client-v2` tech row (MUI 6 → Tailwind v4).

---

## 9. Open questions
*(none — scope, styling, comments handling, empty state, and gap-screen patterns all resolved)*
