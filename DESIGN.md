---
name: Meal Planner — Ardoise
description: A warm dark chalkboard for a household, where the week's meals are written in chalk and read at a glance.
colors:
  slate-void: "#0d100e"
  slate-0: "#171b18"
  slate-1: "#1f2421"
  slate-2: "#262c28"
  chalk: "#f1ead9"
  chalk-dim: "rgba(241, 234, 217, 0.6)"
  chalk-faint: "rgba(241, 234, 217, 0.26)"
  line: "rgba(241, 234, 217, 0.18)"
  coral: "#e9806a"
  mustard: "#e7c24d"
  sage: "#9cc08a"
  red: "#df6253"
  lilac: "#cbb9e8"
  ink-on-coral: "#221311"
  ink-on-accent: "#1b1f1c"
typography:
  display:
    fontFamily: "Caveat, cursive"
    fontSize: "60px"
    fontWeight: 700
    lineHeight: 0.86
    letterSpacing: "normal"
  headline:
    fontFamily: "Caveat, cursive"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  title:
    fontFamily: "Caveat, cursive"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.24em"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  xs: "9px"
  sm: "12px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink-on-coral}"
    rounded: "{rounded.md}"
    padding: "15px 20px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink-on-coral}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-dim}"
    rounded: "{rounded.md}"
    padding: "15px 20px"
    width: "100%"
  button-ghost-hover:
    textColor: "{colors.chalk}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.red}"
    rounded: "{rounded.md}"
    padding: "15px 20px"
    width: "100%"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-dim}"
    rounded: "{rounded.full}"
    height: "40px"
    width: "40px"
  icon-button-hover:
    textColor: "{colors.chalk}"
  card:
    backgroundColor: "rgba(241, 234, 217, 0.05)"
    textColor: "{colors.chalk}"
    rounded: "{rounded.lg}"
  field-input:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    padding: "8px 2px"
    width: "100%"
  field-label:
    textColor: "{colors.chalk-dim}"
    typography: "{typography.label}"
  meal-tile-on:
    backgroundColor: "rgba(156, 192, 138, 0.15)"
    textColor: "{colors.sage}"
    rounded: "{rounded.md}"
    width: "clamp(64px, 20vw, 74px)"
    height: "54px"
  meal-tile-off:
    backgroundColor: "rgba(223, 98, 83, 0.15)"
    textColor: "{colors.red}"
    rounded: "{rounded.md}"
    width: "clamp(64px, 20vw, 74px)"
    height: "54px"
  member-badge:
    backgroundColor: "rgba(241, 234, 217, 0.05)"
    textColor: "{colors.chalk}"
    rounded: "{rounded.full}"
    padding: "4px 12px 4px 4px"
  now-chip:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.slate-0}"
    rounded: "{rounded.full}"
    padding: "2px 7px"
  bottom-nav:
    backgroundColor: "rgba(23, 27, 24, 0.9)"
    textColor: "{colors.chalk-dim}"
    height: "74px"
    width: "100%"
  bottom-sheet:
    backgroundColor: "{colors.slate-2}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.xl}"
    padding: "12px 20px 20px"
  toast:
    backgroundColor: "{colors.slate-2}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
---

# Design System: Meal Planner — Ardoise

## Overview

**Creative North Star: "The Kitchen Chalkboard"**

This is the board by the fridge. Not a café's specials board performing for the street — the
household's own slate, where somebody writes who's home for dinner, and everybody else reads it
on the way past. It is domestic and unpolished by intent: the lettering is hand-drawn, the rules
are dashed, the surface has chalk dust in it. Nobody is being sold anything on this board.

Everything follows from the material. The ground is warm dark slate (`#0d100e` under a radial
lift toward `#16201a`), never neutral grey and never black; surfaces are made by laying
translucent chalk over that slate at 4–6% rather than by stacking lit cards. Structure is drawn,
not built: a hairline at 18% chalk divides, a dashed hairline at 26% groups or marks something
provisional. Type does the emotional work — Caveat carries every name in the product, Archivo
carries every instruction — and colour is rationed hard: one warm accent for action, one for
secondary marks, and a green/red pair that means one thing only.

