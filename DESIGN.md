---
name: Career Ops
description: Local-first AI job search toolkit for professional immigrants in Australia
colors:
  bg: "#07111E"
  surface: "#0F1E30"
  card: "#142030"
  border: "#1E3248"
  muted: "#4A6580"
  text: "#C8DDF0"
  bright: "#EAF4FF"
  teal: "#0E9B8A"
  teal-highlight: "#07C5B0"
  amber: "#F5A623"
  red: "#E8504A"
  green: "#2ECC8F"
  setup-bg: "#F7F4EF"
  setup-surface: "#FFFFFF"
typography:
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.03em"
  mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.bright}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.teal-highlight}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
  chip-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  chip-selected:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.bright}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  card-default:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
---

# Design System: Career Ops

## 1. Overview

**Creative North Star: "The Quiet Counsel"**

Career Ops is the advisor in the room who already knows the system. It doesn't explain itself. It doesn't perform energy it hasn't earned. It gives you an edge through calm precision — one clear action at a time, no noise, no theatrics. The interface is the argument for the tool's competence. If the UI is trustworthy, the AI output is trustworthy.

The visual language is dark-first — not because dark looks technical, but because users arrive at night, after a long day of work, with a job description open in another tab. The surface should feel like a prepared desk, not a landing page. Generous spacing is not a luxury; it is a deliberate reduction of cognitive load for users navigating a stressful process in a second language, in an unfamiliar market.

This system rejects everything that signals "someone made this to look good in a Dribbble screenshot." No gradient text. No purple accents. No hero metrics. No identical card grids. No startup hype. The interface should be indistinguishable from an in-house tool built by a team that respects its users.

**Key Characteristics:**
- Dark-first, with a distinct warm-linen light theme reserved for the setup wizard
- Tonal depth through four background layers — no shadows
- One accent color (Advisor Teal) used sparingly; semantic colors reserved for meaning
- IBM Plex Sans throughout — institutional clarity, excellent multilingual rendering
- IBM Plex Mono for all data-heavy contexts: scores, IDs, dates, codes
- Breathing room as a deliberate design choice — never compressed, never cluttered

## 2. Colors: The Deep Water Palette

A dark, tinted-navy system anchored in cool deep blues with a single warm accent. The palette reads calm and professional under dim ambient light — the typical context for this tool.

### Primary
- **Advisor Teal** (`#0E9B8A` / `oklch(58% 0.12 185)`): The sole accent. Used on primary CTAs, active nav states, focus rings, progress indicators, and selected chips. Its rarity is the point — when teal appears, it means "act here."
- **Active Teal** (`#07C5B0` / `oklch(72% 0.14 185)`): Lighter teal used for hover states on primary buttons, inline highlights, and active tags. Never used as a standalone accent — only as a teal shift state.

### Neutral
- **Deep Ink** (`#07111E`): The foundational canvas. Page background on all dark-theme pages. Never used inside components.
- **Nocturne** (`#0F1E30`): Raised surfaces — navigation bar (with backdrop blur), side panels, modal backdrops.
- **Slate Well** (`#142030`): Card backgrounds, list item backgrounds, dropdown surfaces.
- **Reef Line** (`#1E3248`): All borders and separators. Full border on cards and inputs; used sparingly as dividers.
- **Storm Gray** (`#4A6580`): Placeholder text, inactive icons, metadata labels, muted secondary copy.
- **Cool Mist** (`#C8DDF0`): Primary body text. The colour most words are rendered in.
- **Near White** (`#EAF4FF`): High-emphasis text — headings, card titles, active labels.

### Tertiary
- **Signal Amber** (`#F5A623`): Semantic only. Opportunity signals, warning states, "in progress" application status. Never decorative.
- **Decline Red** (`#E8504A`): Semantic only. Rejection states, destructive actions, error messages.
- **Progress Green** (`#2ECC8F`): Semantic only. Offer received, success states, confirmed actions.

### Setup Theme Variant
- **Warm Linen** (`#F7F4EF`): Background for the setup wizard only. A deliberate departure — the onboarding experience is the one place the tool slows down and breathes. Not used anywhere else.
- **Chalk White** (`#FFFFFF`): Card surfaces within the setup wizard.

**The One Voice Rule.** Teal is the only accent that appears on dark-theme pages. Amber, red, and green are semantic signals — they communicate status, never decoration. If you are reaching for one of these colours to make something "pop," reconsider. Use teal or use nothing.

**The Semantic Lock Rule.** Amber, red, and green are reserved for job application status semantics: opportunity/interview/warning (amber), rejection/destructive (red), offer/success (green). Using any of these colours in a non-semantic context violates the system's trust model.

