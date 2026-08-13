---
target: the whole mobile web app
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-13T13-52-49Z
slug: packages-web-client-v2-src
---
Method: dual-agent (A: a3daf8883f41a7e51 · B: a33dd27d2d426492a — B respawned after the first attempt died on a transient 529; both ran isolated, A never saw detector output)

Target: the whole mobile web app — `packages/web-client-v2/src` · Mode: **Operate** · Second run, after six remediation items

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | `BottomNav` marks the active tab by luminance only, no `aria-current`. `PendingApprovalPage`'s "Check again" produces zero feedback on the still-pending path. `PullToRefresh` has `pullingContent=""` so there is no pull affordance. |
| 2 | Match System / Real World | 3 | Voice is excellent ("nobody yet — quiet one", "note for the cook…", "The usual"). But `WeekNavigator` still leads with **"Week 32"** in Caveat — an ISO week number as a name — and no date range appears in the navigator at all. |
| 3 | User Control and Freedom | 3 | Esc + scrim + Cancel on every sheet, tap-again undo on tiles. **Reset week** rewrites every remaining day on one unconfirmed tap, with no undo offered in the success toast. |
| 4 | Consistency and Standards | 2 | `CreateGroupSheet` / `RenameGroupSheet` / `DeleteGroupSheet` each hand-roll a raw 15px `<input>` with an unassociated `<label>`, ignoring the `Field` primitive next door. Password reveal is an eye icon on Login and the words "show"/"hide" on Account. Icon buttons measure 40 / 36 / 34 / 26px against a system that specifies 40. |
| 5 | Error Prevention | 3 | Type-to-confirm delete, sole-admin guard, XOR rollback. But `BottomSheet` focuses the **first focusable**, which in both confirm sheets is the destructive button — measured `activeElement` = "Remove". |
| 6 | Recognition Rather Than Recall | 3 | Whole week visible, `UsualStatus` names the current state. But the Everyone board's counts have **no denominator**, and `GroupSchedulePage`'s TopBar drops the "N members" sub-line that two other screens carry. |
| 7 | Flexibility and Efficiency | 3 | The default schedule is a real accelerator and Reset week is a genuine bulk action. `AccountPage` has no `<form>`, so Enter never submits; the view toggle has no `role="tab"`/`aria-pressed`, so no arrow-key switching. |
| 8 | Aesthetic and Minimalist Design | 3 | Board and sheets are disciplined and distinctive. Login stacks three near-identical full-width buttons with no hierarchy; Settings/About/Account spend the one action colour on decorative icon boxes on every row. |
| 9 | Error Recovery | 3 | `errorMessage(err, overrides)` is genuinely good infrastructure. But `DefaultSchedulePage`'s "Try again" is a **dead button** — it never clears `error` and the effect's deps never change. |
| 10 | Help and Documentation | 2 | Still no help surface. A first-timer reaching `DefaultSchedulePage` via an unlabelled repeat icon gets "The usual" with no explanation of what a default does to their week; "Admin" is never defined. |
| **Total** | | **28/40** | **Good — solid foundation, address weak areas** |

Previous run: 23/40. The five heuristics that moved are 1, 5, 6, 9 and 10 — status visibility, error prevention, recognition, recovery and (marginally) help.

## Design Specificity Verdict

**Authored for this product, with three pockets of category-interchangeable filler.**

**LLM assessment.** The core loop is unmistakably this product's own: a seven-row, fourteen-target board where "not eating" is a red ✕ rather than an empty checkbox; a headcount board that reads numbers-first, names-second, notes-third; and `UsualStatus`, which names a mechanism the API performs invisibly and offers the state-matched exit. None of that could be lifted from another app.

Coherence breaks in the periphery, and it breaks *toward* the anti-references DESIGN.md exists to exclude. `SettingsPage`, `AboutPage` and `AccountPage` are all built from the same idiom — a rounded translucent row with a 40–42px `bg-coral/15` icon box on the left — three screens of Material-ish list rows spending the one action colour as decoration, in direct violation of the One-Accent Rule. `SettingsPage`'s chevron is a literal `→` text glyph in a product where every other mark goes through the chalk filter. And `LoginPage` — the screen every new user meets first — stacks three near-identical full-width buttons (measured 52 / 50 / 52px), two of them ghosts distinguished only by label colour.

Missed opportunities: the navigator still leads with an ISO week number rather than the dates a household shops against, and *"à table."* appears on the splash and About — the two screens with no job — while the board people live in carries no handwritten aside at all.

