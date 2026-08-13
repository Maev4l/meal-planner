---
target: the whole mobile web app
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-08-13T16-05-20Z
slug: packages-web-client-v2-src
---
Method: dual-agent (A: a9e2848bec0e4236e · B: ada44eda4a21a447c)

Target: the whole mobile web app — `packages/web-client-v2/src` · Mode: **Operate** · Third run, after two rounds of remediation

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Optimistic meal toggles show no in-flight state; `loadData` defaults `showLoading=true` so every week-arrow tap blanks the grid to a spinner; `pullingContent=""` gives the pull gesture no feedback until release. |
| 2 | Match System / Real World | 3 | Fluent in the core loop. Breaks on the admin surface: invites identified by an 8-char hex prefix, and the destructive section headed "Danger zone" — developer idiom in a product whose voice is a café board. |
| 3 | User Control and Freedom | 2 | **"Not now" on an invite is a dead control** and traps the user in a loop (see P0). No undo after kick/revoke/delete. `DefaultSchedulePage` still uses `navigate(-1)` while every other back is an explicit route. |
| 4 | Consistency and Standards | 3 | `MemberRow` calls `colorForName` while `GroupsPage` calls `colorsForNames`, so the adjacent-collision guard runs on one screen only. "My week" colours meals by verdict (sage/red); "Everyone" colours the same meals by identity (mustard/coral) — two colour systems across one screen's two tabs. |
| 5 | Error Prevention | 3 | `DeleteGroupSheet` sets `placeholder={groupName}` — the type-to-confirm ritual prints its own answer. Forward week navigation is unbounded while backward is correctly clamped. Otherwise strong. |
| 6 | Recognition Rather Than Recall | 3 | In "Everyone" the today marker never renders in its default state: `DayColumn` resolves `selected` before `isToday`, and `sel` initialises to today. Invite links are recall-only. |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; tabbing "My week" costs 21 stops with no skip; "Reset week" is the only bulk action; no path from a built week back into the default. |
| 8 | Aesthetic and Minimalist Design | 4 | Genuinely disciplined — hairlines instead of gaps, one filled control per screen, About folded into a footer signature, no shadow vocabulary beyond toast and update prompt. Blemishes: the group name printed twice on `GroupSettingsPage`, and the chalk-filled tab pill being the brightest object on the schedule screen. |
| 9 | Error Recovery | 4 | `errorMessage()` is the best-engineered layer in the app; the XOR undo reverts exactly one bit so a concurrent save survives; `CommentEditorSheet` restores its snapshot on failure. Two leaks: `AccountPage` and `SignUpPage` still render raw Amplify `err.message`. |
| 10 | Help and Documentation | 2 | No first-run guidance, no tooltips, nothing explaining the approval wait or the invite lifecycle. What exists is contextual and good, but "what am I looking at" is answered only by the design being self-evident. |
| **Total** | | **29/40** | **Good** (lower edge of the 28–35 band) |

## Design Specificity Verdict

**Authored for this product, and not marginally so.**

Three things could not be lifted into another app without breaking: the Meal Tile encodes a two-bit value as a colour verdict with a glyph *and* a word; `UsualStatus` exists solely to name a server behaviour that would otherwise read as a bug; the Week Board is built for one reader and orders itself numbers → names → notes. The Ardoise system is implemented rather than gestured at — every glyph through the shared displacement filter, depth by translucency and hairline, the grain baked into `body` specifically because a fixed blend-mode overlay swallowed taps on iOS.

Where specificity leaks: the invite list renders `A1B2C3D4…` in mono — an infrastructure artifact surfaced verbatim in a household app, and the only thing distinguishing two links — and "Danger zone" is developer idiom. Neither is a template tell; both are places the system stopped speaking its own language.

**Deterministic scan.** Exit 2, **2 findings, one rule** (`bounce-easing` at `SplashScreen.jsx:14` and `ui/Spinner.jsx:7`). **Both false positives**, for the third run in a row: DESIGN.md's motion allow-list explicitly names "the spinner's staggered dot bounce", and the implementation matches the spec token for token. Zero genuine deterministic findings. No findings in the gitignored harness.

**Browser measurements** (headless — **no user-visible overlay exists**). Zero horizontal overflow at 320/390/1024 on `/login` and `/signup`. No clipped text; the three `scrollWidth` deltas on `/login` are one 8px optical offset from the Reveal button's `-mr-2` propagating up the ancestor chain, not truncation. Only sub-44px controls are the text inputs at 40px tall (width 212–384). Contrast on the reachable screens measured comfortable: chalk-dim labels 6.12:1, "or with email" 5.96:1, the coral link ≈6.9:1 — no AA failures found.

