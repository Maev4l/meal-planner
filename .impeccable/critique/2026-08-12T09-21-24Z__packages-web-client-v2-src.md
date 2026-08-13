---
target: the whole mobile web app
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-08-12T09-21-24Z
slug: packages-web-client-v2-src
---
Method: dual-agent (A: a013427d9975856aa · B: a211958df70676811)

Target: the whole mobile web app — `packages/web-client-v2/src` · Mode: **Operate**

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Optimistic tile flip never confirms success; a failed save silently reverts behind a 2.4s toast. `PendingApprovalPage` never polls. No offline state in a PWA. |
| 2 | Match System / Real World | 3 | Voice is excellent ("nobody yet — quiet one", "note for the cook…"), but the week is identified as "Week 33" with no date range, and two date grammars run side by side ("12 August" vs a bare "12"). |
| 3 | User Control and Freedom | 3 | Escape + scrim on every sheet, Cancel everywhere, "Not now" on invites. But `App.jsx` has no `path="*"` catch-all, and `navigate(-1)` strands deep-linked users. |
| 4 | Consistency and Standards | 2 | Two week-number algorithms; two Cancel-button implementations; eye-icon vs "show"/"hide" words for the same control; raw `✓`/`✕`/`→` text glyphs alongside a filtered icon sprite; coral marks both pressable and non-pressable rows. |
| 5 | Error Prevention | 3 | Type-to-confirm delete with member count, graduated confirms, disabled past days. But `WeekNavigator` hardcodes 52 weeks in a 53-week ISO year, and `CommentEditorSheet` double-persists on scrim tap. |
| 6 | Recognition Rather Than Recall | 2 | "The usual" sits behind an unlabeled `repeat` icon and is named nowhere on the schedule screen. Invites reachable only via a gear glyph. `MembersScheduleView` shows one day at a time. |
| 7 | Flexibility and Efficiency | 1 | One rigid path. No keyboard shortcuts, no swipe between weeks, no "apply the usual", no bulk row action. A blank week is 14 discrete taps with zero accelerator. |
| 8 | Aesthetic and Minimalist Design | 3 | The strongest axis — rationed colour, one deliberate shadow, hairline-and-dash structure. Deductions: coral icon plaques as decorative affordance-noise, and 2 forced seconds of splash on every cold start. |
| 9 | Error Recovery | 2 | `ApiError` carries status and `InvitePage` uses it beautifully; everywhere else it is discarded. `fetchWithAuth` hardcodes the message to `API error: <status>`, which reaches users verbatim. No retry affordance outside the invite flow. |
| 10 | Help and Documentation | 1 | No help anywhere. `AboutPage` is a version string. "The usual" is never explained. `PendingApprovalPage` gives a blocked user no ETA, no identity, no channel. |
| **Total** | | **23/40** | **Acceptable — significant improvements needed before users are happy** |

## Design Specificity Verdict

**Authored, not interchangeable — but the authorship is almost entirely in the surface, and the interaction model beneath it is thinner than the skin implies.**

**LLM assessment.** The Ardoise system is real and *implemented*, not merely documented: tokens live in `index.css @theme`, every glyph runs through the shared `#chalk` displacement filter, the spinner is three bouncing chalk dots rather than a ring, and `MealTile` is red-for-out rather than grey-for-unset. The Never-Grey, Flat-Board and Dashed-Line rules are observably honored in code.

Where it slips is the **rounded coral icon plaque**, repeated identically in `SettingsPage.jsx:20` (pressable), `AboutPage.jsx:18` (not pressable), `AccountPage.jsx:99` and `UpdatePrompt.jsx:16`. That is the Material "leading avatar tile" idiom wearing chalk colours, and it breaks the One-Accent Rule — AboutPage's Version and Build rows are coral and are neither pressable nor "now". `SettingsPage` is the most category-interchangeable screen in the product, down to a literal `→` text character as its chevron (`SettingsPage.jsx:31`) in an app that otherwise draws every glyph.

Missed opportunities for product character: the week is identified by an ISO number no household uses; "à table." appears only on the splash and About pages — the two screens with no job — and never on the Everyone board, which is the one place the product literally *is* a table; and nothing in the UI ever connects "the usual" to the week it exists to pre-fill.

**Deterministic scan.** `detect.mjs` scanned 48 files and exited 2 with **2 findings, both the same rule** (`bounce-easing`, severity warning): `SplashScreen.jsx:14` and `ui/Spinner.jsx:7`, both matching the literal token `animate-bounce`.

**Both are false positives.** The rule is a lexical match, not a curve analysis; Tailwind's `animate-bounce` is a translateY loop between `cubic-bezier(0.8,0,1,1)` and `cubic-bezier(0,0,0.2,1)` that never overshoots its rest position, and both hits implement exactly the component `DESIGN.md` specifies ("three 8px dots — coral, mustard, sage — bouncing with a 0.16s stagger"). Zero genuine deterministic findings. Every issue in this report came from design review, not from the scanner.

