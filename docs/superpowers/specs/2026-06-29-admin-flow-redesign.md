# Provana LMS — Admin Flow Redesign Spec
**Date:** 2026-06-29 · **Status:** Approved for implementation · **Scope:** Admin view only (HTML prototype)

---

## 1. Core Decision

Remove "Courses" from the admin sidebar. **Paths is the top-level entity.** A "Path" is the full learning program for a role (what was previously called "Course": Senior QA, Junior QA, etc.). Learning sub-paths (Technical Path, Compliance Path) are now called **Levels** in the sidebar hierarchy — but in the UI they are labeled "Learning Paths" inside a Path, keeping the original terminology visible as a grouping label, not a nav entity.

Hierarchy in the sidebar:
```
CONTENT
  ◉  Paths       ← top-level programs (was "Courses")
  ◎  Levels      ← progression levels within each Path
  ◎  Modules     ← topic groupings within each Level
  ◎  Resources   ← global reusable resource pool
  ◎  Skills      ← global skills catalog
```

---

## 2. Design System Constraints (non-negotiable)

- Brand: `--brand: #4A2E80`, `--brand-soft`, same color palette
- Font: Inter, same weights (400–800)
- Cards: `border-radius: 16–18px`, `box-shadow: var(--shadow)`, `border: 1px solid var(--border)`
- Tables: same grid-based rows, hover state implied
- Buttons: same primary (brand bg, white text) / secondary (surface-2 bg, border) styles
- Badges: same pill style (`border-radius: 20px`, small font, `font-weight: 700`)
- Spacing: same 14–22px padding in cards, 16–18px gap in grids
- No new colors introduced. No new component patterns. Everything uses existing CSS vars.

---

## 3. Sidebar Changes

### Before
```
CONTENT: Courses · Resource Library · Skills Catalog
```

### After
```
CONTENT
  Paths          ← icon: map/route
  Levels         ← icon: layers stack
  Modules        ← icon: grid/box
  Resources      ← icon: book (existing)
  Skills         ← icon: award (existing)

PEOPLE: Users · Enrollments (unchanged)
GOVERNANCE: Homologations · Platform Rules (unchanged)
SETTINGS: Platforms (unchanged)
```

The "Course Builder" wizard screen is **removed**. Replaced by the individual section flows below.

---

## 4. Paths Screen (`screen: 'paths'`)

**Purpose:** List all top-level learning programs. Create / edit them here.

### Layout
- Header row: title "Paths" + count label + `[+ New Path]` button (brand primary)
- Grid: 3 columns of cards (same as current Courses grid)

### Path Card
```
┌──────────────────────────────────────────────────┐
│  [gradient header: color + icon]    [PUBLISHED]  │
│                                                  │
│  Senior QA Engineer                              │
│  Advanced automation, performance and QA.        │
│                                                  │
│  3 Levels  ·  12 Resources  ·  6 Learners        │
│                                                  │
│  [Edit]                    [View Levels →]       │
└──────────────────────────────────────────────────┘
```

Fields shown on card: name, description, status badge, level count, resource count, learner count.

### "New Path" action
Opens a **modal overlay** (not a new screen). Fields:
- Path name (text input)
- Description (textarea)
- Color theme (swatches — same 10 colors as current wizard)
- Icon (icon picker — same options)
- Target job role (select — optional, enables auto-enrollment)
- Status toggle: Draft / Published

Save → modal closes, card appears in grid. No navigation away.

### "View Levels →" action
Sets `screen: 'levels'` with `filterPath: pathId`. Shows Levels filtered to this path with breadcrumb.

### "Edit" action
Opens same modal pre-filled with current values.

---

## 5. Levels Screen (`screen: 'levels'`)

**Purpose:** See and manage all progression levels, filterable by Path. Levels belong to a Path and contain Modules.

### Layout
- Filter bar at top: `[All Paths ▾]` dropdown (shows path name + color dot)
- If filtered: breadcrumb strip: `Senior QA Engineer → Technical Path` with `× Clear` to reset
- Header row: "Levels" + count + `[+ New Level]` button
- **Table** (not cards — levels are data, not programs)

### Table columns
```
Level name | Path (badge) | Completion Rule | Modules | Resources | Actions
```

- **Path badge**: colored pill with path name (clickable → filters Levels to that path)
- **Completion Rule**: "All modules" or "Pass 80%" — editable inline (toggle)
- **Modules**: count, clickable → goes to Modules screen filtered to this level
- **Actions**: `[Edit]` `[View Modules →]`

