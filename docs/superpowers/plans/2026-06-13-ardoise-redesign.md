# Ardoise Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the Meal Planner PWA (`packages/web-client-v2`) to the dark "Ardoise" chalkboard-café identity, dropping MUI/Emotion and rebuilding presentation on Tailwind v4.

**Architecture:** Foundation-first (approach A). Build Tailwind tokens, self-hosted fonts, a chalk SVG-icon system, and a small set of hand-built primitive components; then convert leaf components and pages in dependency order, keeping the app runnable the whole time; remove `@mui/*` + `@emotion/*` only in the final step. **All business logic (auth, schedules context, API calls, ISO-week math, form validation, PWA update hook) is preserved verbatim** — only presentation changes. Group management stays out of scope.

**Tech Stack:** React 18, Vite 6, `vite-plugin-pwa`, **Tailwind CSS v4** (`@tailwindcss/vite`), `@fontsource` (Archivo / Caveat / JetBrains Mono), AWS Amplify, react-router-dom 7, dayjs.

**Spec:** `docs/ui-design/ardoise/ardoise.md` + `ardoise.html` (visual source of truth) and `docs/superpowers/specs/2026-06-13-ardoise-redesign-design.md`.

---

## Testing approach (read first)

`web-client-v2` has **no test framework** (no test deps, no `test` script), and this is a visual/CSS redesign where unit-test TDD is a poor fit. Adding a test harness is out of scope. Therefore each task is verified by:

1. **Build:** `yarn --cwd packages/web-client-v2 build` → exits 0, no errors.
2. **Lint:** `yarn --cwd packages/web-client-v2 lint` → exits 0, no errors/warnings introduced.
3. **Visual acceptance:** run `yarn --cwd packages/web-client-v2 dev` (fixed port 3000), open the relevant screen in a phone-width viewport (e.g. 360–390px), and confirm the concrete checks listed in the task against `ardoise.html`.

The dev server proxies `/api/*` to production, so live auth/data work locally. Commit after each task passes all three.

**Reference for visuals:** open `docs/ui-design/ardoise/ardoise.html` in a browser. Each port task cites the screen and the chalk CSS classes to translate into Tailwind utilities. Token values live in the spec §3.1.

---

## File structure

```
packages/web-client-v2/
├── vite.config.js                         # MODIFY: add @tailwindcss/vite; rework PWA manifest/icons
├── index.html                             # MODIFY: apple-touch-icon; confirm viewport-fit=cover
├── package.json                           # MODIFY: add tailwind+fonts; remove MUI/Emotion (last)
├── src/
│   ├── index.css                          # CREATE: @import tailwindcss, @theme tokens, base, grain
│   ├── main.jsx                           # MODIFY: import index.css + @fontsource; drop ThemeProvider
│   ├── theme.js                           # DELETE (last)
│   ├── App.jsx                            # MODIFY: chalk shell, BottomNav, routes (drop /day route)
│   ├── components/
│   │   ├── Icon.jsx                        # CREATE: chalk sprite + <Icon name>
│   │   └── ui/                             # CREATE: primitives
│   │       ├── Button.jsx
│   │       ├── IconButton.jsx
│   │       ├── Spinner.jsx
│   │       ├── Field.jsx                   # label + chalk underline input
│   │       ├── Textarea.jsx                # dashed-underline chalk textarea
│   │       ├── Card.jsx
│   │       ├── Badge.jsx                   # name badge / chip
│   │       ├── Avatar.jsx                  # initials + palette color
│   │       ├── Toast.jsx                   # ToastProvider + useToast
│   │       ├── BottomSheet.jsx
│   │       ├── TopBar.jsx
│   │       ├── BottomNav.jsx
│   │       └── MealTile.jsx                # green=in / red=out tap target
│   │   ├── WeekNavigator.jsx               # REBUILD (chalk)
│   │   ├── PersonalScheduleView.jsx        # REBUILD (My week)
│   │   ├── MembersScheduleView.jsx         # REBUILD (day-centric Everyone + inline Notes)
│   │   ├── CommentEditorSheet.jsx          # CREATE (replaces CommentsPage route + CommentsDrawer)
│   │   ├── CommentsDrawer.jsx              # DELETE (replaced by inline Notes + CommentEditorSheet)
│   │   ├── SplashScreen.jsx                # REBUILD
│   │   └── UpdatePrompt.jsx                # REBUILD
│   ├── constants/
│   │   └── colors.js                       # CREATE: name→palette hash (Ardoise colors)
│   └── pages/
│       ├── LoginPage.jsx                   # REBUILD
│       ├── SignUpPage.jsx                  # REBUILD (+ pending approval)
│       ├── GroupsPage.jsx                  # REBUILD (informational empty state)
│       ├── GroupSchedulePage.jsx           # REBUILD (My week / Everyone)
│       ├── DefaultSchedulePage.jsx         # REBUILD ("the usual")
│       ├── CommentsPage.jsx                # DELETE (editing moves into CommentEditorSheet)
│       ├── SettingsPage.jsx                # REBUILD
│       ├── AccountPage.jsx                 # REBUILD
│       └── AboutPage.jsx                   # REBUILD
```

**Unchanged (do not touch logic):** `contexts/AuthContext.jsx`, `contexts/SchedulesContext.jsx`, `services/api.js`, `constants/schedule.js`, `config.js`.

**Existing API surface to reuse (do not change):**
- `useAuth()` → `{ user:{memberId,name,email}, isAuthenticated, isLoading, error, oauthMessage, clearOauthMessage, signIn, signInWithGoogle, signUp, signOut }`.
- `useSchedules()` → `{ schedules, loading, error, fetchSchedules, updateMemberPersonalSchedule, updateMemberSchedule }`.
- `api.getSchedules(period)`, `api.createSchedule(groupId,{period,schedule}|{default:true,schedule})`, `api.createComments(groupId,{year,weekNumber,monday,…,sunday})`.
- `constants/schedule.js`: `DAYS`, `DAY_LABELS`, `MEAL.{LUNCH:1,DINNER:2}`, `getCurrentWeek()`, `getWeekDates(year,week)`, `getTodayIndex(year,week)`.

---

# Phase 0 — Foundation

### Task 1: Tailwind v4 + tokens + self-hosted fonts + base/grain

**Files:**
- Modify: `packages/web-client-v2/package.json`
- Modify: `packages/web-client-v2/vite.config.js`
- Create: `packages/web-client-v2/src/index.css`
- Modify: `packages/web-client-v2/src/main.jsx`

- [ ] **Step 1: Add dependencies (strict-pinned)**

```bash
yarn --cwd packages/web-client-v2 add -E tailwindcss@4.1.11 @tailwindcss/vite@4.1.11 @fontsource/archivo@5.2.5 @fontsource/caveat@5.2.5 @fontsource/jetbrains-mono@5.2.5
```
(If a listed version is unavailable, pick the closest current stable and pin exactly with `-E`.)

- [ ] **Step 2: Register the Tailwind Vite plugin**

In `vite.config.js`, import and add the plugin (keep `react()` and `VitePWA(...)` as-is for now):

```js
import tailwindcss from '@tailwindcss/vite';
// ...
plugins: [
  react(),
  tailwindcss(),
  VitePWA({ /* unchanged for now */ }),
],
```

- [ ] **Step 3: Create `src/index.css` with tokens, base, and chalk grain**

```css
@import 'tailwindcss';

/* Ardoise design tokens — exposed as Tailwind color/font utilities AND CSS vars */
@theme {
  --color-slate-0: #171b18;
  --color-slate-1: #1f2421;
  --color-slate-2: #262c28;
  --color-chalk: #f1ead9;
  --color-chalk-dim: rgba(241, 234, 217, 0.56);
  --color-chalk-faint: rgba(241, 234, 217, 0.26);
  --color-line: rgba(241, 234, 217, 0.18);
  --color-coral: #e9806a;
  --color-mustard: #e7c24d;
  --color-sage: #9cc08a;
  --color-red: #df6253;

  --font-hand: 'Caveat', cursive;
  --font-body: 'Archivo', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

@layer base {
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  html, body, #root { margin: 0; min-height: 100dvh; }
  body {
    font-family: var(--font-body);
    color: var(--color-chalk);
    background-color: #0d100e;
    background-image: radial-gradient(circle at 30% 0%, #16201a 0%, #0d100e 60%);
    background-attachment: fixed;
  }
  /* chalk-dust grain overlay (subtle) */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.5;
    mix-blend-mode: soft-light;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  #root { position: relative; z-index: 1; }
}
```

- [ ] **Step 4: Import CSS + fonts in `main.jsx`; remove MUI ThemeProvider/CssBaseline**

At the top of `main.jsx` add the font + stylesheet imports, and render the app WITHOUT MUI's `ThemeProvider`/`CssBaseline` (keep `AuthProvider`, `BrowserRouter`, etc. exactly as they were):

```js
import '@fontsource/caveat/400.css';
import '@fontsource/caveat/600.css';
import '@fontsource/caveat/700.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';
```
Remove `import { ThemeProvider } ...`, `createAppTheme`, `<CssBaseline/>`, and the `<ThemeProvider>` wrapper if present. Leave `theme.js` on disk for now (deleted in Task 20). If other files still import MUI, that's fine at this stage — the app keeps building.

- [ ] **Step 5: Verify build + lint**

Run: `yarn --cwd packages/web-client-v2 build` → Expected: success.
Run: `yarn --cwd packages/web-client-v2 lint` → Expected: 0 errors.
Run: `yarn --cwd packages/web-client-v2 dev`, open `http://localhost:3000` → Expected: warm slate gradient background with faint grain; fonts load (no FOUT). Existing screens may still look MUI-ish — that's expected.

- [ ] **Step 6: Commit**

```bash
git add packages/web-client-v2/package.json packages/web-client-v2/yarn.lock packages/web-client-v2/vite.config.js packages/web-client-v2/src/index.css packages/web-client-v2/src/main.jsx
git commit -m "feat(web): add Tailwind v4 foundation, Ardoise tokens, self-hosted fonts"
```