One real artifact the detector surfaced indirectly: **`DESIGN.md` contradicts itself on motion.** The Don'ts list enumerates the motion budget as "press feedback, the 0.16s sheet fade/rise, and the splash crest's breathe" and omits the spinner dots, while the `### Spinner` component spec explicitly specifies them as bouncing. The code matches the component spec; the Don'ts line needs the spinner added.

**Visual overlays.** None. No browser-automation tool is exposed in this session (two `ToolSearch` probes returned only `WebFetch`, which cannot navigate, execute JS or screenshot). No live server was started, no injection attempted, and no user-visible overlay exists. All findings are source-derived.

## Overall Impression

This is a designed product with a real point of view, and the single interaction it exists for — tap a tile, the week is set — is genuinely excellent. The problem is that the app is built for the person who *writes* their attendance, and the product's own truth says the decisive reading is done by whoever is cooking. The cook is a second-class citizen in her own tool: her view is not the default, her read costs seven taps and a memory test, and the headcount — the number the entire product exists to produce — is the smallest type on the screen it lives on.

The single biggest opportunity: **make the reading path as good as the writing path, and make "the usual" actually pre-fill the week.** Both are already promised in PRODUCT.md; neither is implemented in the UI.

## What's Working

1. **The core control delivers the product thesis literally.** `MealTile` + `PersonalScheduleView` + `handleToggle` put the whole week on one screen, one tap per meal, optimistic write with rollback, no save button — and red for "out" rather than grey for "unset". Products that state a principle this specific and then ship it exactly are rare.

