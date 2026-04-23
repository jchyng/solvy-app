# Solvy Design System

## Overview

**Solvy** is a mobile-first math learning app that photographs math problems and explains the solution step-by-step using AI. The core differentiator: rather than showing students the answer directly (like competitor Qqanda), Solvy prompts students to explain the solution *in their own words*, and provides Socratic feedback. It targets middle/high school students (primary) and parents (secondary, as payers who monitor learning depth).

**Positioning tagline:** "답을 가르치는 앱이 아닙니다. 답을 설명하게 하는 앱입니다."  
("We don't teach you the answer. We make you explain it.")

### Products / Surfaces
1. **Mobile App** — Core student-facing app; max-width 420px, mobile web
2. **Tablet View** — Handwriting canvas with Apple Pencil support, math keyboard
3. **Parent Dashboard** — Separate route; data-dense view of child's learning depth

### Source Materials
- **Codebase:** `src/` (mounted via File System Access API — React + TypeScript + Tailwind CSS v4)
  - `src/index.css` — Design tokens (CSS vars), font imports, KaTeX styles
  - `src/components/UploadView.tsx` — Upload / home screen
  - `src/components/LoadingView.tsx` — Analysis loading screen
  - `src/components/ResultView.tsx` — Main result: Intent → Solution → Answer → Tip, Chat/Q&A
  - `src/components/MarkdownView.tsx` — Markdown + KaTeX renderer
  - `src/components/InteractiveVisuals.tsx` — SVG interactive visualizations
  - `src/store.ts` — Zustand state (sessions, mode, hints)
  - `src/types.ts` — TypeScript interfaces

---

## Content Fundamentals

### Voice & Tone
- **Friendly but serious.** Not playful, not stiff. Like a thoughtful tutor who respects the student's intelligence.
- **Restraint over enthusiasm.** Avoid excessive emoji, exclamation marks, or gamification language.
- **Socratic, not prescriptive.** Ask questions rather than state answers. "어떻게 생각했나요?" not "정답은 OO입니다."
- **Measured warmth.** A compliment like "훌륭한 설명이었어요" is appropriate; a badge-shower is not.
- **Parents see seriousness.** When parents view the dashboard, the copy should feel like a school report, not an app notification.

### Language Rules
- Primary language: **Korean (한국어)**, secondary: English for labels/headers (Intent, Solution, Hint)
- Korean body text in **Pretendard Variable** — natural, modern, legible
- English section labels in **Instrument Serif italic** — gives a literary, academic feel
- Math expressions in **JetBrains Mono** or KaTeX rendering
- Casing: English labels are Title Case ("Final Answer", "Expert Insight")
- No emoji in UI chrome — they may appear rarely in AI responses, not in product copy

### Copy Patterns
| Context | Example |
|---|---|
| CTA | "문제를 촬영하거나 업로드하세요" |
| Section label | *i. Intent*, *ii. Solution*, *iii. Final Answer* |
| AI prompt | "질문하거나, 자신의 말로 설명해보세요..." |
| Loading | "Solvy가 문제를 분석하고 있습니다" |
| Tip label | "Expert Insight" |
| Hint CTA | "다음 힌트 열기" |

---

## Visual Foundations

### Color System
Two modes: **Light** (default) and **Dark** (`prefers-color-scheme: dark`).

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#F5F2EC` | `#13120F` | Page background — warm off-white / deep near-black |
| `--bg-elevated` | `#FBF9F4` | `#1C1B17` | Cards, panels, elevated surfaces |
| `--bg-sunken` | `#EEEAE1` | `#0E0D0B` | Inputs, code blocks, recessed areas |
| `--ink` | `#1A1814` | `#F0ECE0` | Primary text, headings |
| `--ink-2` | `#3C3932` | `#D4D0C3` | Secondary text, body |
| `--ink-3` | `#6B675D` | `#95907F` | Tertiary text, placeholders |
| `--ink-4` | `#9E998E` | `#6B6757` | Disabled, hints |
| `--line` | `#E2DDD0` | `#2A2822` | Borders, dividers, rules |
| `--accent` | `#3D5C4B` | `#8FB89F` | Forest green — primary action, links, highlights |
| `--accent-soft` | `#E0E8DF` | `#1F2A23` | Accent background tints, code highlight |
| `--warn` | `#A65F2E` | `#D4925E` | Warnings, error states, amber tone |

**Color vibe:** Warm sepia/parchment backgrounds; deep ink tones (not pure black); forest green accents — evokes a library, a well-used notebook. Never neon, never saturated blue.

### Typography
| Role | Family | Style | Usage |
|---|---|---|---|
| Display / Brand | Cormorant Garamond | italic | "Solvy" logo, section labels (i. Intent), decorative headers |
| Body / UI | Pretendard Variable | 400–600 | All Korean body text, UI labels, buttons |
| Math / Code | JetBrains Mono | 400–500 | Inline math, code, answer display, monospace values |

**Type scale (mobile):**
- Brand / H1: 36px, Instrument Serif italic
- H2 / Section: 18–20px, Pretendard 600
- Body: 15px, Pretendard 400, line-height 1.6–1.65
- Small / Label: 11–13px, Pretendard 500
- Math inline: 14.4px (1.15em × 15px base), JetBrains Mono
- Math display: 15px (1.25em in KaTeX block)
- Mono label: 11px, tracking 0.2em, uppercase, JetBrains Mono