---

### Task 2: Chalk icon system (`Icon.jsx`)

**Files:**
- Create: `packages/web-client-v2/src/components/Icon.jsx`

The mockup defines a `<symbol>` sprite with a shared `feTurbulence`+`feDisplacementMap` "chalk" filter (see `ardoise.html` lines 316–340). Port it into a component that renders the hidden sprite once plus an `<Icon>` that references symbols by id.

- [ ] **Step 1: Create `Icon.jsx`**

```jsx
// Chalk-styled SVG icons. <ChalkSprite/> is rendered once (in App); <Icon name="…"/> references it.
// Glyphs are roughened by a shared feTurbulence+feDisplacementMap filter so strokes look chalk-drawn.
export const ChalkSprite = () => (
  <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
    <defs>
      <filter id="chalk" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <symbol id="ic-meal" viewBox="4 4 40 40">
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)">
          <circle cx="24" cy="24" r="8" />
          <path d="M24 24 L24 19" /><path d="M24 24 L29 24" /><circle cx="24" cy="24" r="0.9" fill="currentColor" stroke="none" />
          <path d="M8 8 L8 12.5 Q8 14.8 10 15.5" /><path d="M10 8 L10 15.5" /><path d="M12 8 L12 12.5 Q12 14.8 10 15.5" /><path d="M10 15.5 L10 40" />
          <path d="M40 8 L40 40" /><path d="M40 8 C 35.5 12.5, 35.5 19.5, 40 23" />
        </g>
      </symbol>
      <symbol id="ic-key" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="8.5" cy="8.5" r="4" /><path d="M11.4 11.4 L20 20 M16.5 16.5 l2.2 -2.2 M18.5 18.5 l2 -2" /></g></symbol>
      <symbol id="ic-lock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><rect x="5" y="10" width="14" height="9.5" rx="2" /><path d="M8 10 V7.5 a4 4 0 0 1 8 0 V10" /></g></symbol>
      <symbol id="ic-info" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="12" cy="12" r="9" /><path d="M12 11 V16" /><path d="M12 8 h0.01" /></g></symbol>
      <symbol id="ic-logout" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M14 5 H6 a1.2 1.2 0 0 0 -1.2 1.2 V17.8 A1.2 1.2 0 0 0 6 19 H14" /><path d="M17 8 l4 4 -4 4 M21 12 H10" /></g></symbol>
      <symbol id="ic-code" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M9 8 L5 12 L9 16 M15 8 l4 4 -4 4" /></g></symbol>
      <symbol id="ic-branch" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="6.5" cy="6" r="2.3" /><circle cx="6.5" cy="18" r="2.3" /><circle cx="17.5" cy="8" r="2.3" /><path d="M6.5 8.3 V15.7" /><path d="M17.5 10.3 v1.2 a4.5 4.5 0 0 1 -4.5 4.5 H9" /></g></symbol>
      <symbol id="ic-copy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15 V5.5 a1.5 1.5 0 0 1 1.5 -1.5 H15" /></g></symbol>
      <symbol id="ic-back" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M15 6 l-6 6 6 6" /></g></symbol>
      <symbol id="ic-gear" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="12" cy="12" r="3.2" /><path d="M12 3.5 v2.5 M12 18 v2.5 M3.5 12 h2.5 M18 12 h2.5 M6 6 l1.8 1.8 M16.2 16.2 l1.8 1.8 M18 6 l-1.8 1.8 M7.8 16.2 l-1.8 1.8" /></g></symbol>
      <symbol id="ic-note" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M5 5 h14 v10 l-4 4 H5 z" /><path d="M15 19 v-4 h4 M8 9 h8 M8 12 h5" /></g></symbol>
      <symbol id="ic-google" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M21 12.2 a9 9 0 1 1 -3.2 -6.4" /><path d="M21 12 H12.5" /></g></symbol>
      <symbol id="ic-refresh" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M19 8 a8 8 0 1 0 1.5 6" /><path d="M19 3 v5 h-5" /></g></symbol>
    </defs>
  </svg>
);

const Icon = ({ name, className = 'w-6 h-6', title }) => (
  <svg className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
    <use href={`#ic-${name}`} />
  </svg>
);

export default Icon;
```

Note: keep `feDisplacementMap scale` low (~1.1); if any icon looks illegible at ≤16px, drop the filter for that size.

- [ ] **Step 2: Verify build + lint**

Run: `yarn --cwd packages/web-client-v2 build` and `… lint` → Expected: success / 0 errors. (Visual check happens once `ChalkSprite` is mounted in Task 6.)

- [ ] **Step 3: Commit**

```bash
git add packages/web-client-v2/src/components/Icon.jsx
git commit -m "feat(web): add chalk SVG icon system"
```

---

### Task 3: Name→color helper + primitives A (Button, IconButton, Spinner, Field, Textarea)

**Files:**
- Create: `packages/web-client-v2/src/constants/colors.js`
- Create: `packages/web-client-v2/src/components/ui/Button.jsx`
- Create: `packages/web-client-v2/src/components/ui/IconButton.jsx`
- Create: `packages/web-client-v2/src/components/ui/Spinner.jsx`
- Create: `packages/web-client-v2/src/components/ui/Field.jsx`
- Create: `packages/web-client-v2/src/components/ui/Textarea.jsx`

- [ ] **Step 1: `constants/colors.js`** (deterministic palette; no current-user special case)

```js
// Deterministic name → Ardoise accent color, for avatars/marks. Everyone (incl. "you") is uniform.
const PALETTE = ['#e9806a', '#e7c24d', '#9cc08a', '#df6253', '#cbb9e8'];

export const colorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export const initialsOf = (name = '') =>
  name.trim().slice(0, 2).toUpperCase() || '?';
```

- [ ] **Step 2: `ui/Button.jsx`**

```jsx
// Chalk button. variant: 'primary' (coral) | 'ghost' (outline) | 'danger' (red outline).
const VARIANTS = {
  primary: 'bg-coral text-[#221311] hover:brightness-105',
  ghost: 'bg-transparent text-chalk-dim border border-line hover:text-chalk',
  danger: 'bg-transparent text-red border border-red hover:bg-red/10 flex items-center justify-center gap-2',
};