## 3. Typography

**Display / Body Font:** IBM Plex Sans (sans-serif fallback)
**Data / Code Font:** IBM Plex Mono (monospace fallback)

**Character:** IBM Plex Sans carries institutional authority without coldness — it was designed for technical professional contexts and has exceptional multilingual coverage, which matters for a tool whose users may read and write in English as a second language. IBM Plex Mono brings the same design rigour to data-dense contexts: scores, IDs, dates, and codes read cleanly at small sizes on dark backgrounds.

### Hierarchy
- **Display** (600, `clamp(1.75rem, 4vw, 2.5rem)`, lh 1.15, ls -0.01em): Page-level hero titles. Used on the Career Compass path diagram header and the Setup wizard welcome screen. Rare — one per page at most.
- **Headline** (600, `1.25rem`, lh 1.3, ls -0.005em): Section headings, modal titles, major card group labels.
- **Title** (600, `1rem`, lh 1.4): Card titles, step labels, tab headings.
- **Body** (400, `0.9375rem`, lh 1.65): All descriptive copy. Max line length 65–75ch. Never compressed into tighter line-height — breathing room is a design choice, not slack.
- **Label** (500, `0.75rem`, lh 1.4, ls 0.03em): Metadata, chip text, input labels, nav links, status counts. Slightly tracked to compensate for small size.
- **Mono** (400, `0.875rem`, lh 1.6): All numeric data — fit scores, application dates, ATS keyword counts, IDs, and any generated code. IBM Plex Mono only; never substitute a sans for data contexts.

**The One Family Rule.** IBM Plex Sans handles every typographic role. No decorative or display serif is introduced — not even for hero titles. Weight and size create hierarchy; a second typeface is not needed and would undermine the system's coherence.

## 4. Elevation

Career Ops uses no `box-shadow`. Depth is entirely tonal — each layer in the four-step dark palette (Deep Ink → Nocturne → Slate Well → Near White text) creates the perception of elevation through contrast alone. This keeps the rendering lean, eliminates shadow-colour matching problems across states, and produces a surface that feels precise rather than layered.

**The Four Steps:**
- Layer 0 — Deep Ink (`#07111E`): the page itself
- Layer 1 — Nocturne (`#0F1E30`): navigation, modal overlays, panels
- Layer 2 — Slate Well (`#142030`): cards, dropdowns, list items
- Layer 3 — Near White (`#EAF4FF`): high-emphasis text sits "above" the surface without a physical lift

**The Depth Rule.** Layer by colour, never by shadow. If you find yourself reaching for `box-shadow` as a decorative tool, reconsider the tonal hierarchy instead. The sole exception: focus rings, which may use a low-spread `box-shadow` as an accessibility affordance only (`box-shadow: 0 0 0 3px rgba(14, 155, 138, 0.2)`).

## 5. Components

### Buttons
Firm and unambiguous. Buttons have a clear resting state, a visible hover shift, and a strict two-variant system. No rounded-full pill buttons — the 6px radius is deliberate; it signals "action," not "playful."

- **Shape:** Gently squared corners (6px radius)
- **Primary:** Advisor Teal background (`#0E9B8A`), Near White text, 10px/20px padding. Hover shifts to Active Teal (`#07C5B0`). Transition: 0.15s ease-out on background.
- **Focus:** 2px outline offset, Active Teal colour (`outline: 2px solid #07C5B0; outline-offset: 2px`)
- **Ghost:** Transparent background, Reef Line border (`1px solid #1E3248`), Cool Mist text. Hover: Nocturne background, Storm Gray border. Used for secondary and cancel actions.
- **Danger:** Decline Red background (`#E8504A`). Reserved for destructive actions only (delete, withdraw application). Never used for generic secondary actions.

### Chips
Used for role selection in setup, ATS keyword matching in the JD Analyser, and status badges in the pipeline. Two variants only.

- **Unselected:** Slate Well background, Reef Line border, Cool Mist text, 20px pill radius, 4px/12px padding. Hover: border shifts to Storm Gray.
- **Selected:** Advisor Teal background, no border, Near White text. Transition: 0.15s ease-out on background and border-color.
- Label text uses the label scale (0.75rem, 500 weight, 0.03em tracking).

### Cards / Containers
- **Corner style:** Gently rounded (12px radius) — firm but not sharp
- **Background:** Slate Well (`#142030`)
- **Border:** Full Reef Line border (`1px solid #1E3248`) on all four sides. No side-stripe accents.
- **Shadow strategy:** None — see Elevation
- **Internal padding:** 24px (`spacing.lg`)
- **No nested cards.** A card inside a card is always wrong. Use a bordered section, a divider, or a flat list instead.