### Spacing & Layout
- **Mobile-first:** max-width 420px, centered, full-height
- Horizontal padding: `px-4` (16px) standard; `px-5` for chat inputs
- Vertical rhythm: `space-y-6` between sections (24px), `space-y-4` within groups
- Safe area: `pb-safe` / `pt-safe` for notch/home-bar

### Corner Radii
| Usage | Value |
|---|---|
| Cards, main panels | `rounded-[22px]` to `rounded-[32px]` |
| Chips / tags / pills | `rounded-full` |
| Icon containers | `rounded-2xl` (16px) or `rounded-full` |
| Math blocks / inline code | `rounded-xl` (12px) or `4px` |
| Small badges | `rounded-full` |

### Borders & Shadows
- **Borders:** 1px `var(--line)` on cards and elevated surfaces — subtle parchment-tone separator
- **Dashed borders:** used on upload drop zones (2px dashed `--line`) with accent on hover
- **Shadows:** Minimal. `shadow-sm` only where needed (icon buttons). No heavy drop shadows.
- **Backdrop blur:** `backdrop-blur-md` on sticky headers, fixed bottom bars (`bg-bg/80` + `backdrop-blur-md`)

### Backgrounds & Texture
- Flat warm-toned backgrounds only — no gradients in UI chrome
- Light dot-pattern overlay used on problem thumbnail cards (`radial-gradient` with 0.2 opacity ink, 8px grid) — subtle paper texture effect
- No full-bleed imagery in the app chrome

### Animation
- **Library:** `motion/react` (Framer Motion)
- **Entrance:** `opacity: 0 → 1, y: 20 → 0` — calm fade-up, no bounce
- **Chat panel slide-up:** `y: '100%' → 0`
- **Icon buttons:** `active:scale-95` — subtle press feedback
- **Transitions:** `transition-all`, `transition-colors` — standard 150ms ease
- No bouncy springs, no celebration effects, no particle bursts

### Interactive States
- **Hover:** `hover:bg-bg-sunken` (inputs, cards), `hover:text-ink` (icons), `hover:border-ink-4`
- **Active/Press:** `active:scale-95` on primary icon buttons
- **Focus:** `focus:outline-none focus:border-ink-3` on inputs; no default browser ring
- **Disabled:** `opacity-50` on send buttons; `bg-ink-3` background on disabled states

### Cards
Cards are the main content unit. They use:
- `bg-bg-elevated` or `bg-bg-sunken` background
- `border border-line` — 1px warm border
- `rounded-[22px]` — generously rounded
- No box-shadow (border does the separation work)
- Inner padding: `p-4` to `p-6` depending on content density

### KaTeX / Math Blocks
- Display math: `bg-bg-sunken`, `border border-line`, `rounded-[16px]`, centered, scrollable horizontally
- Inline math: inherits text color, 1.15em scale
- Display math: 1.25em, `white-space: nowrap`

---

## Iconography

**Icon system:** [Lucide React](https://lucide.dev/) — consistent 2px stroke, rounded caps, clean geometric style. Loaded as React components from `lucide-react`.

Icons used in the codebase:
| Icon | Usage |
|---|---|
| `Camera` | Upload CTA button |
| `Image` | Upload secondary |
| `Upload` | Upload action |
| `ChevronRight` | Hint expand, navigation |
| `RefreshCcw` | Reset / retry |
| `Send` | Chat submit |
| `Sparkles` | AI indicator |
| `X` | Close |
| `Menu` | Navigation menu |
| `SkipBack` | Back navigation |
| `Loader2` | Loading spinner (`animate-spin`) |
| `Lightbulb` | Expert Insight / Tip |
| `Mic` | Voice input |
| `MessageCircle` | Chat / Q&A |
| `Paperclip` | Attach context |

**Style guidance:** Use Lucide at `size={20}` for navigation, `size={18}` for inline, `size={32}` for hero actions. Color via `text-ink`, `text-ink-3`, `text-accent` Tailwind classes.

**No emoji in chrome.** No custom SVG icon sets beyond Lucide. No icon fonts.

---

## File Index

```
README.md                        ← this file
SKILL.md                         ← agent skill definition
colors_and_type.css              ← all CSS design tokens + semantic vars
assets/
  solvy-logo.svg                 ← text logotype (Instrument Serif italic)
preview/
  colors-base.html               ← bg / surface color swatches
  colors-ink.html                ← ink hierarchy swatches
  colors-semantic.html           ← accent / warn / line swatches
  colors-dark.html               ← dark mode palette
  type-scale.html                ← full type scale specimen
  type-serif.html                ← Instrument Serif specimens
  type-mono.html                 ← JetBrains Mono specimens
  spacing-radii.html             ← corner radius tokens
  spacing-borders.html           ← border + shadow system
  components-buttons.html        ← button variants
  components-chips.html          ← chips, tags, badges
  components-cards.html          ← card variants
  components-inputs.html         ← form inputs
  components-chatbubbles.html    ← chat message bubbles
  components-mathblock.html      ← KaTeX math block styles
  brand-logo.html                ← logo + wordmark
ui_kits/
  mobile_app/
    index.html                   ← interactive mobile app prototype
    UploadView.jsx               ← upload / home screen
    LoadingView.jsx              ← loading / analysis screen
    ResultView.jsx               ← result: intent, steps, answer, tip
    ChatView.jsx                 ← socratic chat Q&A
    Shared.jsx                   ← shared primitives (tokens, icons)
  parent_dashboard/
    index.html                   ← parent dashboard prototype
    Dashboard.jsx                ← overview cards + charts
    Shared.jsx                   ← shared primitives
```
