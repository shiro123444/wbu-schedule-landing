# Dependency Spec

Version: 1.0  
Scope: Frontend runtime/build dependencies for `wbu-schedule-landing`  
Audience: Human developers and coding agents

## 1. Objective

Define dependency boundaries, upgrade policy, and acceptance criteria.
Any AI adding packages must justify necessity against this spec.

## 2. Current Dependency Inventory

### 2.1 Runtime dependencies

| Package | Version (current) | Purpose |
|---|---|---|
| `react` | `^19.2.4` | UI rendering and component state model |
| `react-dom` | `^19.2.4` | Browser DOM renderer |
| `framer-motion` | `^12.34.5` | Declarative motion and transitions |

### 2.2 Dev dependencies

| Package | Version (current) | Purpose |
|---|---|---|
| `vite` | `^7.3.1` | Dev server and production bundling |
| `@vitejs/plugin-react` | `^5.1.4` | React transform support in Vite |
| `tailwindcss` | `^4.2.1` | Utility-first CSS system |
| `@tailwindcss/postcss` | `^4.2.1` | Tailwind PostCSS integration |
| `postcss` | `^8.5.8` | CSS transformation pipeline |
| `autoprefixer` | `^10.4.27` | Vendor prefix compatibility |

## 3. Dependency Principles

1. Keep runtime minimal.
2. Prefer CSS and existing utilities before adding JS UI libraries.
3. Avoid overlapping tools.
4. Prefer battle-tested libraries with strong docs.
5. New dependency must reduce complexity, not relocate it.

## 4. What AI Must Not Add by Default

- Another animation framework (already using Framer Motion).
- Another CSS framework (already using Tailwind 4 + custom tokens).
- Heavy UI kits that conflict with current handcrafted visual language.
- Date/state/form libraries unless there is hard feature need.

## 5. Acceptable Reasons to Add a Dependency

- Security fix unavailable without package upgrade.
- Significant performance gain (measured).
- Major code reduction with equal or better readability.
- New capability not feasible with current stack in reasonable effort.

## 6. Upgrade Policy

### 6.1 Safe path

1. Update one ecosystem group at a time.
2. Keep lockfile in sync.
3. Run build and smoke test after update.
4. Document breaking changes in PR notes.

### 6.2 Required checks after updates

- `npm install`
- `npm run build`
- `npm run dev`
- Welcome screen animation and main landing sections render correctly.

## 7. Node and Package Manager Baseline

- Package manager: `npm` (lockfile is authoritative)
- Recommended Node LTS: `20.x` or `22.x`
- Command standard:

```bash
npm install
npm run dev
npm run build
```

## 8. Dependency Decision Template (for AI output)

Use this template when proposing a new package:

```md
Dependency Proposal: <package-name>
Reason: <feature gap>
Alternatives considered: <existing stack options>
Bundle/runtime impact: <expected>
Rollback plan: <how to revert>
```

If any field is missing, the proposal is incomplete.

## 9. Definition of Done (Dependencies)

- `package.json` and `package-lock.json` are both updated.
- Build succeeds on clean install.
- No duplicate ecosystem tools introduced.
- Added package usage appears in source code, not dead dependency.