## Overall Impression

Two rounds of remediation have moved this from "acceptable" to "good", and the score understates it: the app's *engineering* of failure — the error vocabulary, the XOR undo, the focus model, the week arithmetic — is now better than most shipped products of any size. Aesthetic discipline scored a 4, honestly earned.

What holds it at 29 is that the remaining weaknesses are no longer craft defects but **product decisions that were never made**: nobody decided what happens after "Not now"; nobody decided whether the cook or the writer owns the schedule screen's default; nobody decided whether the past belongs on screen. The one true regression is a trap in the invite flow — the product's designated growth path.

## What's Working

1. **`errorMessage()` plus the XOR undo.** A status-keyed plain-English map with per-call overrides, `status: 0` for transport, an explicit rule that `ApiError.message` is diagnostic and never rendered, and `LoginPage` refusing to fall back to `err.name`. The undo re-applies the XOR against *current* state, so a failed Lunch save no longer discards a successful Dinner save. An optimistic no-save UI is only trustworthy if failure is legible and recoverable; this layer earns the interaction model the rest of the product depends on.

2. **`UsualStatus.jsx`.** The only component whose job is to explain a hidden server behaviour in the user's words, in one line that changes with state, with the right button in each. It compares values rather than trusting the API's sticky `overriden` flag and scopes the comparison to days a reset could reach. It converts "why are Tuesday's tiles already green?" from a bug report into a sentence.

3. **The Week Board.** Seven `flex-1` columns fitting any phone with no sideways scroll (47px at 390, 37px at 320), an L/D letter so a count never depends on colour, an em-dash for zero rather than a grey number, and a reserved marker slot so heights never shift. Measured contrast: mustard on lunch fill 7.26:1, coral on dinner fill 5.23:1, chalk-dim em-dash 6.12:1.

## Priority Issues

### [P0] "Not now" on an invite traps the user in a loop
`InvitePage.jsx:96` — "Not now" calls `navigate('/')` and never calls `clearPendingInvite()`. `PendingInviteHandler` runs on every `location.pathname` change, still finds the stored code, and navigates back to `/invite/:code` with `replace: true` — which also removes the history entry, so the back button cannot break out. The only exits are joining the group the user just declined, or waiting out the 7-day expiry.

**Verified in source.** This is the product's designated growth path (PRODUCT.md principle 4, "design for arriving by invitation"). A user who taps a family link, signs in, then wants to check their existing groups first cannot reach them.

**Fix:** call `clearPendingInvite()` in the "Not now" handler before navigating; belt-and-braces, have `PendingInviteHandler` consume the code on read rather than leaving it for the next pathname change.

### [P1] Late in the week, the row you opened the app for is off-screen
Measured at 390×844: day rows begin at y=309 and are 79px each. Saturday occupies 704–783 with the fixed bottom nav top at 770; Sunday occupies 783–862 in an 844px viewport. `grep` finds no `scrollIntoView` or `scrollTo` anywhere in `src/`. From Saturday onward the actionable row is partly occluded or below the fold, behind three to six dimmed rows whose captions measure 2.66:1.

The product is defined as a seconds-long, one-handed, standing session; requiring a scroll past dead content to reach the one live row is the largest recurring tax on the core loop, and it worsens every day of the week.

**Fix:** scroll today's row into view on mount when `getTodayIndex(year, week) >= 0`, gated on `prefers-reduced-motion` (which the app ignores entirely — no `motion-reduce`, `motion-safe` or media query anywhere in `src/`). Stronger: collapse fully-past days into one "Mon–Wed · past" row that expands on tap.

### [P2] Two of the five avatar pigments are the same colour, and the collision guard runs on one screen only
Computed ΔE76 across `constants/colors.js`'s palette: **coral↔red = 12.5**, while every other pair is ≥44.9. The hash therefore has four distinguishable colours, not five — and `colorsForNames`, which nudges adjacent duplicates, treats them as different. Separately `MemberRow.jsx` calls `colorForName` directly while `GroupsPage` calls `colorsForNames`, so the nudge never runs on the roster.

**Fix:** resolve colours through `colorsForNames` where the roster is built and pass the result into `MemberRow`; treat coral and red as one bucket, or swap one for a genuinely separate hue.

### [P2] The delete-group confirmation prints its own answer
`DeleteGroupSheet.jsx` sets `placeholder={groupName}`, so the exact string required sits inside the field under "Type the group name to confirm", reading as text already entered. Type-to-confirm exists to force one deliberate act before the only irreversible operation in the product; supplying the answer reduces it to a copy, and its resemblance to filled-in text invites the opposite error too.

**Fix:** remove the placeholder. The name is already stated twice above the field.