const Button = ({ variant = 'primary', className = '', children, ...props }) => (
  <button
    className={`w-full font-body font-bold uppercase tracking-[0.1em] text-[13px] py-[15px] rounded-[14px] cursor-pointer transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
```

- [ ] **Step 3: `ui/IconButton.jsx`** (round chalk button; `40px`, stays circular)

```jsx
import Icon from '../Icon';

const IconButton = ({ name, label, className = '', ...props }) => (
  <button
    aria-label={label}
    className={`flex-none w-10 h-10 grid place-items-center rounded-full border-[1.5px] border-line text-chalk-dim bg-transparent cursor-pointer transition hover:text-chalk hover:border-chalk-dim active:scale-95 disabled:opacity-25 disabled:pointer-events-none ${className}`}
    {...props}
  >
    <Icon name={name} className="w-[58%] h-[58%]" />
  </button>
);

export default IconButton;
```

- [ ] **Step 4: `ui/Spinner.jsx`** (three bouncing chalk dots — coral/mustard/sage)

```jsx
const Spinner = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-8">
    <div className="flex gap-2">
      {['bg-coral', 'bg-mustard', 'bg-sage'].map((c, i) => (
        <span key={c} className={`w-2 h-2 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </div>
    {label && <span className="text-chalk-dim text-sm">{label}</span>}
  </div>
);

export default Spinner;
```

- [ ] **Step 5: `ui/Field.jsx`** (label + chalk underline input; supports helper text)

```jsx
// Chalk text field: uppercase label, transparent input on a chalk underline.
// `help` renders below; `helpTone`: 'dim' | 'ok' | 'bad'.
const Field = ({ label, help, helpTone = 'dim', rightSlot, count, className = '', ...inputProps }) => {
  const tone = { dim: 'text-chalk-dim', ok: 'text-sage', bad: 'text-red' }[helpTone];
  return (
    <div className={`mb-3.5 ${className}`}>
      <div className="flex justify-between items-baseline">
        <label className="block text-[10.5px] tracking-[0.24em] uppercase text-chalk-dim mb-1.5">{label}</label>
        {count != null && <span className="text-[10px] tracking-[0.12em] text-chalk-faint">{count}</span>}
      </div>
      <div className="flex items-center gap-2 border-b-[1.5px] border-line focus-within:border-coral transition-colors">
        <input
          className="w-full bg-transparent border-0 text-chalk font-body text-[15px] py-2 px-0.5 outline-none placeholder:text-chalk-faint"
          {...inputProps}
        />
        {rightSlot}
      </div>
      {help && <div className={`text-[11px] mt-1.5 ${tone}`}>{help}</div>}
    </div>
  );
};

export default Field;
```

- [ ] **Step 6: `ui/Textarea.jsx`** (auto-grow, dashed underline)

```jsx
import { useRef, useEffect } from 'react';

const Textarea = ({ value, onChange, onBlur, placeholder, disabled, className = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full resize-none bg-transparent border-0 border-b border-dashed border-chalk-faint focus:border-coral text-chalk font-body text-[15px] py-2 outline-none placeholder:italic placeholder:text-chalk-faint disabled:opacity-70 ${className}`}
    />
  );
};

export default Textarea;
```

- [ ] **Step 7: Verify + commit**

Run: `yarn --cwd packages/web-client-v2 build` and `… lint` → Expected: success / 0 errors.
```bash
git add packages/web-client-v2/src/constants/colors.js packages/web-client-v2/src/components/ui/
git commit -m "feat(web): add color helper and base primitives (Button, IconButton, Spinner, Field, Textarea)"
```

---

### Task 4: Primitives B (Card, Avatar, Badge, Toast, BottomSheet)

**Files:**
- Create: `packages/web-client-v2/src/components/ui/Card.jsx`
- Create: `packages/web-client-v2/src/components/ui/Avatar.jsx`
- Create: `packages/web-client-v2/src/components/ui/Badge.jsx`
- Create: `packages/web-client-v2/src/components/ui/Toast.jsx`
- Create: `packages/web-client-v2/src/components/ui/BottomSheet.jsx`

- [ ] **Step 1: `ui/Card.jsx`**

```jsx
// Translucent chalk-over-slate surface with a hairline border. dashed=true for "template" framing.
const Card = ({ dashed = false, className = '', children }) => (
  <div className={`rounded-[18px] bg-chalk/5 border ${dashed ? 'border-dashed border-chalk-faint' : 'border-line'} ${className}`}>
    {children}
  </div>
);

export default Card;
```

- [ ] **Step 2: `ui/Avatar.jsx`**

```jsx
import { colorForName, initialsOf } from '../../constants/colors';

const Avatar = ({ name, size = 24, className = '' }) => (
  <span
    className={`grid place-items-center rounded-full font-bold text-[#1b1f1c] flex-none ${className}`}
    style={{ width: size, height: size, fontSize: size * 0.4, background: colorForName(name) }}
  >
    {initialsOf(name)}
  </span>
);

export default Avatar;
```

- [ ] **Step 3: `ui/Badge.jsx`** (avatar + name pill, used in Everyone)

```jsx
import Avatar from './Avatar';

const Badge = ({ name }) => (
  <span className="inline-flex items-center gap-2 pl-1 pr-3 py-1 border border-line rounded-full bg-chalk/5 text-[13px] leading-none">
    <Avatar name={name} size={22} />
    {name}
  </span>
);

export default Badge;
```

- [ ] **Step 4: `ui/Toast.jsx`** (provider + hook; chalk pill bottom-center, auto-dismiss)

```jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const show = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[96px] z-50 px-4 py-2.5 rounded-full bg-slate-2 border border-line text-chalk text-[13px] shadow-[0_18px_44px_-12px_rgba(0,0,0,0.7)]">
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
};
```

- [ ] **Step 5: `ui/BottomSheet.jsx`** (backdrop + rising slate-2 sheet, dashed grab-rule)

```jsx
import { useEffect } from 'react';

const BottomSheet = ({ open, onClose, children }) => {
  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/55 animate-[fadeIn_0.16s_ease-out]" onClick={onClose} />
      <div
        className="relative bg-slate-2 rounded-t-[22px] border-t border-line px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 max-h-[80vh] overflow-y-auto animate-[rise_0.16s_ease-out]"
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-3 w-10 border-b-2 border-dashed border-chalk-faint" />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
```

Add the keyframes to `index.css` `@layer base`:

```css
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes rise { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

- [ ] **Step 6: Verify + commit**

Run: `yarn --cwd packages/web-client-v2 build` and `… lint` → Expected: success / 0 errors.
```bash
git add packages/web-client-v2/src/components/ui/ packages/web-client-v2/src/index.css
git commit -m "feat(web): add Card, Avatar, Badge, Toast, BottomSheet primitives"
```

---

### Task 5: Structural primitives (TopBar, BottomNav, MealTile)

**Files:**
- Create: `packages/web-client-v2/src/components/ui/TopBar.jsx`
- Create: `packages/web-client-v2/src/components/ui/BottomNav.jsx`
- Create: `packages/web-client-v2/src/components/ui/MealTile.jsx`

- [ ] **Step 1: `ui/TopBar.jsx`** (sticky chalk bar with safe-area padding; Caveat title)

```jsx
// Sticky top bar. `left`/`right` are optional slots (e.g. IconButton); title in Caveat.
const TopBar = ({ title, sub, left, right }) => (
  <div className="sticky top-0 z-10 flex items-center gap-3 px-5 pb-3.5 pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-slate-1 from-[72%] to-transparent">
    {left}
    <div className="min-w-0">
      <div className="font-hand font-bold text-[30px] leading-none truncate">{title}</div>
      {sub && <div className="text-[11px] tracking-[0.2em] uppercase text-chalk-dim mt-0.5">{sub}</div>}
    </div>
    {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
  </div>
);

export default TopBar;
```

- [ ] **Step 2: `ui/BottomNav.jsx`** (two tabs, chalk icons; uses router)

```jsx
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../Icon';

const TABS = [
  { path: '/', name: 'meal', label: 'Groups' },
  { path: '/settings', name: 'gear', label: 'Settings' },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeIdx = pathname.startsWith('/settings') ? 1 : 0;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 h-[74px] flex bg-slate-0/90 border-t border-line backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t, i) => (
        <button
          key={t.path}
          onClick={() => navigate(t.path)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 bg-transparent border-0 cursor-pointer text-[10px] tracking-[0.1em] uppercase ${i === activeIdx ? 'text-chalk' : 'text-chalk-faint'}`}
        >
          <Icon name={t.name} className="w-5 h-5" />
          {t.label}
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
```

- [ ] **Step 3: `ui/MealTile.jsx`** (green=in / red=out tap target; the core toggle)

```jsx
// One-tap meal toggle. on=true → sage ✓ (in); on=false → red ✕ (out). disabled = past/read-only.
const MealTile = ({ label, on, onClick, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={[
      'w-[74px] h-[54px] rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-0.5 select-none transition active:scale-[0.93]',
      disabled ? 'cursor-default' : 'cursor-pointer',
      on ? 'border-sage bg-sage/15 text-sage' : 'border-red bg-red/15 text-red',
    ].join(' ')}
  >
    <span className="font-body font-extrabold text-[17px] leading-none">{on ? '✓' : '✕'}</span>
    <span className="text-[9.5px] tracking-[0.16em] uppercase">{label}</span>
  </button>
);

export default MealTile;
```

- [ ] **Step 4: Verify + commit**

Run: `yarn --cwd packages/web-client-v2 build` and `… lint` → Expected: success / 0 errors.
```bash
git add packages/web-client-v2/src/components/ui/
git commit -m "feat(web): add TopBar, BottomNav, MealTile primitives"
```

---

# Phase 1 — App shell & standalone screens

### Task 6: App shell (`App.jsx`) — layout, routes, providers, sprite, BottomNav

**Files:**
- Modify: `packages/web-client-v2/src/App.jsx`

- [ ] **Step 1: Rewrite `App.jsx`** (drop all MUI; mount `ChalkSprite`, `ToastProvider`, chalk `BottomNav`; remove the `/day/:day` comments route)

```jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SchedulesProvider } from './contexts/SchedulesContext';
import { ToastProvider } from './components/ui/Toast';
import { ChalkSprite } from './components/Icon';
import BottomNav from './components/ui/BottomNav';
import GroupsPage from './pages/GroupsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import GroupSchedulePage from './pages/GroupSchedulePage';
import DefaultSchedulePage from './pages/DefaultSchedulePage';
import UpdatePrompt from './components/UpdatePrompt';
import SplashScreen from './components/SplashScreen';

const MIN_SPLASH_DURATION = 2000;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const App = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_DURATION);
    return () => clearTimeout(t);
  }, []);

  if (isLoading || !minElapsed) return <SplashScreen />;

  return (
    <ToastProvider>
      <ChalkSprite />
      <div className="mx-auto w-full max-w-md min-h-dvh pb-[90px]">
        <SchedulesProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/:groupName" element={<ProtectedRoute><GroupSchedulePage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/:groupName/default" element={<ProtectedRoute><DefaultSchedulePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/settings/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
          </Routes>
        </SchedulesProvider>
      </div>
      {!isLoading && isAuthenticated && <BottomNav />}
      <UpdatePrompt />
    </ToastProvider>
  );
};

export default App;
```

NOTE: the previously-rebuilt pages still import MUI at this point; the app builds because those imports resolve. Subsequent tasks replace each page. If a not-yet-converted page renders during manual testing it may look MUI-ish — acceptable mid-migration.

- [ ] **Step 2: Verify build + lint + sprite mount**

Run: `yarn --cwd packages/web-client-v2 build` and `… lint` → Expected: success / 0 errors.
Run dev, log in: Expected: chalk `BottomNav` (Groups · Settings) pinned bottom with safe-area; content max-width ~28rem centered.

- [ ] **Step 3: Commit**

```bash
git add packages/web-client-v2/src/App.jsx
git commit -m "feat(web): chalk app shell, ToastProvider, BottomNav; drop comments day-route"
```

---

### Task 7: SplashScreen (chalk)

**Files:**
- Modify: `packages/web-client-v2/src/components/SplashScreen.jsx`

Reference: `ardoise.html` splash (lines ~430–440) — breathing dashed-ring crest + "Meal Planner" (Caveat) + "à table." motif + bouncing dots.

- [ ] **Step 1: Rewrite `SplashScreen.jsx`**

```jsx
import Icon, { ChalkSprite } from './Icon';