The density is generous rather than tight. This is a phone app used one-handed in a hallway for
about eight seconds, so tap targets are large (54–74px meal tiles, 40px icon buttons), text is
never smaller than 9px and anything that small is uppercase and letter-spaced to stay readable.
The redesign this system replaced was generic soft-Material: floating drop-shadow cards, gradient
app bars, blurred gradient blobs. Those are the confirmed anti-references, and their absence is
the point.

**Key Characteristics:**
- Warm dark slate ground with baked-in chalk-dust grain; **dark-only, permanently**
- Hand-lettered Caveat for names, letter-spaced uppercase Archivo for instructions
- Depth by translucency and hairline, not by shadow
- Sage/red meal state that is never grey and never empty
- Stroked SVG icons roughened by a displacement filter so every line looks drawn
- One-tap, no-save, no-dialog interaction — motion exists only to confirm a press

## Colors

A warm, low-chroma palette: everything is either slate, chalk, or one of four chalk-stick pigments
that read as pastel on dark without ever going neon.

### Primary
- **Warm Coral** (`#e9806a`): the single action colour. Primary buttons, the "today" bar in the
  week list, the focus underline on a field, the dashed crest ring on splash and login, the
  Dinner heading, active note buttons, "Create account". If something is the thing to press, it
  is coral; if it is coral, it is pressable or it is *now*.

### Secondary
- **Chalk Mustard** (`#e7c24d`): marks, never actions. The "Now" chip on the current week, the
  Admin badge, the Lunch heading, the note-present dot in the day strip, the crest glyph on
  splash and login, the hover colour of a group name.

### Tertiary
- **Muted Sage** (`#9cc08a`): *in*. A meal you are attending, a success toast, a positive field
  hint. Nothing else.
- **Chalk Red** (`#df6253`): *out*, or wrong. A meal you are skipping, a destructive action, an
  error, the danger-zone section label. Nothing else.
- **Soft Lilac** (`#cbb9e8`): avatar fills only — the fifth entry in the deterministic
  name→colour palette, present so adjacent members don't collide. It never appears as UI colour.

### Neutral
- **Warm Chalk** (`#f1ead9`): all primary text and every icon stroke. Also the fill of the
  selected day in the day strip, where it inverts to slate text.
- **Chalk Dim** (60% chalk): **all** secondary and tertiary text — dates, member counts, sub-labels,
  section labels, placeholders, ghost-button text, inactive nav tabs, and any icon that carries
  meaning. 60% is not a taste choice: it is the lowest alpha clearing 4.5:1 on the lightest ground
  text ever sits on (chalk/5 over slate-2, where it measures 4.82:1). At 56% it measured 4.42:1.
- **Chalk Faint** (26% chalk): **decoration only** — dashed rules, the sheet grab handle, indicator
  dots, the empty-state ring illustration. It measures ~2.1:1 and must never carry text.
- **Hairline** (18% chalk): every solid border and divider in the system.
- **Warm Slate**: `slate-0` (`#171b18`) is the app-bar base and `slate-2` (`#262c28`) the raised
  surface (sheets, toasts). `slate-1` (`#1f2421`) is **not** a page surface despite its name — it
  survives only as the ring separating stacked avatars and as the update prompt's gradient end.
  The page itself is **Slate Void** (`#0d100e`) with a radial warm lift at 30% 0% toward `#16201a`,
  and an `feTurbulence` grain blended `soft-light` into the body background.
- **Accent Ink** (`#1b1f1c`, and `#221311` on coral): the near-black used for text sitting *on* a
  pigment — avatar initials, primary button labels, the "Now" chip. Never used as a background.

### Named Rules
**The One-Accent Rule.** Coral is the only colour that means "press this". Mustard marks and
labels but never becomes a button; a screen with two competing accent buttons is wrong.

**The Two-Colour Verdict Rule.** Sage and red carry exactly two meanings between them — *in / out*
for a meal, and *succeeded / failed* for system feedback. They are never decoration, never a
category colour, never a chart colour.

**The Never-Grey Rule.** No state is communicated by greying something out, with one exception:
days already past are dimmed to 45% because they are no longer editable. Everything else that is
"off" is *red and explicit*. An unset meal and a refused meal must not look alike.

**The Two-Tier Text Rule.** Text and meaningful icons get exactly two tiers: `chalk` and
`chalk-dim`. There is no third, fainter legible tier and there cannot be one — on this ground any
alpha that clears 4.5:1 is *brighter* than `chalk-dim`, so "fainter but still readable" is
arithmetically impossible. When a label feels too loud at 60%, make it smaller or shorter; never
dimmer. `chalk-faint` is decoration.