### Inputs / Fields
- **Style:** Nocturne background (`#0F1E30`), Reef Line border, 8px radius
- **Placeholder:** Storm Gray text
- **Focus:** Border shifts to Advisor Teal; subtle teal glow (`box-shadow: 0 0 0 3px rgba(14, 155, 138, 0.15)`)
- **Error:** Border shifts to Decline Red; error message below in Decline Red at label scale
- **Disabled:** 50% opacity on the container; `cursor: not-allowed`
- Labels sit above the input at label scale (0.75rem, 500 weight)

### Navigation
- **Style:** Nocturne background with `backdrop-filter: blur(12px)`, fixed top, full-width, 52px height
- **Border:** Single Reef Line bottom border
- **Nav links:** Label scale (0.875rem, 500 weight), Storm Gray at rest, Near White active, Slate Well background on hover
- **Active state:** Near White text — no underline, no side indicator, no filled background
- **Mobile:** Nav collapses or hides at 540px; tool names replace to icons or a hamburger; hub retains full nav

### Kanban Cards (Signature)
The pipeline kanban card is the most data-dense component. It must communicate company, role, date, and status at a glance without crowding.

- 8px radius (md), Slate Well background, Reef Line border
- 14px/16px internal padding (tighter than standard cards — density is appropriate here)
- Company name: label scale, Storm Gray, uppercase, tracked
- Role title: title scale (1rem, 600), Near White
- Date: IBM Plex Mono, label size, Storm Gray
- Status badge: inline, 4px radius, semantic colour at 12% opacity background + full colour text
- Hover: border shifts to Storm Gray, background lightens slightly

### Score Circle (Signature)
Used in the JD Analyser to show the A–F fit grade. The circle is the primary visual anchor on that screen.

- 88×88px circle, 3px solid border in the grade's semantic colour
- Grade letter: 2rem, 700 weight, IBM Plex Sans, same colour as border
- "Fit Score" label below: 0.625rem, uppercase, tracked, Storm Gray
- Colour mapping: A → Progress Green, B → Active Teal, C → Signal Amber, D/F → Decline Red

## 6. Do's and Don'ts

### Do:
- **Do** use Advisor Teal (`#0E9B8A`) on ≤10% of any given screen. Its scarcity is what gives it authority.
- **Do** use IBM Plex Mono for every numeric, date, score, and code context — even when the surrounding text is IBM Plex Sans.
- **Do** apply full borders on all four sides of cards and inputs. Never a side-stripe.
- **Do** use semantic colours (amber/red/green) only for their assigned job-search statuses. Never reuse them for decoration.
- **Do** leave breathing room. 24px internal card padding is the minimum. Compress only when the component type demands it (kanban cards).
- **Do** respect `prefers-reduced-motion`. All transitions should be gated: `@media (prefers-reduced-motion: no-preference)`.
- **Do** use the Warm Linen light theme exclusively for `setup.html`. Every other page is dark.
- **Do** provide visible focus indicators on every interactive element — outline or box-shadow in Advisor Teal.

### Don't:
- **Don't** use `border-left` or `border-right` greater than 1px as a coloured accent stripe on cards, list items, callouts, or alerts. This pattern is banned unconditionally. Rewrite with a full border, a tinted background, or a leading icon.
- **Don't** use gradient text (`background-clip: text`). Single solid colour only. Emphasis through weight or size.
- **Don't** reach for purple. Career Ops has no purple in its palette. If a purple gradient appears, it is an AI reflex and must be removed.
- **Don't** replicate the startup hype aesthetic: gradient backgrounds, hero metrics (big number + small label + supporting stats), bouncing animations, social proof badge layouts.
- **Don't** build identical card grids (same-size cards, icon + heading + body text, repeated endlessly). If it looks like a SaaS feature comparison, reconsider the layout.
- **Don't** use bouncy or elastic easing (`cubic-bezier` with overshoot). All motion uses ease-out curves. Exponential preferred.
- **Don't** animate CSS layout properties (`width`, `height`, `top`, `left`, `padding`). Animate `transform` and `opacity` only.
- **Don't** introduce a second accent colour. Amber, red, and green are semantic locks — they are not available as decorative accents.
- **Don't** nest cards. A card inside a card is always the wrong answer.
- **Don't** use `#000` or `#FFF`. The darkest surface is Deep Ink (`#07111E`); the lightest text is Near White (`#EAF4FF`). These are the absolute bounds.
- **Don't** import Syne, Instrument Serif, or Inter. IBM Plex Sans and IBM Plex Mono are the only permitted typefaces.