const SplashScreen = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
       style={{ background: 'radial-gradient(circle at 50% 36%, #212a20 0%, #141811 72%)' }}>
    <ChalkSprite />
    <div className="w-[120px] h-[120px] rounded-full border-2 border-dashed border-coral grid place-items-center mb-7 animate-[breathe_2.4s_ease-in-out_infinite] text-mustard">
      <Icon name="meal" className="w-[66%] h-[66%]" />
    </div>
    <h1 className="font-hand font-bold text-[52px] leading-none m-0 text-chalk">Meal Planner</h1>
    <div className="font-hand font-semibold text-[24px] text-coral mt-1.5">à table.</div>
    <div className="flex gap-2.5 mt-9">
      {['bg-coral', 'bg-mustard', 'bg-sage'].map((c, i) => (
        <span key={c} className={`w-2.5 h-2.5 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </div>
  </div>
);

export default SplashScreen;
```

Add to `index.css` `@layer base`:
```css
@keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.055); } }
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). Dev: reload app → Expected: chalk splash with breathing crest for ~2s.
```bash
git add packages/web-client-v2/src/components/SplashScreen.jsx packages/web-client-v2/src/index.css
git commit -m "feat(web): chalk splash screen"
```

---

### Task 8: UpdatePrompt (chalk banner)

**Files:**
- Modify: `packages/web-client-v2/src/components/UpdatePrompt.jsx`

Preserve the `useRegisterSW` hook, the hourly `setInterval(registration.update)` + `visibilitychange` logic and the `UPDATE_CHECK_INTERVAL` comment **exactly**. Replace only the MUI `Snackbar/Box/Typography` presentation with the chalk banner (`ardoise.html` lines ~501–504).

- [ ] **Step 1: Rewrite the render only** (keep all hook logic from the current file)

```jsx
import { useRegisterSW } from 'virtual:pwa-register/react';
import Icon from './Icon';

// Background safety-net poll interval. Hourly (not 60s): visibilitychange below
// covers the common open/background/return pattern, so a tighter interval would
// only re-fetch sw.js more often — maximizing the chance of catching a divergent
// edge copy and re-showing a phantom "update available" banner — without
// delivering new versions any faster.
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update();
        });
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      onClick={() => updateServiceWorker(true)}
      className="fixed left-4 right-4 bottom-[90px] z-40 flex items-center gap-3 px-4 py-3.5 rounded-[16px] cursor-pointer text-chalk border-[1.5px] border-coral bg-gradient-to-br from-[#2c352d] to-[#222823] shadow-[0_18px_44px_-12px_rgba(0,0,0,0.75)] animate-[rise_0.45s_ease-out] active:scale-[0.98] max-w-md mx-auto"
    >
      <span className="w-10 h-10 rounded-[12px] grid place-items-center bg-coral/15 text-coral flex-none">
        <Icon name="refresh" className="w-5 h-5" />
      </span>
      <div>
        <b className="block text-sm font-bold">Update available</b>
        <small className="text-[11.5px] text-chalk-dim">Tap to refresh to the latest version</small>
      </div>
    </div>
  );
};

export default UpdatePrompt;
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). (Banner only shows on a real SW update; visual parity with mockup is the check.)
```bash
git add packages/web-client-v2/src/components/UpdatePrompt.jsx
git commit -m "feat(web): chalk PWA update banner (update logic preserved)"
```

---

### Task 9: LoginPage (chalk)

**Files:**
- Modify: `packages/web-client-v2/src/pages/LoginPage.jsx`

Preserve all state + handlers from the current file (`username`, `password`, `showPassword`, `isSubmitting`, `error`/`authError`, `successMessage`, the `oauthMessage` effect, `handleSubmit`, `handleGoogleSignIn`). Replace presentation with the mockup login (`ardoise.html` lines ~356–365). **No tagline/subtitle.** "New here? Pull up a chair" → `/signup`.

- [ ] **Step 1: Rewrite `LoginPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { signIn, signInWithGoogle, oauthMessage, clearOauthMessage, error: authError } = useAuth();
  const displayError = error || authError;

  useEffect(() => {
    if (oauthMessage) {
      if (oauthMessage.type === 'success') { setSuccessMessage(oauthMessage.text); setError(null); }
      else { setError(oauthMessage.text); setSuccessMessage(null); }
      clearOauthMessage();
    }
  }, [oauthMessage, clearOauthMessage]);

  const handleGoogleSignIn = async () => {
    setError(null);
    try { await signInWithGoogle(); } catch (err) { setError(err.message || 'Google sign in failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try { await signIn(username, password); }
    catch (err) { setError(err.message || err.name || 'Failed to sign in'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center px-8">
      <div className="w-[84px] h-[84px] rounded-full border-2 border-dashed border-coral grid place-items-center mb-6 text-mustard">
        <Icon name="meal" className="w-[64%] h-[64%]" />
      </div>
      <h1 className="font-hand font-bold text-[60px] leading-[0.86] m-0 mb-7">Meal<br />Planner</h1>

      {successMessage && <div className="mb-3 text-sage text-sm">{successMessage}</div>}
      {displayError && <div className="mb-3 text-red text-sm">{displayError}</div>}

      <form onSubmit={handleSubmit}>
        <Field label="Email" type="email" value={username} autoComplete="email" autoCapitalize="none" autoFocus
               disabled={isSubmitting} onChange={(e) => setUsername(e.target.value)} />
        <Field label="Password" type="password" value={password} autoComplete="current-password" autoCapitalize="none"
               disabled={isSubmitting} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="mt-2.5" disabled={isSubmitting || !username || !password}>
          {isSubmitting ? <Spinner /> : 'Sign in'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-chalk-faint text-[11px] tracking-[0.2em] uppercase my-5 before:flex-1 before:border-b before:border-dashed before:border-chalk-faint after:flex-1 after:border-b after:border-dashed after:border-chalk-faint">or</div>
      <Button variant="ghost" onClick={handleGoogleSignIn} disabled={isSubmitting} className="flex items-center justify-center gap-2">
        <Icon name="google" className="w-[18px] h-[18px]" />Continue with Google
      </Button>

      <div className="text-center mt-7 text-[12.5px] text-chalk-dim">
        New here? <Link to="/signup" className="text-coral font-semibold no-underline">Pull up a chair</Link>
      </div>
    </div>
  );
};

export default LoginPage;
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). Dev `/login`: Expected: dashed-ring crest, "Meal / Planner" in Caveat, chalk underline fields, coral "Sign in", dashed "or", ghost Google, "Pull up a chair" link. No tagline. Real sign-in works (proxied API).
```bash
git add packages/web-client-v2/src/pages/LoginPage.jsx
git commit -m "feat(web): chalk login page"
```

---

### Task 10: SignUpPage + pending approval (chalk)

**Files:**
- Modify: `packages/web-client-v2/src/pages/SignUpPage.jsx`

Preserve `validatePassword`, all state, `passwordError/passwordValid/passwordsMatch/nameValid/canSubmit`, `handleSubmit`, and the `success` (pending-approval) branch logic. Mockup refs: sign-up (`ardoise.html` ~448–456), pending approval (~464–469). Live `name` counter (`n/20`), password help (ok/bad), confirm-match help.

- [ ] **Step 1: Rewrite `SignUpPage.jsx`**

```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const validatePassword = (pw) => {
  if (pw.length < 8) return 'Must be at least 8 characters';
  if (!/[a-z]/.test(pw)) return 'Must include a lowercase letter';
  if (!/[A-Z]/.test(pw)) return 'Must include an uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Must include a number';
  if (!/[^a-zA-Z0-9]/.test(pw)) return 'Must include a symbol';
  return null;
};

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const passwordError = password.length > 0 ? validatePassword(password) : null;
  const passwordValid = password.length > 0 && !passwordError;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const nameValid = name.length > 0 && name.length <= 20;
  const canSubmit = email && nameValid && passwordValid && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try { await signUp(email, password, name); setSuccess(true); }
    catch (err) {
      if (err.name === 'UsernameExistsException') setError('An account with this email already exists');
      else setError(err.message || 'Sign up failed');
    } finally { setIsSubmitting(false); }
  };

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center text-center px-8">
        <div className="w-[84px] h-[84px] rounded-full border-2 border-sage grid place-items-center mb-6 text-sage font-body font-extrabold text-[44px]">✓</div>
        <h1 className="font-hand font-bold text-[52px] leading-none m-0">Account<br />created</h1>
        <p className="text-chalk-dim text-sm leading-relaxed max-w-[250px] my-3 mb-7">
          Your registration is pending approval. An administrator will review your request.
        </p>
        <Link to="/login" className="w-full max-w-[240px]"><Button variant="ghost">Back to sign in</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col justify-start pt-12 pb-8 px-8">
      <div className="w-[62px] h-[62px] rounded-full border-2 border-dashed border-coral grid place-items-center mb-4 text-mustard">
        <Icon name="meal" className="w-[64%] h-[64%]" />
      </div>
      <h1 className="font-hand font-bold text-[46px] leading-[0.86] m-0 mb-5">Create<br />account</h1>

      {error && <div className="mb-3 text-red text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <Field label="Email" type="email" value={email} autoComplete="email" autoCapitalize="none" autoFocus
               disabled={isSubmitting} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Name" value={name} maxLength={20} count={`${name.length} / 20`} autoCapitalize="words"
               disabled={isSubmitting} onChange={(e) => setName(e.target.value)} />
        <Field label="Password" type="password" value={password} autoComplete="new-password" autoCapitalize="none"
               disabled={isSubmitting} onChange={(e) => setPassword(e.target.value)}
               help={password.length > 0 ? (passwordError ? `✕ ${passwordError}` : '✓ strong — meets all requirements') : undefined}
               helpTone={passwordError ? 'bad' : 'ok'} />
        <Field label="Confirm password" type="password" value={confirmPassword} autoComplete="new-password" autoCapitalize="none"
               disabled={isSubmitting} onChange={(e) => setConfirmPassword(e.target.value)}
               help={confirmPassword.length > 0 ? (passwordsMatch ? '✓ passwords match' : '✕ passwords do not match') : undefined}
               helpTone={passwordsMatch ? 'ok' : 'bad'} />
        <Button type="submit" className="mt-2.5" disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? <Spinner /> : 'Create account'}
        </Button>
      </form>

      <div className="text-center mt-4 text-[12.5px] text-chalk-dim">
        Already have an account? <Link to="/login" className="text-coral font-semibold no-underline">Sign in</Link>
      </div>
    </div>
  );
};

export default SignUpPage;
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). Dev `/signup`: Expected: chalk form, live `n/20`, sage/red password+match help, "Create account"; submitting a valid new account shows the green-check pending screen.
```bash
git add packages/web-client-v2/src/pages/SignUpPage.jsx
git commit -m "feat(web): chalk sign-up + pending approval"
```

---

### Task 11: GroupsPage (chalk; informational empty state, no `+`)

**Files:**
- Modify: `packages/web-client-v2/src/pages/GroupsPage.jsx`