## Typography

**Display Font:** Caveat (fallback `cursive`), weights 400/600/700 — self-hosted via `@fontsource`
**Body Font:** Archivo (fallback `system-ui, sans-serif`), weights 400/500/600/700
**Label/Mono Font:** JetBrains Mono, weights 400/500/700

**Character:** A hand-lettered marker against a tight grotesque. Caveat supplies the entire
personality of the product — it is the chalk — while Archivo stays flat, small and disciplined so
that instructions never compete with names. JetBrains Mono appears only where a value is a value
(build hashes, version strings).

### Hierarchy
- **Display** (Caveat 700, 52–60px, line-height 0.86–1): the wordmark only — splash screen and the
  login crest. Appears twice in the product.
- **Headline** (Caveat 700, 30–34px, line-height 1): page titles in the top bar, bottom-sheet
  titles, empty-state headings.
- **Title** (Caveat 700, 23–28px, line-height 1): group names in the list, "Lunch" / "Dinner"
  block headings, "Week 24" in the navigator, "Notes".
- **Body** (Archivo 400/500/600, 13–16px, line-height 1.4–1.6): everything a user reads to act.
  Inputs are 16px specifically to stop iOS zooming on focus; member names are 15px/600; helper and
  note text is 13px in chalk-dim.
- **Label** (Archivo 600/700, 9–11px, uppercase, letter-spacing 0.12–0.24em): field labels and
  section labels at 10.5px/0.24em; nav tabs at 10px/0.1em; meal-tile captions at 9.5px/0.16em;
  badge text at 9.5px/0.12em.
- **Button** (Archivo 700, 13px, uppercase, letter-spacing 0.1em): all button labels, so they read
  as small-caps chalk labels rather than sentences.

### Named Rules
**The Chalk-Hand Rule.** Caveat is for the *names of things* — the app, a group, a day-part, a
week — and for the occasional handwritten aside ("nobody yet — quiet one"). It never sets body
copy, button labels, form labels, or anything a user must read precisely under time pressure.

**The Small-Caps Rule.** Any text below ~12px is uppercase Archivo with at least 0.12em tracking.
Small lowercase body text does not exist in this system; if a label is too small to letter-space,
it is too small to ship.

## Layout

A single-column phone app, centred and capped at `max-w-md` (448px) so it degrades to a phone-width
column on desktop rather than pretending to be responsive. The page gutter is a constant 20px
(`px-5`); vertical rhythm is built from 14px/18px row padding with hairline separators rather than
from card stacks.

The shell is three fixed parts: a **sticky top bar** that fades from `slate-0` to transparent over
its bottom 28% (so content scrolls under it rather than colliding with it), the **scrolling
content**, and a **fixed bottom nav** 74px tall plus safe-area inset. The content column reserves
90px of bottom padding for the nav. Transient overlays (toast, update prompt) sit at 96px from the
bottom, clear of it.

Safe-area handling is not optional: the top bar pads `max(1rem, env(safe-area-inset-top))`, the
bottom nav and every bottom sheet pad `env(safe-area-inset-bottom)`, and the document declares
`viewport-fit=cover`. Lists are separated by hairlines, not gaps — a group row is 18px of padding
over a dashed rule, a roster row is 12px over a solid one.

### Named Rules
**The Whole-Week Rule.** The week is never paginated into a day view for editing. Seven day rows,
two tap targets each, all on one screen. Any design that makes a user drill into a day to declare
a meal is wrong regardless of how it looks.

**The Reserved-Slot Rule.** Controls that appear conditionally are hidden, not removed — the
jump-to-today button keeps its slot with `invisible`, and the week box is a fixed 200px so it does
not resize when the "Now" chip appears. Layout must not shift as state changes.

## Elevation & Depth

The board is flat. There is no ambient shadow vocabulary, no elevation scale, and no lit-card
metaphor: depth is made by laying translucent chalk over slate (`rgba(241,234,217,0.04–0.06)`) and
drawing a hairline around it, plus the slate steps for genuinely stacked surfaces
(`slate-0` bar over the slate-void page → `slate-2` sheet). The bar must never be *lighter* than
the board it sits on; `slate-0` is chosen to sit within a shade of the page ground's top value. Blur appears exactly once, as
`backdrop-blur-md` behind the 90%-opaque bottom nav.