**Deterministic scan.** 50 files, exit 2, **2 findings — both the same rule** (`bounce-easing`) at `SplashScreen.jsx:14` and `ui/Spinner.jsx:7`. **Both false positives**, and now provably so: DESIGN.md's motion budget explicitly whitelists "the spinner's staggered dot bounce", and the rule targets elastic/overshoot curves, not a translate-Y loading indicator. Zero genuine deterministic findings — identical to the first run. Every issue in this report came from design review and browser measurement.

**Browser measurements** (headless — **no user-visible overlay exists**; nothing was injected into a browser you can see). No horizontal overflow at 320 / 390 / 1024 on any reachable route. No clipped text except a 4px sub-pixel artifact from the `-mr-1` on Login's reveal button, which does not clip. Sub-44px interactive targets confirmed: **26×26** password reveal, **36×36** note buttons (×7), **39×14** "Sign in" link on signup. Console errors on `/login` and `/signup` are a dev-server manifest artifact, not a product defect.

## Overall Impression

The remediation worked where it was aimed. The score moved 23 → 28, the cook can now read a week without tapping, "the usual" is named, week math is correct, errors speak English, and the P1 accessibility gaps in the shared primitives are closed.

What this run exposes is that **the fixes stopped at the components I touched**. Three bottom sheets still hand-roll the exact unlabelled 15px input that `Field` was fixed to solve. The focus management I added lands on the *destructive* button. The retry affordance I added to `DefaultSchedulePage` doesn't work. And the system still has no focus token, so the highest-stakes control in the product is ringed in Chrome blue.

The single biggest opportunity is no longer a feature — it's **finishing the passes already started**, then giving the cook a denominator and an "hasn't answered yet" tier, which is the one thing still standing between her and not having to ask around.

## What's Working

1. **The Meal Tile is a real signature control.** 74px targets (64px at 320px, day names still unclipped), sage at 7.19:1 and red at 4.64:1 each measured on their own tinted fill, `aria-pressed` with a day-qualified label so fourteen tiles don't announce identically, and a rollback that re-applies the XOR of one bit rather than restoring a snapshot. Interaction, colour semantics and failure semantics were designed together.

2. **A shared error vocabulary instead of scattered strings.** `ApiError` carrying `.status` plus `errorMessage(err, overrides)` means 403 on a group page and 403 on an invite say different, human things, and no status code can reach a person. Infrastructure most apps this size skip.

3. **`UsualStatus` names an invisible mechanism** and derives truth by comparing values rather than trusting the API's sticky `overriden` flag, scoped to editable days so Reset can actually reach its goal. Product thinking, not styling.

## Priority Issues

### [P1] Destructive sheets open with the destructive button focused, ringed in browser blue
`BottomSheet` focuses `panel.querySelector(FOCUSABLE)` — the first focusable — and in `ConfirmSheet` and `DeleteGroupSheet` the danger button precedes Cancel in the DOM. Measured `activeElement` = "Remove". One Enter from a keyboard user removes a member. The ring is the UA default (`rgb(0,95,204)`) because the system defines no focus style anywhere — a foreign platform blue landing on the highest-stakes control in a product with no blue in its palette.
**Fix:** focus the panel itself (it already has `tabIndex={-1}`) or accept an `initialFocus` ref pointed at Cancel; add `:focus-visible { outline: 2px solid var(--color-coral); outline-offset: 2px; }` to `index.css` so focus reads as chalk.
**Suggested command:** `/impeccable audit`

### [P1] The a11y pass stopped at `Field` — three sheets still hand-roll the same defect
`CreateGroupSheet`, `RenameGroupSheet` and `DeleteGroupSheet` each render a bare `<label>` with no `htmlFor` above a raw 15px `<input>` with no `id`, signalling focus by hue alone. That is precisely what `Field` was fixed to solve, sitting one import away. 15px also trips iOS focus-zoom, which the system calls load-bearing.
**Fix:** replace all three with `ui/Field.jsx`; raise `ui/Textarea.jsx` to 16px.
**Suggested command:** `/impeccable audit`

### [P1] The decisive read has no denominator and no "hasn't answered" tier
`MembersScheduleView` shows `L 3 / D 5` with no group size on screen, and `GroupSchedulePage` passes no `sub` to `TopBar`. A member who never opened the app renders identically to one who said no. PRODUCT.md makes this the decisive reading and insists silence and refusal are different — so the cook still cannot tell "3 in" from "3 in, 2 unanswered", which is the exact question that makes her ask around anyway.
**Fix:** render counts as `3/6` with `tabular-nums`; add a chalk-dim "not answered yet" line under the meal blocks listing untouched members; pass `sub={`${n} members`}` to `TopBar`.
**Suggested command:** `/impeccable layout`