### [P2] Four small defects introduced by the remediation itself
- `MembersScheduleView.jsx` carries a **stale docstring** describing an `unconfirmed` prop that no longer exists — a leftover from the reverted feature.
- The week board's day abbreviation and L/D letters measure **8.5px at 0.1em**, against DESIGN.md's own "never smaller than 9px" and "at least 0.12em below 12px". The system's rule and its flagship component disagree.
- `.claude/ui.md` lists the **catch-all `*` route twice** (lines 135 and 142).
- `App.jsx` applies `pb-[90px]` unconditionally while `BottomNav` renders only when authenticated and approved, so every unauthenticated screen carries 90px of dead scroll (`/login` measures `scrollHeight` 934 in an 844 viewport).

## Persona Red Flags

**Casey (distracted mobile — the primary user).** On Saturday and Sunday the row she came for is under the nav or off-screen, with no jump-to-today in the list. `DayColumn` measures 37×109 at 320px — under the 44px minimum width, though its area is more than twice a 44×44 square. Every TopBar action sits at y≈40, unreachable one-handed. `CommentEditorSheet` holds note text in component state until blur, so an OS tab-kill mid-note loses it. No offline read: `SchedulesContext` caches in a ref that dies with the page, so an installed PWA opened with no signal shows an error, not last week's board.

**Sam (accessibility).** Much is genuinely well done and worth saying plainly: the coral `:focus-visible` ring replacing platform blue, `BottomSheet` trapping Tab and focusing the panel rather than the destructive button, `MealTile` carrying `aria-pressed` plus a day-qualified label plus a glyph *and* a word, `Field` pairing labels via `useId()`, toasts with `role="status"`/`"alert"`, a real `<h1>` on every screen. Remaining: **no `prefers-reduced-motion` handling anywhere**, while the splash crest runs an infinite 2.4s breathe and the spinner an infinite bounce; the only refresh affordance in the app is a touch gesture, so a keyboard or screen-reader user cannot refresh at all; the view toggle announces as two independent toggles rather than a tab set; 21 tab stops to cross one week.

**The household cook (project persona).** The board tells her the date more loudly than the count — the day number is 14px/600 while the headcount is 13px. She cannot tell which day is today in the default state. She reads rather than sets, yet every session opens in "My week" with no memory of which view she uses. Notes — her richest signal — are third and last, frequently below the fold.

## Minor Observations

Week navigation blanks the screen (`loadData` defaults `showLoading = true`, so each arrow tap replaces the grid with a spinner — the one place the app violates its own Reserved-Slot Rule) · `AccountPage` and `SignUpPage` still render raw Amplify strings, bypassing `errorMessage()` · `GroupSettingsPage` prints the group name twice in Caveat 30px, 20px apart · `NotFoundPage` sits inside `ProtectedRoute`, so an unauthenticated visitor with a stale link is bounced to `/login` with no explanation · `InvitePage.join()` awaits three calls under a bare "Joining…" spinner with no timeout or cancel · two tabs desynchronise, since the schedules cache is per-tab with no invalidation · forward week navigation is unbounded while backward is clamped · `DayColumn`'s accessible name drops the month.

## Claims Checked and Rejected

Two of Assessment A's findings did not survive verification, recorded so they are not re-raised:

- **"Invite action hit boxes overlap by 2px."** Measured in the browser: visual 34px, 1px border, `-inset-[6px]` → **44.0px effective on 44px centres, overlap exactly 0**. A's figure omitted the border, which `inset` resolves against.
- **"`.claude/ui.md` documents four bottom-nav tabs and stale routes."** It documents two tabs and the routes match `App.jsx` exactly; this was corrected in an earlier pass. The genuine defect in that file is the duplicated `*` row noted above.

**Previously declined, not re-opened:** the headcount not distinguishing a member's "yes" from their silence. Assessment A raised this as a P1 and proposed dashed badges — which is precisely what was built and then removed on the owner's judgement after seeing it in the product. The data supports it and the finding is technically sound; the decision was taste, and it stands.

## Questions to Consider

1. If the cook is the decisive reader, why does every session open in the writer's view?
2. What is a week for, once it's set? The core loop has a peak and no ending.
3. Does the past need to be on screen at all? Three dimmed unreadable rows at the top of Sunday's screen are neither useful nor decorative.
4. Coral means "pressable or now" — so what is the Dinner heading? The Everyone view spends both accents on meal identity, leaving no colour that means "act".
5. The invite list shows a code because the code is what exists. What does the admin actually need — "Link 1 · created Tuesday · 3 joined"?
6. What would a confident version of the approval wait look like — one that names the person who approves, or tells the truth about how long it takes?