The single exception is for elements that float *free of the board* — the toast and the update
prompt — which carry one deep, soft lift so they read as objects in front of the slate rather than
marks on it.

### Shadow Vocabulary
- **Floating lift** (`box-shadow: 0 18px 44px -12px rgba(0,0,0,0.7)`): toast and update prompt
  only. Never on a card, row, button, tile, or bar.

### Named Rules
**The Flat-Board Rule.** Surfaces that live *on* the board are shadowless, always. A shadow is
permission to float, and only three things may float: the toast, the update prompt, and a bottom
sheet over its scrim.

## Shapes

Two geometries and nothing between them: **soft rectangles** and **full circles**.

Rectangles are rounded on a small scale — 9px for compact icon squares, 12–14px for buttons, meal
tiles, day-strip cells and the week box, 16–18px for cards and prompts, 20–22px for the largest
avatars and the top corners of a bottom sheet. Anything round is *fully* round (`9999px`): avatars,
icon buttons, member badges, the "Now" chip, toasts, indicator dots. There is no 50%-radius pill
applied to a wide rectangle, and no sharp 0px corner anywhere.

Borders carry most of the structure. Solid `1px`–`1.5px` hairlines at 18% chalk divide and outline;
**dashed** hairlines at 26% chalk mean something softer — a grouping rule between meal blocks, the
grab handle on a sheet, the "or with email" divider, an empty-state ring, a note field awaiting
text, a group row separator. State borders replace the hairline entirely rather than adding to it:
a focused field's underline turns coral, a meal tile's border is sage or red at full strength.

Icons are stroked SVG (`fill: none`, `stroke: currentColor`, round caps and joins, 2px nominal
weight) passed through a shared `feTurbulence` + `feDisplacementMap` filter at scale 1.1, so every
line has a chalk wobble. Group avatars are rounded squares rotated `-3deg`; member avatars are
circles.

### Named Rules
**The Dashed-Line Rule.** Solid hairline = structural division. Dashed hairline = provisional,
optional, empty, or hand-drawn. Never use dashed to divide two equally solid things.

**The Drawn-Not-Rendered Rule.** Every glyph in the product goes through the chalk filter. No
imported icon set, no icon font, no emoji, no filled/solid icon styles.

## Components

### Buttons
- **Shape:** softly rounded rectangle (14px), full-width by default, 15px vertical padding.
- **Label:** always Archivo 700, 13px, uppercase, 0.1em tracking.
- **Primary:** solid coral with near-black ink (`#221311`). Hover lifts `brightness(105%)`.
- **Ghost:** transparent with a hairline border and chalk-dim label; hover raises the label to full
  chalk. Used for secondary and for federated sign-in.
- **Danger:** transparent with a red border and red label; hover fills `red/10`.
- **Press:** every variant scales to `0.98` on `:active`. Disabled drops to 40% opacity and
  disables pointer events.

### Icon Buttons
- 40px circle, 1.5px hairline border, chalk-dim glyph at 58% of the box.
- Hover raises glyph to chalk and border to chalk-dim; `:active` scales to `0.95`; disabled drops
  to 25% opacity.
- Variants override the border only: the jump-to-today control is a *dashed coral* circle,
  reusing the same back-chevron glyph that the "next" button rotates 180°.

### Cards / Containers
- **Corner:** 18px.
- **Background:** 5% chalk over slate; no gradient, no shadow.
- **Border:** 1px hairline, or dashed chalk-faint when the card frames something provisional.
- **Padding:** supplied by the caller — the card is a surface, not a layout.

### Inputs / Fields
- **Style:** an uppercase 10.5px/0.24em chalk-dim label above a transparent input sitting on a
  1.5px hairline **underline**. Never a box, never a fill.
- **Focus:** the underline turns coral **and thickens to 2px**, so focus is never signalled by
  colour alone. Labels are associated with `useId()`; help text is wired via `aria-describedby`.
- **Size:** 16px text, 8px vertical padding — the 16px is load-bearing on iOS.
- **Help:** 11px line under the field, toned chalk-dim / sage / red.
- **Textarea:** same idea with a *dashed* underline and an italic chalk-dim placeholder;
  auto-grows to content.

