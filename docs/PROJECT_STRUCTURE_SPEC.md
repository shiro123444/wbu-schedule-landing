# Project Structure Spec

Version: 1.0  
Scope: `wbu-schedule-landing` frontend project  
Audience: Human developers and coding agents

## 1. Objective

This document defines the source layout, file responsibilities, naming conventions, and extension rules for the frontend project.
Any AI-generated code should follow this structure before proposing new folders.

## 2. Current Canonical Structure

```text
wbu-schedule-landing/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   └── components/
│       └── WelcomeScreen.jsx
└── docs/
    ├── PROJECT_STRUCTURE_SPEC.md
    ├── DEPENDENCY_SPEC.md
    └── DESIGN_LANGUAGE_SPEC.md
```

## 3. File Responsibilities

| Path | Responsibility | Change Frequency |
|---|---|---|
| `index.html` | Root HTML shell and mount node | Low |
| `src/main.jsx` | React bootstrap, root render | Very low |
| `src/App.jsx` | Main landing page sections and global motion orchestration | High |
| `src/components/WelcomeScreen.jsx` | Welcome overlay typing animation and entry transition | Medium-High |
| `src/index.css` | Design tokens, base styles, utility classes, shared UI styles | High |
| `tailwind.config.js` | Tailwind config and utility extension | Low |
| `vite.config.mjs` | Build/dev server config | Low |

## 4. Section Architecture in `App.jsx`

The page is organized in this exact sequence:

1. Welcome overlay mount (`<WelcomeScreen />`)
2. Fixed navigation
3. Hero section
4. Features section
5. Compare section
6. Showcase section
7. Footer

Rules:

- Keep section order stable unless there is a product requirement.
- Keep per-section motion local to that section.
- Shared motion constants must stay near the top-level of `App.jsx`.

## 5. Component Placement Rules

### 5.1 Create a new component when

- A JSX block exceeds ~120 lines and has isolated state.
- The same UI pattern appears in 2+ sections.
- A feature has independent animation lifecycle.

### 5.2 Keep logic in `App.jsx` when

- It coordinates cross-section state (e.g. active tab index).
- It controls viewport-dependent orchestration (`useInView`, auto-cycling).

### 5.3 Folder conventions

- Reusable visual units: `src/components/`
- Future hooks: `src/hooks/`
- Future constants/data: `src/constants/`
- Future assets: `src/assets/`

## 6. Naming Conventions

- React component files: `PascalCase.jsx`
- Utility/hooks: `camelCase.js|jsx`
- Constants: `UPPER_SNAKE_CASE`
- CSS class groups: semantic prefixes (`btn-`, `card-`, `schedule-`)

Examples:

- Good: `WelcomeScreen.jsx`, `useReducedMotion`, `cycleDuration`
- Avoid: `welcome.jsx`, `hook1`, `data2`

## 7. Animation Code Organization

- Global easing constant and variants at top of file.
- Section-level `motion` configs close to consuming JSX.
- Avoid inline complex variant objects repeated across many nodes.

Preferred pattern:

```jsx
const ease = [0.22, 1, 0.36, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
```

## 8. Styling Placement Rules

- Global tokens and primitives belong in `src/index.css`.
- One-off layout tweaks belong inline as Tailwind utility classes.
- Repeated visual patterns must be extracted as semantic classes in `index.css`.

## 9. AI Change Protocol

Any AI-generated PR or patch must include:

1. Which file responsibility is being modified.
2. Whether a new component is needed and why.
3. Whether motion behavior changes user flow.
4. If new files are added, justify folder placement.

## 10. Definition of Done (Structure)

- No orphan files.
- No dead component imports.
- No duplicate section-level data constants.
- `npm run build` passes.
- Folder layout still matches this spec (or spec updated in same change).