### [P2] A retry button that does nothing, and other half-landed fixes
`DefaultSchedulePage`'s ErrorState "Try again" calls `fetchSchedules(true)` but never clears `error`, and the effect's deps are all stable — so the error state persists no matter how many times it is pressed. Alongside: `SettingsPage`'s `→` text chevron, `AboutPage`'s `animate-spin` (outside the documented motion budget), and `AccountPage` having no `<form>` so Enter never submits.
**Fix:** clear `error` and add a retry nonce to the effect deps; draw a `chevron` in `Icon.jsx`; drop `animate-spin`; wrap Account's fields in a `<form>`.
**Suggested command:** `/impeccable harden`

### [P2] Touch targets below 44px throughout, one at 26px
Measured: password reveal **26×26**; note buttons **36×36** (×7 per week); kick and the three invite-row buttons **34×34**; gear **36×36**; "Sign in" link on signup **39×14**. The three invite buttons sit 4px apart and one of them revokes a link you just shared.
**Fix:** raise icon buttons to the system's own 40px with a ≥44px hit area via padding or an `::after` inset expansion.
**Suggested command:** `/impeccable adapt`

### [P3] The disabled primary is a prominent, illegible slab
`disabled:opacity-40` on the filled variant makes Login's default-state button a muddy coral block with a label measured at 2.11:1 against its own fill — the most important control on the front door is the least legible thing on screen.
**Fix:** give the disabled state its own tokens — hairline-bordered transparent shell with a `chalk-dim` label — instead of fading the filled variant.
**Suggested command:** `/impeccable polish`

## Persona Red Flags

**Marie (the household cook — project persona).** No denominator on the counts and no group size anywhere on the board. No "hasn't answered" tier, so silence looks like refusal — the one distinction PRODUCT.md insists on, missing exactly where she needs it. She still lands on `'personal'`, one tap behind her own view. The Notes block renders only when notes exist, so on a quiet day there is no sign notes are a thing. And "Week 32" is the largest text in her navigator while she shops by date.

**Sam (screen reader / keyboard).** The confirm sheet autofocuses "Remove". `BottomNav` has no `aria-current` — active is a luminance difference only. The My-week/Everyone toggle has no `aria-pressed` or `role="tab"`, so the app's primary mode switch announces no state. `Toast` mounts its live region and its content in the same render, which VoiceOver and NVDA announce unreliably — and every save confirmation in the core loop rides on it. Dimmed past rows put the date at 2.30:1 and the verdict glyph at 2.57:1 while remaining focusable and tappable.

**Casey (distracted, one-handed).** Primary controls — view toggle, week navigator, top-bar actions — all sit at the top; the thumb zone holds only the bottom nav. Sub-44px targets at 26 / 34 / 36px, three of them 4px apart with a destructive one among them. The error toast at `bottom-[96px]` wraps to two lines at 320px over the grid's lower rows, then vanishes at 2.4s. **Reset week** is one unconfirmed tap that rewrites the rest of her week with no undo.

## Minor Observations

`.claude/ui.md` still documents a 4-tab bottom nav and `/account` / `/about` routes that don't exist · stacked avatars in `GroupsPage` are uncapped, so a 12-person group wraps the row with no `+N` chip · group names truncate in rows but render in full inside `ConfirmSheet`/`DeleteGroupSheet` titles, where a 40-char name reflows a Caveat 30px heading to three lines · primary buttons measure 50px tall against ghost/danger at 52px, visible wherever they stack · `MealTile`'s ✓/✕ are font characters while every neighbouring glyph is chalk-filtered SVG · `AccountPage` password fields lack `autoComplete`, so managers won't fill them, while Login and SignUp set them correctly · week selection isn't in the URL, so a shared link always reopens on the current week · the body's radial lift is anchored to the viewport, so on a wide screen the warm glow sits left of the content column.

## Questions to Consider

1. If the cook's read is the decisive one, why does the schedule still default to `'personal'` — and why does her view carry neither the group size nor an "unanswered" tier, the two facts that decide whether she still has to ask around?
2. Is "Week 32" a name or an implementation detail? DESIGN.md reserves Caveat for *the names of things*; an ISO week number is the API's primary key.
3. Three screens are built from coral icon boxes on translucent rows — the idiom any React starter ships. If Ardoise is the reason this feels like a household's board rather than software, what are those screens *for*?
4. The system has rules for chalk, hairlines, dashes and motion, and none for focus — so the highest-stakes control in the product is ringed in Chrome blue. Is the focus token missing from DESIGN.md, or missing from the design?
5. Creating a group sends the new admin to a settings screen with a Danger zone rather than to their empty week. What is the intended first sentence of that relationship?
6. Should "not yet" ever be expressed by fading the loudest thing on screen, rather than by a quieter shell that gains its fill when it becomes real?