### Navigation
- **Top bar:** sticky, gradient-faded from `slate-0`, safe-area padded. Caveat 30px title with an
  optional 11px/0.2em uppercase sub-line, an optional leading slot (back) and trailing slots
  (actions), all icon buttons.
- **Bottom nav:** fixed, 74px + safe-area, `slate-0/90` with `backdrop-blur-md` and a top hairline.
  Two tabs, each a 20px chalk icon over a 10px/0.1em uppercase label; active is full chalk,
  inactive is chalk-dim. No indicator bar, no pill, no colour — presence *is* the indicator.

### Bottom Sheets
- `slate-2`, 22px top corners, top hairline, 80vh max, scrim `black/55`.
- Opens with a 0.16s `rise` (16px translate + fade); the scrim fades over the same 0.16s.
- A dashed chalk-faint grab handle (40px wide) sits centred above the content.
- Titles are Caveat 30px. Sheets close on Escape and on scrim tap, and lock body scroll.

**The sheet family.** Every modal in the product is this shell with different contents; there is
no dialog, popover, or drawer anywhere else in the system.

- **Confirm** (kick, revoke, leave): a 54px red icon plaque (16px radius, `red/15` fill) states
  the stakes above the title, then a danger button over a ghost Cancel.
- **Delete group** (the one irreversible action): the title itself turns red, and the destructive
  button stays locked at 40% opacity until the typed text matches the group name exactly. No other
  action in the product is type-to-confirm, and none other should be.
- **Name** (create / rename): one shared layout — a live initials-avatar preview (74px, 20px
  radius, tilted `-3deg`, filled from the name hash) above a single underlined field, so the
  group's identity appears as it is typed.
- **Comment editor**: the only sheet with no buttons. A day heading over its full date, then a
  mustard *Lunch* and a coral *Dinner* field on dashed underlines that auto-grow. It saves on blur
  and on dismiss; past days render read-only with a Caveat murmur instead of a disabled banner.

### Meal Tile (signature)
The product's core control. A 54px-tall rounded rectangle (14px) with a 1.5px border, holding a
17px verdict glyph over a 9.5px uppercase caption. Width is `clamp(64px, 20vw, 74px)`: 74px on a
normal phone, yielding to 64px at 320px so the day name beside it never collides.

- **On:** sage border, `sage/15` fill, sage `✓`.
- **Off:** red border, `red/15` fill, red `✕`.
- **Past:** the whole day row drops to 45% opacity and the tile stops responding; the tile itself
  never changes colour to indicate that.
- One tap flips it. No confirm, no save, no intermediate state.

### Week Navigator (signature)
A fixed-width (200px) 14px-radius chalk box showing "Week NN" in Caveat 23px over the year in
10px/0.16em uppercase, flanked by three 40px circular icon buttons that flex cannot shrink. A
mustard "Now" chip pins to the right edge of the box on the current week and is removed otherwise.
Backwards navigation stops at the current week.

### Week Board (signature)
The reading counterpart to the Meal Tile: seven columns, one per day, sized with `flex-1` so the
whole week fits the phone column and **nothing scrolls sideways**. Each column carries a day header
chip over two headcount cells and a reserved 5px marker slot, and the whole column is the tap target
that selects the day detailed below.

- **Header chip** (8px radius): 8.5px uppercase day abbreviation over a 14px date. Chalk-dim at
  rest, coral on today, and it **inverts** to solid chalk with slate text on the selected day.
- **Headcount cells** (8px radius, 25px tall): an 8.5px `L` / `D` letter beside a 13px tabular
  number. A count carries its meal's tone (mustard for lunch, coral for dinner) as a 45%-opacity
  border over a 15% fill; a zero is a hairline border with a chalk-dim em-dash. The letter means
  the board never depends on colour alone to say which meal a number belongs to.
- **A zero is an em-dash, not a grey number.** The Never-Grey Rule governs *refusal*; a headcount of
  nobody is genuine absence, so it reads as nothing rather than as somebody's "no".
- **Marker slot** keeps its 5px height on every column so heights never shift; a mustard dot fills
  it when that day carries notes.