Preserve `useSchedules()` usage (`schedules`, `loading`, `error`, `fetchSchedules`) and the navigate target. Mockup ref: groups list (`ardoise.html` ~373–378) and first-run empty (~479–485 — but **without** action buttons per spec §5). **No `+` button.**

- [ ] **Step 1: Rewrite `GroupsPage.jsx`**

```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../contexts/SchedulesContext';
import { colorForName, initialsOf } from '../constants/colors';
import Icon from '../components/Icon';
import TopBar from '../components/ui/TopBar';
import Spinner from '../components/ui/Spinner';

const GroupRow = ({ group, onClick }) => {
  const members = Object.values(group.members);
  return (
    <button onClick={onClick}
      className="group w-full flex items-center gap-4 py-[18px] border-b border-dashed border-chalk-faint text-left bg-transparent cursor-pointer">
      <span className="flex-none w-[52px] h-[52px] rounded-[14px] grid place-items-center font-hand font-bold text-[30px] text-slate-0 -rotate-3"
            style={{ background: colorForName(group.groupName) }}>
        {initialsOf(group.groupName)}
      </span>
      <span className="min-w-0">
        <span className="block font-hand font-bold text-[27px] leading-none group-hover:text-mustard transition-colors">{group.groupName}</span>
        <span className="flex items-center gap-2 text-xs text-chalk-dim mt-1">
          {members.length} {members.length === 1 ? 'member' : 'members'}
          <span className="flex">
            {members.slice(0, 3).map((m, i) => (
              <span key={i} className="w-6 h-6 rounded-full border-2 border-slate-1 grid place-items-center text-[9.5px] font-bold text-[#1b1f1c] -ml-[7px] first:ml-0"
                    style={{ background: colorForName(m.memberName) }}>{initialsOf(m.memberName)}</span>
            ))}
          </span>
        </span>
      </span>
      <span className="ml-auto text-chalk-faint text-[22px]">→</span>
    </button>
  );
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const { schedules: groups, loading, error, fetchSchedules } = useSchedules();
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  return (
    <div>
      <TopBar title="Your groups" sub={`${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`} />
      <div className="px-5 pb-6">
        {loading ? (
          <Spinner label="Loading your groups…" />
        ) : error ? (
          <div className="text-red text-sm py-4">{error}</div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-12 px-2">
            <div className="w-28 h-28 rounded-full border-2 border-dashed border-chalk-faint grid place-items-center mb-6 text-chalk-faint">
              <Icon name="meal" className="w-[52%] h-[52%]" />
            </div>
            <h2 className="font-hand font-bold text-[34px] m-0 mb-2 text-chalk">No groups yet</h2>
            <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[235px] m-0">
              You'll see your meal-planning groups here once you've been added to one.
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <GroupRow key={g.groupId} group={g}
              onClick={() => navigate(`/groups/${g.groupId}/${encodeURIComponent(g.groupName)}`)} />
          ))
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). Dev `/`: Expected: "Your groups / N groups" Caveat header, chalk group rows (rotated initials mark, name, member count + stacked avatars, →), tapping opens the group. With no groups: dashed-ring empty state, **no action buttons, no `+`**.
```bash
git add packages/web-client-v2/src/pages/GroupsPage.jsx
git commit -m "feat(web): chalk groups list with informational empty state"
```

---

### Task 12: Settings, Account, About (chalk)

**Files:**
- Modify: `packages/web-client-v2/src/pages/SettingsPage.jsx`
- Modify: `packages/web-client-v2/src/pages/AccountPage.jsx`
- Modify: `packages/web-client-v2/src/pages/AboutPage.jsx`

For each, **first read the current file** and preserve its handlers/state (Settings: navigation to account/about + the profile data from `useAuth().user`; Account: change-password handler + sign-out via `useAuth().signOut`; About: `__APP_VERSION__` / `__GIT_COMMIT_HASH__`). Replace only presentation. Mockup refs: settings home (`ardoise.html` ~523–533), account (~545–560), about (~572–579).

- [ ] **Step 1: Rewrite `SettingsPage.jsx`** — `TopBar title="Settings"`; a profile card (`Avatar` + name in Caveat + email + copy `IconButton` using `ic-copy` → `navigator.clipboard.writeText(email)` + toast "copied"); a `seclabel` "Account" then a `setitem` row (`ic-key`, "Account details / Change password & sign out") → `/settings/account`; `seclabel` "App" then a `setitem` row (`ic-info`, "About / Version & app info") → `/settings/about`. Build the `setitem` as a `<button>` with `Card`-like styling: `flex items-center gap-3.5 p-[15px] rounded-[16px] bg-chalk/[0.04] border border-line mb-3 w-full text-left`, a `42px` coral-tinted icon box (`bg-coral/15 text-coral rounded-[12px]`), title (`font-semibold text-[14.5px]`) + sub (`text-chalk-dim text-xs`), and a `→` chevron `ml-auto text-chalk-faint`.

- [ ] **Step 2: Rewrite `AccountPage.jsx`** — `TopBar` with back `IconButton` (`ic-back`, → `navigate(-1)`) + title "Account". A `Card` titled "Change password" (Caveat `h3` + `ic-lock` coral box) containing `Field`s Current / New / Confirm (preserve the existing change-password handler and its Cognito call exactly), a `reqbox` (dashed `Card`) listing the 5 password requirements as `req` rows that flip to sage ✓ as the new password satisfies each (reuse the same regex checks as SignUp: length≥8, lowercase, uppercase, number, symbol), and a coral "Change password" `Button`. Below the card, a `Button variant="danger"` with `ic-logout` "Sign out" → `useAuth().signOut()` then `navigate('/login')`.

- [ ] **Step 3: Rewrite `AboutPage.jsx`** — `TopBar` back + "About". Centered dashed-ring crest (`ic-meal`, mustard) + "Meal Planner" (Caveat) + "à table." motif; two `inforow`s: Version (`ic-code`, value `__APP_VERSION__` in `font-mono`) and Build (`ic-branch`, value `__GIT_COMMIT_HASH__` in `font-mono`); footer "made with care for shared meals" in Caveat `text-chalk-faint`.

- [ ] **Step 4: Verify + commit**

Run build + lint (success). Dev: visit `/settings`, `/settings/account`, `/settings/about` → Expected: chalk parity with mockup; copy-email toast works; change-password requirement ticks animate; sign-out returns to login; version/build show.
```bash
git add packages/web-client-v2/src/pages/SettingsPage.jsx packages/web-client-v2/src/pages/AccountPage.jsx packages/web-client-v2/src/pages/AboutPage.jsx
git commit -m "feat(web): chalk settings, account, about"
```

---

# Phase 2 — Core group experience

### Task 13: WeekNavigator (chalk)

**Files:**
- Modify: `packages/web-client-v2/src/components/WeekNavigator.jsx`

Preserve the exact logic from the current file: `getCurrentWeek`, `isCurrentWeek`, `canGoPrevious`, `showJumpToToday`, `handleToday/handlePrevious/handleNext` (props `{ year, week, onChange }`). Mockup ref: `.weeknav` (`ardoise.html` CSS ~227–240, JS `renderWeekNav` ~646–664). **Circular buttons** (`flex-none`, equal w/h), **fixed-width week box**, single-line label, "Now" chip only on current week, jump slot reserved (hidden not removed).

- [ ] **Step 1: Rewrite `WeekNavigator.jsx`**

```jsx
import IconButton from './ui/IconButton';
import { getCurrentWeek } from '../constants/schedule';

const WeekNavigator = ({ year, week, onChange }) => {
  const current = getCurrentWeek();
  const isCurrentWeek = year === current.year && week === current.week;
  const canGoPrevious = year > current.year || (year === current.year && week > current.week);
  const prevWeek = week === 1 ? 52 : week - 1;
  const prevYear = week === 1 ? year - 1 : year;
  const showJumpToToday = !isCurrentWeek && !(prevYear === current.year && prevWeek === current.week);

  const handleToday = () => onChange(current.year, current.week);
  const handlePrevious = () => { if (canGoPrevious) onChange(week === 1 ? year - 1 : year, week === 1 ? 52 : week - 1); };
  const handleNext = () => onChange(week === 52 ? year + 1 : year, week === 52 ? 1 : week + 1);

  return (
    <div className="flex items-center justify-center gap-1.5 my-1">
      {/* jump-to-today slot is reserved (hidden, not removed) so the row width is constant */}
      <IconButton name="back" label="Jump to this week" onClick={handleToday}
        className={`border-dashed !border-coral !text-coral ${showJumpToToday ? '' : 'invisible'}`} />
      <IconButton name="back" label="Previous week" onClick={handlePrevious} disabled={!canGoPrevious} />
      <div className={`flex items-center justify-between gap-2.5 px-4 py-[7px] rounded-[14px] bg-chalk/[0.06] border border-line w-[200px]`}>
        <div className="min-w-0">
          <div className="font-hand font-bold text-[23px] leading-none whitespace-nowrap">Week {String(week).padStart(2, '0')}</div>
          <div className="text-[10px] tracking-[0.16em] uppercase text-chalk-dim mt-px">{year}</div>
        </div>
        {isCurrentWeek && (
          <span className="text-[9px] tracking-[0.14em] uppercase bg-mustard text-slate-0 font-bold px-[7px] py-0.5 rounded-full">Now</span>
        )}
      </div>
      <IconButton name="back" label="Next week" onClick={handleNext} className="rotate-180" />
    </div>
  );
};

export default WeekNavigator;
```

(The `ic-back` glyph reused for prev/next/jump: next is rotated 180°; jump uses dashed coral styling. This keeps the icon set small; swap to dedicated chevron symbols if preferred.)

- [ ] **Step 2: Verify + commit**

Run build + lint (success). Visual check happens in Task 18 (within the group page). Confirm: round buttons stay circular at 360px width; week box fixed width; "Now" only on current week; prev disabled on current week.
```bash
git add packages/web-client-v2/src/components/WeekNavigator.jsx
git commit -m "feat(web): chalk week navigator"
```

---

### Task 14: PersonalScheduleView — "My week" (chalk, one-tap)

**Files:**
- Modify: `packages/web-client-v2/src/components/PersonalScheduleView.jsx`

Props unchanged: `{ schedule, dates, onToggle, year, week, comments, onDayClick }`. Use `MEAL`, `DAY_LABELS`, `DAYS`, `getTodayIndex`. Mockup ref: `.dayrow`/`.meal` (`ardoise.html` ~113–138, JS `renderMy` ~672–692). Each row: day name + date, two `MealTile`s, and a **comment trigger** (`ic-note`) at the right edge — coral when a note exists. Today = coral left-bar + coral day name; past = dimmed + tiles disabled (`onDayClick` still allowed to view, see Task 15 read-only).

- [ ] **Step 1: Rewrite `PersonalScheduleView.jsx`**

```jsx
import Icon from './Icon';
import MealTile from './ui/MealTile';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';

const PersonalScheduleView = ({ schedule, dates, onToggle, year, week, comments, onDayClick }) => {
  const todayIndex = getTodayIndex(year, week);
  return (
    <div>
      <div className="flex items-center gap-2 text-chalk-dim my-1 mb-3.5 font-hand text-[18px] italic">
        ↳ tap a meal — saved instantly
      </div>
      <div className="flex gap-3.5 items-center text-[10.5px] text-chalk-dim mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-sage"><span className="w-[11px] h-[11px] rounded border-[1.5px] border-current" />in for it</span>
        <span className="inline-flex items-center gap-1.5 text-red"><span className="w-[11px] h-[11px] rounded border-[1.5px] border-current" />not eating</span>
      </div>
      {DAYS.map((day, i) => {
        const attendance = schedule?.[day] ?? 0;
        const isToday = i === todayIndex;
        const isPast = todayIndex >= 0 && i < todayIndex;
        const dayComment = comments?.[day];
        const hasComment = dayComment?.lunch || dayComment?.dinner;
        return (
          <div key={day}
            className={`relative flex items-center gap-2.5 py-3 border-b border-line ${isPast ? 'opacity-45' : ''}
              ${isToday ? "before:content-[''] before:absolute before:-left-5 before:inset-y-0 before:w-1 before:bg-coral before:rounded-r-[3px]" : ''}`}>
            <div className="w-[62px] flex-none">
              <b className={`block font-semibold text-sm ${isToday ? 'text-coral' : ''}`}>{DAY_LABELS[i]}</b>
              <small className="text-chalk-dim text-[11px]">{dates[i]}</small>
            </div>
            <div className="ml-auto flex gap-2.5 items-center">
              <MealTile label="Lunch" on={(attendance & MEAL.LUNCH) !== 0} disabled={isPast} onClick={() => onToggle(day, MEAL.LUNCH)} />
              <MealTile label="Dinner" on={(attendance & MEAL.DINNER) !== 0} disabled={isPast} onClick={() => onToggle(day, MEAL.DINNER)} />
              <button onClick={() => onDayClick(day, i)} aria-label={`Notes for ${DAY_LABELS[i]}`}
                className={`flex-none w-9 h-9 grid place-items-center rounded-full border-[1.5px] bg-transparent cursor-pointer transition active:scale-95
                  ${hasComment ? 'border-coral text-coral' : 'border-line text-chalk-faint hover:text-chalk-dim'}`}>
                <Icon name="note" className="w-[52%] h-[52%]" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PersonalScheduleView;
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). (Wired + visually checked in Task 18.)
```bash
git add packages/web-client-v2/src/components/PersonalScheduleView.jsx
git commit -m "feat(web): chalk My week view with one-tap meal tiles + note trigger"
```

---

### Task 15: CommentEditorSheet — autosave bottom sheet (replaces CommentsPage)

**Files:**
- Create: `packages/web-client-v2/src/components/CommentEditorSheet.jsx`
- Delete: `packages/web-client-v2/src/pages/CommentsPage.jsx` (done in Task 18 wiring; route already removed in Task 6)

The editor edits the current user's lunch/dinner note for one day. **Autosaves on blur / sheet dismiss** (no Save button) via `api.createComments`, which requires the full week's comments — so the caller passes `allComments` (the member's `comments` object for the week) and we merge. Past day → read-only.

- [ ] **Step 1: Create `CommentEditorSheet.jsx`**

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { api } from '../services/api';
import { DAYS, DAY_LABELS } from '../constants/schedule';
import BottomSheet from './ui/BottomSheet';
import Textarea from './ui/Textarea';
import { useToast } from './ui/Toast';

dayjs.extend(isoWeek);

// open: bool; day: 'monday'…; dayIndex: 0..6; year, week; groupId;
// allComments: { monday:{lunch,dinner}, … } for the member this week; readOnly: bool;
// onSaved(updatedAllComments): lets the parent update its in-memory comments.
const CommentEditorSheet = ({ open, onClose, day, dayIndex, year, week, groupId, allComments, readOnly, onSaved }) => {
  const toast = useToast();
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const initial = useRef({ lunch: '', dinner: '' });

  useEffect(() => {
    if (!open) return;
    const c = allComments?.[day] ?? { lunch: '', dinner: '' };
    setLunch(c.lunch ?? '');
    setDinner(c.dinner ?? '');
    initial.current = { lunch: c.lunch ?? '', dinner: c.dinner ?? '' };
  }, [open, day, allComments]);

  const fullDate = open
    ? dayjs(`${year}-01-04`).startOf('isoWeek').add(week - 1, 'week').add(dayIndex, 'day').format('D MMMM YYYY')
    : '';

  const persist = useCallback(async () => {
    if (readOnly) return;
    if (lunch === initial.current.lunch && dinner === initial.current.dinner) return; // nothing changed
    const week7 = Object.fromEntries(
      DAYS.map((d) => [d, d === day ? { lunch, dinner } : (allComments?.[d] ?? { lunch: '', dinner: '' })])
    );
    try {
      await api.createComments(groupId, { year, weekNumber: week, ...week7 });
      initial.current = { lunch, dinner };
      onSaved?.(week7);
      toast?.('Saved');
    } catch {
      toast?.('Failed to save note');
    }
  }, [readOnly, lunch, dinner, day, allComments, groupId, year, week, onSaved, toast]);

  const handleClose = async () => { await persist(); onClose(); };

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <div className="mb-4">
        <div className="font-hand font-bold text-[30px] leading-none">{DAY_LABELS[dayIndex] ?? ''}</div>
        <div className="text-[11px] tracking-[0.2em] uppercase text-chalk-dim mt-1">{fullDate}</div>
      </div>
      <div className="mb-4">
        <div className="font-hand font-bold text-[24px] text-mustard leading-none mb-1.5">Lunch</div>
        <Textarea value={lunch} disabled={readOnly} onBlur={persist}
          placeholder={readOnly ? 'past — read only' : 'note for the cook…'}
          onChange={(e) => setLunch(e.target.value)} />
      </div>
      <div>
        <div className="font-hand font-bold text-[24px] text-coral leading-none mb-1.5">Dinner</div>
        <Textarea value={dinner} disabled={readOnly} onBlur={persist}
          placeholder={readOnly ? 'past — read only' : 'note for the cook…'}
          onChange={(e) => setDinner(e.target.value)} />
      </div>
      {readOnly && <div className="text-chalk-faint italic font-hand text-[18px] mt-3">past — read only</div>}
    </BottomSheet>
  );
};

export default CommentEditorSheet;
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). (Wired + functionally checked in Task 18.)
```bash
git add packages/web-client-v2/src/components/CommentEditorSheet.jsx
git commit -m "feat(web): autosave chalk comment editor bottom sheet"
```

---

### Task 16: MembersScheduleView — day-centric "Everyone" + inline Notes

**Files:**
- Modify: `packages/web-client-v2/src/components/MembersScheduleView.jsx`
- Delete: `packages/web-client-v2/src/components/CommentsDrawer.jsx` (in Task 18 wiring)

Rebuild as **day-centric**. Props: `{ members, dates, year, week }` (drop `todayRef`/`onCommentsClick` — notes are inline now). Internal state: selected day (default today if in week, else Monday). Mockup ref: `.daystrip`/`.daychip`/`.mealblock`/`.badges` (`ardoise.html` ~140–160, JS `renderEveryone` ~700–717). Day strip: weekday abbrev + date; coral attendance dot if anyone signed up; **mustard note dot** if any member has a comment that day. Below: Lunch then Dinner blocks (Caveat heading mustard/coral + count chip + wrapping `Badge`s; empty → chalk italic). Then a **Notes** block (only if any notes that day): chalk note cards (avatar+name, then `L`/`D` tick + text). All members uniform (no "you").

- [ ] **Step 1: Rewrite `MembersScheduleView.jsx`**

```jsx
import { useState } from 'react';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';

const MealBlock = ({ title, tone, attendees }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2.5 mb-3">
      <span className={`font-hand font-bold text-[28px] leading-none ${tone}`}>{title}</span>
      <span className="ml-auto text-[11px] font-bold tracking-[0.04em] text-slate-0 bg-chalk-dim rounded-full px-2.5 py-0.5">{attendees.length}</span>
    </div>
    {attendees.length ? (
      <div className="flex flex-wrap gap-[7px]">{attendees.map((n) => <Badge key={n} name={n} />)}</div>
    ) : (
      <div className="text-chalk-faint italic font-hand text-[19px]">nobody yet — quiet one</div>
    )}
  </div>
);

const MembersScheduleView = ({ members, dates, year, week }) => {
  const todayIndex = getTodayIndex(year, week);
  const [sel, setSel] = useState(todayIndex >= 0 ? todayIndex : 0);

  const list = Object.values(members);
  const attendeesFor = (dayKey, meal) =>
    list.filter((m) => ((m.schedule?.[dayKey] ?? 0) & meal) !== 0).map((m) => m.memberName).sort((a, b) => a.localeCompare(b));
  const notesFor = (dayKey) =>
    list.filter((m) => m.comments?.[dayKey]?.lunch || m.comments?.[dayKey]?.dinner)
      .map((m) => ({ name: m.memberName, lunch: m.comments[dayKey].lunch, dinner: m.comments[dayKey].dinner }))
      .sort((a, b) => a.name.localeCompare(b.name));
  const hasAnyone = (dayKey) => list.some((m) => (m.schedule?.[dayKey] ?? 0) !== 0);
  const hasNotes = (dayKey) => list.some((m) => m.comments?.[dayKey]?.lunch || m.comments?.[dayKey]?.dinner);

  const dayKey = DAYS[sel];
  const notes = notesFor(dayKey);

  return (
    <div>
      <div className="flex gap-[7px] mb-[18px] overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DAYS.map((day, i) => (
          <button key={day} onClick={() => setSel(i)}
            className={`flex-none w-[42px] h-14 rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-[3px] cursor-pointer
              ${i === sel ? 'bg-chalk text-slate-0 border-chalk' : 'border-line text-chalk-dim bg-transparent'}`}>
            <small className="text-[9px] tracking-[0.12em] uppercase">{DAY_LABELS[i].slice(0, 3)}</small>
            <b className="text-[17px] font-semibold">{(dates[i] || '').split(' ')[0]}</b>
            <span className="flex gap-0.5 h-[5px]">
              {hasAnyone(day) && <span className="w-[5px] h-[5px] rounded-full bg-coral" />}
              {hasNotes(day) && <span className="w-[5px] h-[5px] rounded-full bg-mustard" />}
            </span>
          </button>
        ))}
      </div>

      <MealBlock title="Lunch" tone="text-mustard" attendees={attendeesFor(dayKey, MEAL.LUNCH)} />
      <div className="border-b border-dashed border-chalk-faint my-3.5" />
      <MealBlock title="Dinner" tone="text-coral" attendees={attendeesFor(dayKey, MEAL.DINNER)} />

      {notes.length > 0 && (
        <>
          <div className="border-b border-dashed border-chalk-faint my-3.5" />
          <div className="flex items-center gap-2.5 mb-3">
            <span className="font-hand font-bold text-[28px] leading-none text-chalk">Notes</span>
            <span className="ml-auto text-[11px] font-bold text-slate-0 bg-chalk-dim rounded-full px-2.5 py-0.5">{notes.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {notes.map((n) => (
              <div key={n.name} className="flex gap-3">
                <Avatar name={n.name} size={32} />
                <div className="min-w-0">
                  <div className="font-semibold text-sm mb-1">{n.name}</div>
                  {n.lunch && <div className="text-chalk-dim text-[13px] mb-0.5"><span className="text-mustard font-bold mr-1.5">L</span>{n.lunch}</div>}
                  {n.dinner && <div className="text-chalk-dim text-[13px]"><span className="text-coral font-bold mr-1.5">D</span>{n.dinner}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MembersScheduleView;
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). (Wired + visually checked in Task 18.)
```bash
git add packages/web-client-v2/src/components/MembersScheduleView.jsx
git commit -m "feat(web): day-centric Everyone view with inline Notes block"
```

---

### Task 17: DefaultSchedulePage — "the usual" (chalk)

**Files:**
- Modify: `packages/web-client-v2/src/pages/DefaultSchedulePage.jsx`

Preserve logic: load via `useSchedules().fetchSchedules()`, find group, read `member.default`; `handleToggle` posts `{ default:true, schedule }` via `api.createSchedule` then `fetchSchedules(true)`; optimistic + revert on error (use `useToast` for the error). Weekday-only rows (no dates), every day editable (nothing locked/dimmed), dashed-framed panel.

- [ ] **Step 1: Rewrite `DefaultSchedulePage.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchedules } from '../contexts/SchedulesContext';
import { api } from '../services/api';
import { DAYS, DAY_LABELS, MEAL } from '../constants/schedule';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import MealTile from '../components/ui/MealTile';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';

const DefaultSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchSchedules, loading } = useSchedules();
  const toast = useToast();
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const schedules = await fetchSchedules();
      const group = schedules.find((g) => g.groupId === groupId);
      if (!group) return setError('Group not found');
      const me = group.members[user.memberId];
      if (!me) return setError('You are not a member of this group');
      setSchedule({ ...me.default });
    })();
  }, [groupId, user.memberId, fetchSchedules]);

  const handleToggle = useCallback(async (day, meal) => {
    const prev = schedule;
    const next = { ...schedule, [day]: (schedule[day] ?? 0) ^ meal };
    setSchedule(next);
    try {
      await api.createSchedule(groupId, { default: true, schedule: next });
      fetchSchedules(true);
    } catch {
      setSchedule(prev);
      toast?.('Failed to save');
    }
  }, [schedule, groupId, fetchSchedules, toast]);

  return (
    <div className="min-h-dvh">
      <TopBar title={decodeURIComponent(groupName)}
        left={<IconButton name="back" label="Back" onClick={() => navigate(-1)} className="ml-0" />} />
      <div className="px-5 pb-6">
        {loading || !schedule ? (
          error ? <div className="text-red text-sm py-4">{error}</div> : <Spinner label="Loading the usual…" />
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="font-hand font-bold text-[34px] leading-none">The usual</div>
              <div className="text-chalk-dim text-[13px] mt-1">applied to new weeks automatically</div>
            </div>
            <Card dashed className="p-4">
              {DAYS.map((day, i) => {
                const a = schedule?.[day] ?? 0;
                return (
                  <div key={day} className="flex items-center gap-2.5 py-2.5 border-b border-line last:border-0">
                    <div className="w-[80px] flex-none font-semibold text-sm">{DAY_LABELS[i]}</div>
                    <div className="ml-auto flex gap-2.5">
                      <MealTile label="Lunch" on={(a & MEAL.LUNCH) !== 0} onClick={() => handleToggle(day, MEAL.LUNCH)} />
                      <MealTile label="Dinner" on={(a & MEAL.DINNER) !== 0} onClick={() => handleToggle(day, MEAL.DINNER)} />
                    </div>
                  </div>
                );
              })}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DefaultSchedulePage;
```

- [ ] **Step 2: Verify + commit**

Run build + lint (success). Dev: open a group → ⚙ → Expected: "The usual" board, dashed panel, 7 weekday rows, green/red tiles toggling optimistically, no dates, nothing locked.
```bash
git add packages/web-client-v2/src/pages/DefaultSchedulePage.jsx
git commit -m "feat(web): chalk default schedule (the usual)"
```

---

### Task 18: GroupSchedulePage — wire My week / Everyone / comments (chalk)

**Files:**
- Modify: `packages/web-client-v2/src/pages/GroupSchedulePage.jsx`
- Delete: `packages/web-client-v2/src/pages/CommentsPage.jsx`
- Delete: `packages/web-client-v2/src/components/CommentsDrawer.jsx`

Preserve the data logic from the current file: load via `api.getSchedules(period)`, find group, set `members`/`schedule`/`comments`; `handleToggle` optimistic personal-schedule save; shared `year/week` state across both views; view switch. Replace the per-row navigation-to-CommentsPage with the in-page `CommentEditorSheet`. Keep `react-simple-pull-to-refresh` for refresh.

- [ ] **Step 1: Delete the obsolete comment files**

```bash
git rm packages/web-client-v2/src/pages/CommentsPage.jsx packages/web-client-v2/src/components/CommentsDrawer.jsx
```

- [ ] **Step 2: Rewrite `GroupSchedulePage.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { getCurrentWeek, getWeekDates } from '../constants/schedule';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Spinner from '../components/ui/Spinner';
import WeekNavigator from '../components/WeekNavigator';
import PersonalScheduleView from '../components/PersonalScheduleView';
import MembersScheduleView from '../components/MembersScheduleView';
import CommentEditorSheet from '../components/CommentEditorSheet';
import { useToast } from '../components/ui/Toast';

const GroupSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const current = getCurrentWeek();

  const [year, setYear] = useState(location.state?.year ?? current.year);
  const [week, setWeek] = useState(location.state?.week ?? current.week);
  const [view, setView] = useState('personal'); // 'personal' | 'everyone'
  const [schedule, setSchedule] = useState(null);
  const [comments, setComments] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null); // { day, dayIndex } | null

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await api.getSchedules(`${year}-${week}`);
      const group = data.schedules?.find((g) => g.groupId === groupId);
      if (!group) return setError('Group not found');
      setMembers(group.members);
      const me = group.members[user.memberId];
      if (!me) return setError('You are not a member of this group');
      setSchedule({ ...me.schedule });
      setComments(me.comments ?? {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId, user.memberId, year, week]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = useCallback(async (day, meal) => {
    const prev = schedule;
    const next = { ...schedule, [day]: (schedule[day] ?? 0) ^ meal };
    setSchedule(next);
    setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], schedule: next } }));
    try {
      await api.createSchedule(groupId, { period: `${year}-${week}`, schedule: next });
    } catch {
      setSchedule(prev);
      setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], schedule: prev } }));
      toast?.('Failed to save schedule');
    }
  }, [schedule, groupId, year, week, user.memberId, toast]);

  const dates = getWeekDates(year, week);
  const todayIndexPast = (i) => {
    const ti = require; // placeholder removed below
  };

  // When the editor saves, merge updated week-comments into local state (and members[me]).
  const handleSaved = useCallback((week7) => {
    setComments(week7);
    setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], comments: week7 } }));
  }, [user.memberId]);

  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar
        title={decodeURIComponent(groupName)}
        left={<IconButton name="back" label="Back" onClick={() => navigate('/')} className="ml-0" />}
        right={<IconButton name="gear" label="Default schedule"
          onClick={() => navigate(`/groups/${groupId}/${groupName}/default`)} />}
      />
      <div className="px-5">
        <div className="flex gap-1.5 bg-chalk/[0.06] border border-line p-1.5 rounded-[14px] my-1 mb-[18px]">
          {[['personal', 'My week'], ['everyone', 'Everyone']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 border-0 cursor-pointer font-body font-semibold text-[12.5px] py-2.5 rounded-[10px] ${view === v ? 'bg-chalk text-slate-0' : 'bg-transparent text-chalk-dim'}`}>
              {label}
            </button>
          ))}
        </div>
        <WeekNavigator year={year} week={week} onChange={(y, w) => { setYear(y); setWeek(w); }} />
      </div>

      <PullToRefresh onRefresh={() => loadData(false)} pullingContent="" className="flex-1">
        <div className="px-5 pt-2 pb-6">
          {loading ? <Spinner label="Loading schedule…" />
            : error ? <div className="text-red text-sm py-4">{error}</div>
            : view === 'personal' && schedule ? (
              <PersonalScheduleView schedule={schedule} dates={dates} onToggle={handleToggle}
                year={year} week={week} comments={comments}
                onDayClick={(day, dayIndex) => setEditor({ day, dayIndex })} />
            ) : view === 'everyone' && members ? (
              <MembersScheduleView members={members} dates={dates} year={year} week={week} />
            ) : null}
        </div>
      </PullToRefresh>

      <CommentEditorSheet
        open={editor !== null}
        onClose={() => setEditor(null)}
        day={editor?.day}
        dayIndex={editor?.dayIndex}
        year={year}
        week={week}
        groupId={groupId}
        allComments={comments ?? {}}
        readOnly={editor ? isPastDay(editor.dayIndex, year, week) : false}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default GroupSchedulePage;
```

- [ ] **Step 3: Add the `isPastDay` helper and remove the stray placeholder**

Delete the `todayIndexPast` placeholder block entirely, and add this import + helper near the top of the file (after the other imports):

```jsx
import { getTodayIndex } from '../constants/schedule';

// A day is read-only if it falls before today within the current week.
const isPastDay = (dayIndex, year, week) => {
  const ti = getTodayIndex(year, week);
  return ti >= 0 && dayIndex < ti;
};
```

(Ensure the final file has NO `const todayIndexPast` / `require` lines — that fragment was a marker to replace.)

- [ ] **Step 4: Verify build + lint**

Run: `yarn --cwd packages/web-client-v2 build` → Expected: success (no `require`/undefined refs).
Run: `yarn --cwd packages/web-client-v2 lint` → Expected: 0 errors.

- [ ] **Step 5: Visual + functional acceptance (dev)**

Open a group. Confirm:
- My week: 7 rows, one-tap green↔red toggle persists (reload keeps it); today coral bar; past dimmed + tiles locked; note glyph coral when a note exists.
- Tap note glyph → bottom sheet rises (dashed grab-rule); type a lunch/dinner note; dismiss → "Saved" toast; reopen shows it; the note glyph turns coral. Past day opens read-only.
- Switch to Everyone (same week retained): day strip with coral/mustard dots; Lunch/Dinner badge blocks with counts; Notes block appears when notes exist.
- Week nav: prev disabled on current week; "Now" only on current week; circular buttons.

- [ ] **Step 6: Commit**

```bash
git add packages/web-client-v2/src/pages/GroupSchedulePage.jsx
git commit -m "feat(web): wire chalk group page (My week / Everyone / comment sheet)"
```

---

# Phase 3 — PWA icon, MUI removal, docs

### Task 19: PWA app icon + manifest

**Files:**
- Modify: `packages/web-client-v2/vite.config.js`
- Modify: `packages/web-client-v2/index.html`
- Add icon assets under `packages/web-client-v2/public/`

- [ ] **Step 1: Generate the icon raster set from the Ardoise source**

Copy `docs/ui-design/ardoise/app-icon.png` (512×512) into `public/` and produce sizes. Using ImageMagick:

```bash
cp docs/ui-design/ardoise/app-icon.png packages/web-client-v2/public/app-icon-512.png
cd packages/web-client-v2/public
magick app-icon-512.png -resize 192x192 app-icon-192.png
magick app-icon-512.png -resize 180x180 apple-touch-icon.png
cd -
```
(If `magick` is unavailable, use any image tool to produce 192 and 180 px PNGs with those exact names.)

- [ ] **Step 2: Update the PWA manifest in `vite.config.js`**

Replace the `manifest` block's `theme_color`, `background_color`, and `icons` (keep `includeAssets` pointing at the new files; `vite-plugin-pwa` content-hashes referenced assets):

```js
manifest: {
  name: 'Meal Planner',
  short_name: 'MealPlanner',
  description: 'Plan your meals with your group',
  theme_color: '#171b18',
  background_color: '#0d100e',
  display: 'standalone',
  scope: '/',
  start_url: '/',
  icons: [
    { src: 'app-icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'app-icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
},
```
Update `includeAssets: ['favicon.ico', 'apple-touch-icon.png']`.

- [ ] **Step 3: `index.html` — apple-touch-icon + viewport**

Confirm the viewport meta is `width=device-width, initial-scale=1, viewport-fit=cover`. Add inside `<head>`:
```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```
Also set `<meta name="theme-color" content="#171b18" />` if present.

- [ ] **Step 4: Verify + commit**

Run: `yarn --cwd packages/web-client-v2 build` → Expected: success; `dist/` manifest references hashed icon URLs.
```bash
git add packages/web-client-v2/vite.config.js packages/web-client-v2/index.html packages/web-client-v2/public/app-icon-192.png packages/web-client-v2/public/app-icon-512.png packages/web-client-v2/public/apple-touch-icon.png
git commit -m "feat(web): Ardoise PWA app icon + manifest"
```

---

### Task 20: Remove MUI/Emotion; delete theme.js; final sweep

**Files:**
- Modify: `packages/web-client-v2/package.json`
- Delete: `packages/web-client-v2/src/theme.js`
- Modify: `packages/web-client-v2/vite.config.js` (drop the `mui-icons` manualChunk)

- [ ] **Step 1: Confirm no residual imports**

Run:
```bash
grep -rn "@mui\|@emotion\|theme.js\|createAppTheme\|from 'react-simple-pull-to-refresh'" packages/web-client-v2/src
```
Expected: only the `react-simple-pull-to-refresh` import in `GroupSchedulePage.jsx`; **zero** `@mui` / `@emotion` / `createAppTheme` hits. If any remain, convert that file before proceeding.

- [ ] **Step 2: Remove dependencies and the dead chunk**

```bash
yarn --cwd packages/web-client-v2 remove @mui/material @mui/icons-material @emotion/react @emotion/styled
git rm packages/web-client-v2/src/theme.js
```
In `vite.config.js`, delete the `if (id.includes('@mui/icons-material')) return 'mui-icons';` branch from `manualChunks`.

- [ ] **Step 3: Verify build + lint + visual smoke**

Run: `yarn --cwd packages/web-client-v2 build` → Expected: success, no missing-module errors.
Run: `yarn --cwd packages/web-client-v2 lint` → Expected: 0 errors.
Run dev and click through every screen (login, signup, groups, group→My week, Everyone, comment sheet, default schedule, settings, account, about) → Expected: all chalk, nothing broken, no console import errors.

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/package.json packages/web-client-v2/yarn.lock packages/web-client-v2/vite.config.js
git commit -m "chore(web): remove MUI/Emotion deps and theme.js"
```

---

### Task 21: Documentation updates

**Files:**
- Modify: `.claude/ui.md`
- Modify: `MEMORY.md` (auto-memory index) — update the web-client-v2 tech row
- (If architecture-relevant) `README.md`

- [ ] **Step 1: Update `.claude/ui.md`**

Reflect: MUI dropped → Tailwind v4; chalk primitives in `src/components/ui/`; chalk `Icon` sprite; day-centric Everyone; comment editing via `CommentEditorSheet` (autosave) + inline Notes block (CommentsPage + CommentsDrawer removed); informational empty state (no group-management UI); dark-only Ardoise theme tokens. Remove references to `theme.js` and the `/day/:day` route.

- [ ] **Step 2: Update memory index**

In `/Users/jrsue/.claude/projects/-Users-jrsue-dev-repos-meal-planner/memory/MEMORY.md`, change the web-client-v2 tech from "MUI 6, Vite 6, Amplify" to "Tailwind v4, Vite 6, Amplify".

- [ ] **Step 3: Verify + commit**

```bash
git add .claude/ui.md README.md
git commit -m "docs: update ui.md for Ardoise/Tailwind redesign"
```

---

## Self-review (completed by plan author)

**Spec coverage:** tokens/fonts/grain (T1) ✓; icons (T2) ✓; primitives incl. BottomSheet/Toast/MealTile (T3–5) ✓; shell+routes (T6) ✓; splash (T7); update prompt + preserved logic (T8); login no-tagline (T9); signup+pending (T10); groups + informational empty state, no `+` (T11); settings/account/about (T12); week nav current-or-forward + circular (T13); My week one-tap + note trigger (T14); comment autosave sheet (T15); day-centric Everyone + inline Notes, uniform members (T16); default schedule dashed "the usual" (T17); shared-week wiring + comment sheet (T18); PWA icon hashed + apple-touch + slate colors (T19); MUI/Emotion removal + theme.js delete (T20); docs (T21). All spec §3–§8 items mapped.

**Placeholder scan:** the only intentional marker is the `todayIndexPast`/`require` fragment in T18 Step 2, explicitly removed in T18 Step 3 — called out so the engineer deletes it. No other TBD/TODO.

**Type/name consistency:** `MealTile` props `{label,on,onClick,disabled}` used consistently (T5/14/17); `colorForName`/`initialsOf` (T3) used in Avatar/Badge/Groups; `CommentEditorSheet` props match the call site in T18; `api.createComments` payload uses `weekNumber` + day keys (matches `services/api.js` + old CommentsPage); `useToast()` returns the `show` function, called as `toast?.(msg)` everywhere.