### "New Level" modal
Fields: Level name · Select Path (dropdown with color dots) · Completion rule (toggle)

### Row click
Goes to `screen: 'modules'` with `filterLevel: levelId`

---

## 6. Modules Screen (`screen: 'modules'`)

**Purpose:** Manage topic groupings. Modules belong to a Level. They contain Resources.

### Layout
- Filter bar: `[All Paths ▾]` → `[All Levels ▾]` (cascading — selecting a path filters the levels dropdown)
- If filtered: breadcrumb: `Senior QA → Technical Path → Foundational` with `× Clear`
- Header: "Modules" + count + `[+ New Module]`
- **Table**

### Table columns
```
Module name | Level | Path | Resources | Skills (pills, max 3 + "+N") | Actions
```

- **Level** text (clickable → filters Levels screen)
- **Path** badge (colored pill, clickable → filters Paths)
- **Resources count**: clickable → goes to Resources filtered to this module
- **Skills pills**: top 3 skills used across resources in this module
- **Actions**: `[Edit]` `[View Resources →]`

### "New Module" modal
Fields: Module name · Select Path (dropdown) → Select Level (cascades from Path) · Optional description

---

## 7. Resources Screen (`screen: 'resources'`) — improved

**Purpose:** Global pool of all reusable resources. Resources belong to one or more Modules.

### Layout
- Filter bar: `[All Platforms ▾]` `[All Skills ▾]` `[All Modules ▾]`
- If filtered by module: breadcrumb `Senior QA → Technical → Foundational → Playwright`
- Header: "Resources" + count + `[+ Add Resource]`
- **Table** (same as current, improved)

### Table columns
```
Resource | Platform (badge) | Skills (pills) | Duration | Used in | Homologation | Actions
```

- **"Used in"**: "3 modules" badge — click opens **inline popover** listing the modules (with their Path and Level context)
- **Skills pills**: clickable → filters Skills screen
- **Actions**: `[Edit]` `[×]` delete

### "Add Resource" modal (improved from current)
Fields: Title · URL (platform auto-detected from domain) · Duration · Points · Homologation (auto-locked if YouTube) · Skills (multi-select autocomplete from Skills catalog) · Assign to Module (optional, multi-select)

---

## 8. Skills Screen (`screen: 'skills'`) — unchanged

Grid of skill cards (existing). Each card: skill name + # Resources + # Learners. `[+ Add Skill]` opens modal. No structural changes needed.

---

## 9. Navigation Connections (the "conexión")

Every entity screen exposes **three navigation paths**:

| From | Upward (parent) | Downward (child) | Cross (sibling) |
|---|---|---|---|
| Paths | — | "View Levels →" | — |
| Levels | Path badge (→ Paths filtered) | "View Modules →" | — |
| Modules | Level text + Path badge | "View Resources →" | Skills pills (→ Skills) |
| Resources | Module badge in popover | — | Skills pills (→ Skills) |
| Skills | — | — | Resources count (→ Resources filtered) |

Breadcrumb at top of filtered screens: `[Path name] → [Level name] → [Module name]` — each segment is clickable and resets the filter to that parent.

---

## 10. Screens Removed / Replaced

| Old screen | New handling |
|---|---|
| `screen: 'courses'` | Replaced by `screen: 'paths'` |
| `screen: 'builder'` (5-step wizard) | Replaced by modals on each entity screen |
| Resource Library (existing) | Improved Resources screen (same screen key `'resources'`) |

---

## 11. State additions needed

```js
// New screens
screen: 'paths' | 'levels' | 'modules' | 'resources' | 'skills' | ...

// Filter state (for cross-navigation)
filterPath: null | pathId
filterLevel: null | levelId
filterModule: null | moduleId

// New data derived from existing resources array
// paths = derived from courses (courseId → path record)
// levels = derived from unique (courseId, path) combinations  
// modules = derived from unique (courseId, path, level, module) combinations
```

All derived from the existing `resources[]` and `courses[]` arrays — no new seed data required.

---

## 12. What does NOT change

- Overall chrome (sidebar shell, topnav, search, notifications, theme toggle, "View as" switcher)
- Manager screens (team, progress, approvals)
- Learner screens (mylearning, explore, course page)
- Homologations, Platform Rules, Platforms, Users, Enrollments screens
- All CSS custom properties and design tokens
- The `sc-if` / `sc-for` template engine and React class component pattern