- Below the board, the selected day is named in Caveat 30px beside its full date in 10.5px/0.2em
  uppercase, then Lunch and Dinner attendee badges, then Notes — numbers first, names second, notes
  third, matching how the cook reads.

### Member Badge & Avatar
- **Avatar:** circle filled from a deterministic name→colour hash over the five-pigment palette,
  with 2-character uppercase initials in accent ink at 40% of the avatar size. Adjacent avatars in
  a list are nudged to avoid repeating a colour. Stacked avatars overlap `-7px` with a 2px
  `slate-1` ring.
- **Badge:** a full-round 13px chip — 22px avatar, then the name — on 5% chalk with a hairline.

### Toast
Full-round `slate-2` pill, 96px from the bottom, centred, with the floating lift shadow. Success is
sage-bordered with a check glyph, error is red-bordered with an info glyph, neutral is
hairline-bordered with no icon. Auto-dismisses at 2.4s.

### Spinner
Three 8px dots — coral, mustard, sage — bouncing with a 0.16s stagger. There is no ring spinner and
no skeleton screen in this system.

## Do's and Don'ts

### Do:
- **Do** build depth from translucent chalk (`rgba(241,234,217,0.04–0.06)`) plus a hairline
  (18% chalk), not from shadow. Reserve `0 18px 44px -12px rgba(0,0,0,0.7)` for the toast and the
  update prompt.
- **Do** set every name in Caveat and every instruction in Archivo — the Chalk-Hand Rule.
- **Do** letter-space and uppercase anything under 12px (0.12–0.24em).
- **Do** keep text and meaningful icons on `chalk` or `chalk-dim` only — the Two-Tier Text Rule.
  `chalk-faint` is for dashed rules, grab handles, indicator dots, and empty-state illustration.
- **Do** signal focus with more than colour: the field underline turns coral **and** thickens to 2px.
- **Do** give every control an accessible name and state — `useId()`-paired labels on fields,
  `aria-pressed` plus a day-qualified label on each meal tile, `aria-label` on every sheet,
  `role="status"`/`role="alert"` on toasts, and a real `<h1>` in the top bar.
- **Do** make "not eating" red and explicit. The Never-Grey Rule: only the past may be dimmed.
- **Do** keep coral as the only pressable colour and mustard as a marking colour.
- **Do** give every tappable element `active:scale-[0.93–0.98]` — it is the only motion budget the
  system has.
- **Do** pad for the notch: `pt-[max(1rem,env(safe-area-inset-top))]` on bars,
  `env(safe-area-inset-bottom)` on the nav and every sheet.
- **Do** draw new icons as stroked SVG through the shared `#chalk` displacement filter, and reduce
  the displacement scale at small sizes so they stay legible.
- **Do** hold input text at 16px so iOS does not zoom on focus.
- **Do** hide conditional controls (`invisible`) rather than removing them, and fix the width of
  containers whose contents change — the layout must not shift.

### Don't:
- **Don't** add soft drop-shadow floating cards, gradient app bars, or blurred gradient blobs.
  These are the confirmed anti-references the Ardoise identity was built to remove.
- **Don't** express "not eating" — or any other refusal — as a greyed, unset, or empty checkbox.
  Absence and refusal must never look alike.
- **Don't** put a form input in a filled box, an outlined rectangle, or a Material-style container.
  Fields are a chalk underline on transparent, always.
- **Don't** add light mode, a theme toggle, or light-mode tokens. Dark-only is an identity
  commitment, not a default.
- **Don't** animate anything beyond press feedback, the 0.16s sheet fade/rise, the splash crest's
  breathe, and the spinner's staggered dot bounce. No entrance staggers, no scroll reveals, no
  page transitions.
- **Don't** use sage or red for anything other than meal state and system verdict, and don't use
  lilac anywhere except an avatar fill.
- **Don't** import an icon set, icon font, or emoji. Every glyph is drawn and filtered.
- **Don't** use pure black, pure white, or a neutral grey. The ground is warm slate; the ink is
  warm chalk.
- **Don't** put text, a placeholder, or a meaning-carrying icon on `chalk-faint`. It measures ~2.1:1
  and fails WCAG AA at every size.
- **Don't** introduce a sharp 0px corner or a half-round pill on a wide rectangle — soft rectangle
  or full circle, nothing between.
- **Don't** make the user press Save. Attendance and notes persist optimistically on interaction.