2. **The invite arc is designed end to end.** `InvitePage` (six distinct states), `pendingInvite.js` (localStorage bridge that self-expires at 7 days so a stale code can't hijack a later login), `PendingInviteHandler` (fires on any resolved session), and `refreshSession()` after redeem so the flipped approval claim lands before navigation. The pre-auth screen renders the group's initials mark in its deterministic colour before you've even signed in. Reach-by-invitation is a stated product principle and it is the most carefully built path in the app.

3. **Destructive actions are graduated, not uniformly gated.** `ConfirmSheet` for the recoverable (kick, revoke, leave) versus `DeleteGroupSheet`'s type-to-confirm — with the member count spelled out — for the single irreversible one. Matching friction to stakes is a judgement call someone actually made.

## Priority Issues

### [P1] Every form field in the product is programmatically unlabeled, and the core control has no accessible name or state

**Why it matters.** `Field.jsx:8` renders a `<label>` with no `htmlFor` and an `<input>` with no `id` — that component powers Login, all four SignUp fields, and all three Account fields. VoiceOver announces "edit text, blank". `MealTile` has no `aria-pressed` and no day context, so 14 buttons per screen announce as "Lunch"/"Dinner" with state conveyed by colour and a bare `✓`/`✕` glyph. `Toast` has no `aria-live`, so every save and failure is silent. `TopBar` renders titles as a `<div>`, leaving six of ten screens with zero headings. `BottomSheet` sets `role="dialog"` with no `aria-labelledby`, no focus trap, no initial focus. Separately, `chalk-faint` (26% chalk) measures **≈2.1:1** — it carries inactive nav labels, every section label, and all placeholders. This is a family utility; the household includes people with low vision.

**Fix.** `useId()` in `Field.jsx` wiring `htmlFor`/`id`; `aria-pressed` + a day-qualified `aria-label` on `MealTile`; `role="status" aria-live="polite"` on `Toast`; `<h1>` in `TopBar`; `aria-labelledby` + focus management in `BottomSheet`. The contrast one is a **design-system decision, not an implementation slip** — `DESIGN.md` mandates the 26% token for those roles, so either the token changes or the system declares the floor openly.

**Suggested command:** `/impeccable audit`

### [P1] The cook — the product's "decisive reading" — can only see one day at a time

**Why it matters.** PRODUCT.md: "they need the headcount per meal per day, **by name, for the week ahead**." `MembersScheduleView.jsx:22,34` holds a single `sel` index and renders exactly one day. Building a shopping list means seven taps and holding fourteen numbers in working memory — the only task in the product that requires it. The counts render as an 11px chalk-dim pill, visually subordinate to the 28px Caveat headings beside them. `GroupSchedulePage` opens on `view: 'personal'`, so the cook taps "Everyone" on every single visit with no way to make it her default. And `sel` is initialised once and never resyncs, so changing week strands the selection on a stale index.

**Fix.** A persistent 7×2 headcount summary above the day strip — day label over Lunch and Dinner counts in mustard and coral — so the whole week's numbers read without a tap; keep the day strip as the drill-in for names. Reset `sel` via `useEffect` when `year`/`week` change. Consider remembering the last-used view per user.

**Suggested command:** `/impeccable layout`

### [P1] "The usual" is undiscoverable and never bridges into a week

**Why it matters.** PRODUCT.md names the default as the mechanism that makes the weekly act "a correction, not data entry", and sets the success bar at "under ten seconds". But `DefaultSchedulePage` is reachable only through an unlabeled `repeat` icon in the top-right of `GroupSchedulePage.jsx:87`; the schedule screen never names the concept, never links to it from an empty week, and never shows what your default currently is. There is no "apply the usual to this week" anywhere. Every week is 14 taps of data entry, and the product's own efficiency thesis is unimplemented.

**Fix.** When the loaded week is all-zero, render a dashed-hairline row above the grid — *"Start from the usual"* — with one primary action that writes the member's default into the current week. Give the `repeat` button a visible caption, and add a `sub="the usual"` line to `DefaultSchedulePage`'s TopBar so the concept is named at both ends.

**Suggested command:** `/impeccable onboard`

### [P1] Two conflicting week-number algorithms, and a hardcoded 52-week year

**Why it matters.** `SchedulesContext.jsx:15-22` computes the period with a naive Sunday-first, calendar-year formula; `constants/schedule.js:15` uses `dayjs().isoWeek()`. Verified divergence: **every Sunday** (16 Aug 2026 → naive `2026-34` vs ISO `2026-33`) and across the year boundary (1 Jan 2027 → naive `2027-1` vs ISO `2026-53`). Sunday is exactly when a household plans the week ahead; on that day the home screen and the schedule screen request two different periods, so the context cache never matches and both fetch. Separately `WeekNavigator.jsx:13,20,21` hardcodes 52 — **2026 is a 53-week ISO year** (verified), so forward navigation from week 52 skips week 53 entirely into 2027, and a user sitting on week 53 can be sent to a nonexistent week 54.

**Fix.** Delete `getCurrentPeriod` from `SchedulesContext.jsx` and import `getCurrentWeek`. Replace the `52` literals with `dayjs().isoWeekYear(year).isoWeeksInYear()` via a helper in `constants/schedule.js`.

**Suggested command:** `/impeccable harden`

### [P2] Users are shown raw HTTP status codes, with no retry — and pay 2 forced seconds on every launch

**Why it matters.** `fetchWithAuth` (`api.js:34`) throws `new ApiError(response.status, \`API error: ${response.status}\`)` — it never reads the server's message, so the string is unconditional. `GroupSchedulePage.jsx:53` renders `err.message` directly, meaning a family member who hits a stale membership sees **"API error: 403"**. Every catch in `GroupSettingsPage` collapses to "Could not rename" / "Could not remove member" with no cause and no retry button. Separately, `App.jsx:24` gates render on `MIN_SPLASH_DURATION = 2000` even when auth resolves in 80ms — a 20–25% tax on the stated "under ten seconds" session, paid on every cold start, and iOS evicts PWAs constantly.

**Fix.** Map `ApiError.status` to human copy ("You're no longer a member of this group" / "Couldn't reach the server") and render a "Try again" that re-calls `loadData()`. Drop the splash minimum to ~400ms or gate on `isLoading` alone.

**Suggested command:** `/impeccable clarify`

## Persona Red Flags

**Casey (Distracted Mobile) — this *is* the target user.** 2000ms of splash before any content, while walking. A full Groups screen to tap through for a one-group household, with no last-opened memory. The week navigator and view toggle sit at the very *top* of the screen — thumb-hostile — while the bottom 90px is reserved for a two-tab nav she rarely uses. No swipe between weeks, the product's only navigation axis, requiring instead a precise 40px circular button at the top. Week state lives in component state, not the URL, so backgrounding and returning restores the wrong week with a full re-fetch. Share / Copy / **Revoke** are three 34px targets in a `gap-1` row — under the 44pt floor, with Revoke adjacent to Copy. And no offline state: a tile flips green on the tube, the POST fails, a 2.4s toast reverts it, and she is already in her pocket believing she's out for Thursday.

**Sam (Accessibility-Dependent).** Cannot reliably sign in — `Field.jsx` labels are not associated, so Email and Password both announce as "edit text, blank". `outline-none` with a 1.5px colour-only `focus-within:border-coral` is the entire focus indicator on every text input. `MealTile` gives no `aria-pressed`, no day context: 14 identical "Lunch"/"Dinner" buttons whose state is colour plus a text glyph. `chalk-faint` at ≈2.1:1 carries the 10px inactive nav labels and every section header. Six of ten screens have no heading element. `Toast` is silent to assistive tech. `BottomSheet` has no focus trap, so opening the delete-group sheet leaves focus behind the scrim.

**Jordan (First-Timer).** Sign-up ends in a dead end: "An administrator will review your request" — no who, no how long, no notification, and a manual "Check again" button with no auto-poll. Nothing suggests the invite-link path that would have auto-approved him. He will never press the unlabeled `repeat` icon, so he does 14 taps a week forever. If he backs out of the post-creation settings screen, the home screen never says "invite" — the gear glyph is the only route. The day strip has no affordance indicating it scrolls or that tapping changes what's below.

**Dominique (the household cook — project-specific persona from PRODUCT.md).** Opens the app to *read*, not write; she's always eating. The app shows her the writer's view first, every time. To answer "how many am I cooking this week" she taps seven times and holds fourteen numbers. The counts she came for are the smallest type on the block, subordinate to 28px headings and wrapped name badges. Notes — "bringing someone", the thing that changes her shopping — are the deepest element in the hierarchy, below both meal blocks, on a day she has to have selected first. The navigator tells her "Week 33"; she shops against dates. And no screen anywhere answers the week-level question the product's first sentence promises.

## Minor Observations

- **`.claude/ui.md` is materially stale**: documents routes that don't exist (`/groups/:groupId` vs the shipped `/groups/:groupId/:groupName`), a four-tab bottom nav where `BottomNav.jsx` has two, and an Icon symbol list missing `meal`, `google`, `sliders`, `key`, `lock`, `info`, `code`, `branch`, `eye`, `eye-off`, `repeat`.
- **`initialsOf` takes the first two characters, not initials** (`constants/colors.js:31`): "The Sue Family" → "TH", "Jean Raymond" → "JE". DESIGN.md specifies 2-character *initials*; every multi-word avatar is mislabelled.
- **The avatar palette includes sage and red** — the two colours the Two-Colour Verdict Rule reserves for in/out. A member whose name hashes to red sits inside the Lunch block.
- **`TopBar` fades from `slate-1` over a `slate-void` page** — the bar is *lighter* than the page, inverting DESIGN.md's documented slate-0 bar → slate-1 page ramp. No container ever paints `slate-1`.
- **Group name is carried in the URL path and re-decoded for display**; after a rename, any bookmarked URL shows the old name against current data.
- **`Toast` never clears its previous timeout**, so two toasts in quick succession dismiss the second early.
- **`handleToggle`'s rollback discards concurrent edits**: tap Lunch then Dinner, Lunch's POST fails, and `setSchedule(prev)` silently undoes the successful Dinner write.
- **`CommentEditorSheet` persists from both `onBlur` and `handleClose`** — two POSTs and two "Saved" toasts on a scrim tap.
- **Sign out is `variant="danger"`** (red) with no confirm; DESIGN.md reserves red for destructive-or-wrong, and signing out is neither.
- **No `path="*"` route**, so a stale link (the removed `/groups/:id/comments`) renders an empty shell.
- **Dead API surface**: `createNotice`/`deleteNotice` and `updateMemberSchedule`/`updateMemberPersonalSchedule` have zero callers. The "notice" entity exists in the data model and backend with no UI at all.
- **`ConfirmSheet` and `DeleteGroupSheet` hand-roll the ghost Cancel** with `Button.jsx`'s classes copy-pasted — two sources of truth, and those two Cancels are the only tappable elements without press feedback.
- **`AboutPage`'s `checkForUpdate()` has no failure branch** — a failed check renders "✓ Up to date".

## Questions to Consider

1. **If the cook is the decisive reading, why is the writer's view the default — and why is her number the smallest type on the screen?** What does this app look like if `GroupSchedulePage` opens on Everyone?
2. **What is the Groups screen for in a household with one group?** If the answer is "switching between rare second groups", should it be a top-bar chip rather than the app's home route and its first tap?
3. **If "the usual" makes the weekly act a correction rather than data entry, why does it live behind an unlabeled icon on another route?** What if the week simply *opened* pre-filled from the default — no bridge, no discovery required?
4. **Why is the week identified by a number nobody in a kitchen uses?** "10–16 Aug" in the navigator with the ISO number demoted would remove the product's last piece of engineering vocabulary.
5. **What would "à table." doing real work look like?** It sits on the two screens with no job. Would the Everyone board reading "à table — 6 for dinner" turn a roster into a household object?
6. **A person's "no" and a person's silence are different — DESIGN.md says so explicitly.** So why does a member who never opened the app render identically to one who declared they're out? The data model's `0` cannot distinguish unset from refused. Is the third state worth having?
7. **DESIGN.md mandates a token that measures 2.1:1.** Is the system willing to amend its own token to pass AA, or does dark-only chalk-on-slate have a floor it should declare openly? The implementation cannot fix this alone.
