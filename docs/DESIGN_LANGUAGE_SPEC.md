# Design Language Spec

Version: 1.0  
Scope: UI style, component language, and animation grammar  
Audience: Human designers, developers, and coding agents

## 1. Design Identity

Project style is a hybrid of:

- Solarized color system
- Brutalist edges (hard borders, offset shadows)
- Minimal high-contrast composition
- Motion-led storytelling in onboarding

Core tone:

- Clear
- Technical
- Youthful
- Direct

## 2. Color Tokens (Canonical)

Use token names, not raw colors, in component classes whenever possible.

| Token | Value | Usage |
|---|---|---|
| `--color-solarized-base3` | `#fdf6e3` | Primary light background |
| `--color-solarized-base2` | `#eee8d5` | Secondary panel background |
| `--color-solarized-base02` | `#073642` | Primary text and strong borders |
| `--color-solarized-base01` | `#586e75` | Secondary text |
| `--color-solarized-orange` | `#cb4b16` | Primary CTA and emphasis |
| `--color-solarized-cyan` | `#2aa198` | Data/status accent |
| `--color-solarized-red` | `#dc322f` | Warning/negative emphasis |
| `--color-solarized-blue` | `#268bd2` | Supporting accent |

Contrast rule:

- Body text on light backgrounds must remain WCAG AA readable.

## 3. Typography System

### 3.1 Font families

- Display/Sans: `Space Grotesk`
- Serif accent: `Noto Serif SC`

### 3.2 Text hierarchy

- Hero H1: oversized (`text-7xl` to `text-8xl`) and tight leading.
- Section heading: `text-5xl` to `text-6xl`.
- Body text: `text-base` to `text-xl` with relaxed line-height.
- Meta labels: uppercase, tracking widened.

### 3.3 Welcome screen hierarchy

- Opening line: centered, largest block.
- Identity marker (`WBUer们`): highlighted with orange accent.
- Manifesto lines: medium emphasis.
- Long descriptive paragraphs: comfortable reading size.

## 4. Layout Language

- Main container widths: `max-w-5xl`, `max-w-6xl`, `max-w-7xl`.
- Section rhythm: generally `py-20` with explicit section boundaries.
- Card rhythm: hard border + rectangular silhouette + offset shadow.
- No rounded-corner-heavy aesthetic unless explicitly requested.

## 5. Component Visual Rules

### 5.1 Buttons

- `.btn-primary`: orange fill, dark offset shadow, translate on hover.
- `.btn-secondary`: transparent with strong border, invert on hover.

### 5.2 Cards

- `.card-asymmetric`: offset shadow and slight positional asymmetry.
- `.schedule-item`: left border color strip and horizontal hover shift.

### 5.3 Footer

- Dark inverse block (`base02`) with orange top border.
- Links lighten on hover with color transition only.

## 6. Motion Grammar

### 6.1 Easing

Default easing curve:

```js
[0.22, 1, 0.36, 1]
```

### 6.2 Duration standards

- Quick feedback: `0.15s` to `0.25s`
- Section reveal: `0.5s` to `0.8s`
- Overlay enter/exit: around `0.3s` to `0.35s`

### 6.3 Animation families in project

1. Reveal (`fadeInUp`, staggered children)
2. Hover translation (small `x/y` motion)
3. Auto-cycle progress (showcase section)
4. Typing simulation (welcome overlay)
5. Blinking caret/status pulse

### 6.4 Welcome typing behavior

- Typing is index-based string slicing.
- Punctuation has slightly longer delay.
- Newlines have shorter delay.
- Text viewport auto-scrolls to keep latest content visible.

### 6.5 Reduced motion compliance

- Respect `prefers-reduced-motion` globally.
- Any new animation must have a low-motion fallback.

## 7. Interaction and Accessibility Rules

- All clickable cards/links/buttons use `cursor-pointer`.
- Keyboard skip path exists for welcome overlay (`Esc`).
- Interactive controls should remain visually obvious.
- Avoid relying only on color for meaning.

## 8. Copywriting Tone Guide

- Chinese-first UI copy.
- Product copy should be concise and energetic.
- Long-form onboarding copy can be expressive but still readable.
- CTA text should be direct and conversational.

## 9. Anti-Patterns

- Random gradients unrelated to token palette.
- Soft, generic SaaS cards that break brutalist character.
- Excessive bounce/elastic animations.
- Multiple competing highlight colors in one section.
- Introducing emoji as icon replacements.

## 10. AI Prompt Contract (Recommended)

Use this when asking another AI to generate UI for this project:

```text
Read docs/PROJECT_STRUCTURE_SPEC.md, docs/DEPENDENCY_SPEC.md, and docs/DESIGN_LANGUAGE_SPEC.md first.
Keep Solarized + brutalist minimal style.
Use existing tokens/classes from src/index.css.
Use Framer Motion only for animation.
Respect prefers-reduced-motion.
Do not add dependencies unless explicitly approved.
```

## 11. Definition of Done (Design Language)

- New UI visually matches existing sections.
- Tokens reused; raw color literals minimized.
- Motion is intentional and consistent with easing/duration rules.
- Mobile view has no horizontal overflow.
- No accessibility regressions introduced.
