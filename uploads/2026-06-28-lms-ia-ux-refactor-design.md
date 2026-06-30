# Provana LMS — Information Architecture & UX Refactor
## Design Specification

**Date:** 2026-06-28  
**Status:** Approved for Implementation  
**Reference LMS platforms analyzed:** EPAM Learn, LinkedIn Learning, Cornerstone, Docebo, Moodle Workplace, TalentLMS, Degreed, 360Learning, Absorb LMS

---

## 1. Cross-Platform Research Summary

Five universal patterns identified across all 9 platforms that drove every decision in this spec:

1. **"Course" (or equivalent) is always the primary admin content entity.** No major LMS uses "Role" as a content container in the navigation.
2. **The learner dashboard always leads with one dominant CTA: "Continue where you left off."** Every top-rated LMS makes this the first visible element.
3. **Skills are a first-class global catalog**, not embedded inside any single course. They connect Resources to career growth.
4. **Governance (approvals, compliance) is always separated from Content in admin nav.** Mixing platform config with approval rules is a known UX anti-pattern.
5. **Free-platform content (YouTube) is never manually approved.** Auto-validation is the universal standard.

---

## 2. New Sidebar Navigation

### Admin Sidebar

```
CONTENT
  ◉  Courses             ← Replaces "Roles". Central hub. Opens Course Builder wizard.
  ◎  Resource Library    ← Global pool of all Resources (reusable across courses).
  ◎  Skills Catalog      ← Global skill list. Replaces Taxonomy completely.

PEOPLE
  ◎  Users               ← Kept. Existing user management table.
  ◎  Enrollments         ← NEW. Who is enrolled in which Course + progress.

GOVERNANCE
  ◎  Homologations       ← Simplified approval queue. YouTube never appears here.
  ◎  Platform Rules      ← Moved from "Platforms & Rules". Governance, not settings.

SETTINGS
  ◎  Platforms           ← Platform registry (name, color, default homologation mode).
```

**Removed permanently:** Taxonomy, Roles. Both are absorbed into the Course Builder and Skills Catalog.

### Manager Sidebar

```
MY TEAM
  ◉  Team Overview       ← Dashboard: completion rate, at-risk, pending approvals.
  ◎  Team Progress       ← Individual learner rows with progress + status.
  ◎  Approvals           ← Evidence review queue scoped to this manager's team.
```

**Removed:** Assign Courses, Roles Overview. Managers monitor and approve — they do not build learning paths.

### Learner Sidebar

```
LEARNING
  ◉  My Learning         ← Completely redesigned. Continue Learning card first.
  ◎  Explore Courses     ← Renamed from "Explore Roles". Full catalog discovery.
```

---

## 3. Entity Relationships

```
COURSE
 │  Name · Description · Color · Icon · Target Job Role
 │  Status: Draft | Published | Archived
 │
 ├──▶ LEARNING PATH  (1..n per Course)
 │     │  Name · Order
 │     │  e.g., "Technical Path", "Compliance Path"
 │     │
 │     └──▶ LEVEL  (1..n per Path)
 │            │  Name · Order · Completion Rule (All modules | Pass X%)
 │            │  e.g., "Foundational", "Intermediate", "Advanced"
 │            │
 │            └──▶ MODULE  (1..n per Level)
 │                   │  Name · Description
 │                   │
 │                   └──▶ RESOURCE  (1..n per Module)
 │                          │  Title · URL · Platform
 │                          │  Duration · Points
 │                          │  Homologation: Required | Optional | Auto
 │                          │
 │                          └──▶ SKILLS  (0..n per Resource, global catalog)
 │
 └──▶ ENROLLMENT  (User ↔ Course)
        Source: Auto (by job role) | Manual
        Progress: % complete · Last activity · Status


RESOURCE LIBRARY  (global, reusable)
  One Resource can live in multiple Modules across multiple Courses.
  Platform tag determines default homologation type.

SKILLS CATALOG  (global, replaces Taxonomy)
  Tagged on Resources.
  Gained by User when Resource is completed + homologated.
  Visible on learner profile and manager team view.

HOMOLOGATION  (per Resource)
  Learner · Resource · Evidence file/link · Status · Approver
  Platform = YouTube/free  →  Auto-validated. No queue entry created.
  Platform = Udemy/Coursera  →  Requires certificate upload → Manager approves.
  Platform = Internal  →  Optional or auto depending on Platform Rule.

USER
  Job Role (from org) → triggers auto-enrollment into matching Course
  Enrollments[] → Courses enrolled in
  Completions[] → Resources finished
  Skills Gained[] → from completed + validated Resources
  Certificates[] → earned at Resource / Level / Course completion
```

---

## 4. Course Builder Wizard (Admin — 5 Steps)

All course authoring happens in a single guided wizard. Informed by Docebo's Learning Plan builder and TalentLMS's course editor.

### Step 1 — Course Identity
- Name, Description
- Color theme + Icon (keep existing swatches from current Role editor — already good)
- Target Job Role: optional dropdown → links to org.JobRole for auto-enrollment

### Step 2 — Learning Paths
- Add one or more named paths (e.g., "Technical Path", "Compliance Path")
- Reorderable by drag
- Paths become tabs in Steps 3 and 4

### Step 3 — Levels (inside each Path tab)
- Add levels with names and order (e.g., "Foundational", "Intermediate", "Advanced")
- Per-level completion rule: "All modules required" or "Pass X% of modules"
- Levels unlock sequentially by default (toggle to open access)

### Step 4 — Modules & Resources (inside each Level)
- Add modules (name, optional description)
- Inside each module: add Resources from Library or create new inline
- Resource inline add: title, URL, platform (auto-detected from URL domain), skills (autocomplete from Skills Catalog), duration, points
- YouTube URLs: homologation auto-set to Auto-validated, non-overridable
- Breadcrumb at top: `Technical Path → Foundational → Test Automation`

### Step 5 — Publish
- Status toggle: Draft / Published
- Auto-enrollment rule: ON/OFF — uses Job Role from Step 1
- Summary preview: X paths · Y levels · Z modules · W resources · V skills
- Actions: [Save as Draft] [Publish Course →]

---

## 5. Full Page Hierarchy

### Admin Pages

| Route | Page | Description |
|---|---|---|
| `/admin/courses` | Course list | Cards: name, icon, color, paths, learners, status. [New Course] → wizard. |
| `/admin/courses/builder` | Course Builder wizard | Steps 1–5 for new course. |
| `/admin/courses/:id/edit` | Course Builder wizard | Pre-filled for editing. |
| `/admin/courses/:id/learners` | Learner enrollment view | Enrollment table filtered to this course. |
| `/admin/resources` | Resource Library | Global pool. Filter: Platform, Skills, Duration, Homologation. [Add Resource]. |
| `/admin/skills` | Skills Catalog | List: skill name, # resources, # learners. [Add Skill]. |
| `/admin/users` | Users | Keep existing table: User, Role, Status, Manager, Actions. |
| `/admin/enrollments` | Enrollments | Table: Learner, Course, Progress %, Source, Since, Status. [Enroll User]. |
| `/admin/homologations` | Homologation queue | Pending approvals. Filter: Resource, Learner, Date. Inline evidence preview. |
| `/admin/governance/platform-rules` | Platform Rules | Rules: Scope, Requirement type, Approver. [Add Rule]. |
| `/admin/settings/platforms` | Platforms | Registry: name, color, default homologation mode. |

### Manager Pages

| Route | Page | Description |
|---|---|---|
| `/manager/team` | Team Overview | Summary cards + at-risk learners + pending approvals + team progress by course. |
| `/manager/team/progress` | Team Progress | Table: Learner, Course, Level, %, Last Active, Status. Click row → learner detail. |
| `/manager/approvals` | Approvals | Scoped evidence queue. Inline preview. [Approve] [Reject + note]. |

### Learner Pages

| Route | Page | Description |
|---|---|---|
| `/learn/my-learning` | My Learning | Continue Learning card (top) → Required → In Progress → Skills Gained → Tabs. |
| `/learn/explore` | Explore Courses | Full catalog grid. Filter: Skill, Level, Platform, Duration. Preview + Request Access. |
| `/learn/course/:id` | Course page | Left: hierarchy tree. Right: resource detail + evidence uploader. |

---

## 6. Admin UX Improvements

### Overview Dashboard (redesigned)

Three zones replacing the current 4-stat + role-grid layout:

**Content Health:** Published Courses · Resources in Library · Skills in Catalog  
**People:** Active Learners · Avg Completion % · Pending Homologations (red badge when >0)  
**Quick Actions:** [+ Build a Course] [+ Add Users] [Review Homologations →]  
**Recent Activity:** Feed of last 10 actions across the platform

### Homologations Page (redesigned)

- Evidence previewed inline — no separate modal
- Approve: one click. Reject: opens mandatory note field
- Overdue badge on items submitted more than 3 days ago
- Explicit note: "YouTube resources are auto-validated and never appear here"
- Status Options section: **removed entirely**

### Resource Library (new)

- Shared global pool — one resource, usable in many courses
- Platform auto-detected from URL domain on paste
- "Used in X courses" badge per resource
- Skills autocomplete from Skills Catalog on add

### Platform Rules (moved to Governance)

- Separated from platform configuration (which stays in Settings → Platforms)
- Rule types: "Require screenshot", "Require certificate PDF", "No evidence needed"
- Apply globally or per-course override

---

## 7. Learner UX Improvements

### My Learning (complete redesign)

**Page structure (top to bottom):**

1. **Continue Learning card** — most prominent element. Shows: current resource title, path + level breadcrumb, progress bar, platform, time remaining, [Continue →] CTA. Zero clicks to resume.
2. **Required Learning** — items with due dates. Visible above the fold. Status: In Progress / Not Started.
3. **My Progress** — one progress bar per Learning Path (not one aggregate %).
4. **Skills Gained** — chips showing skills earned from completed + validated resources.
5. **Tabs (secondary):** Overview | To Do (n) | In Progress | History | Skills | Certificates

### Skills Tab (new inside My Learning)

- Full list of skills: gained (filled bar) vs. not yet started (empty bar)
- Each skill shows which resource it came from
- "Pending validation" state for skills from resources awaiting homologation

### Explore Courses (renamed from Explore Roles)

- Course cards show: name, paths count, resources count, skills chips
- "Assigned" badge on enrolled courses
- "View Course" CTA → opens Course Preview (full hierarchy visible, resources locked)
- "Request Access" button for non-enrolled learners → admin notification

### Course Page (learner view)

- Left panel: Learning Path tree (collapsible) — Path → Level → Module → Resource list with status dots (not started / in progress / completed / awaiting validation)
- Right panel: Selected resource detail — title, platform badge, description, skills it develops, duration, [Open on Platform →]
- Evidence panel (below right, only when homologation = Required): file upload + submit button

---

## 8. Manager UX Improvements

### Team Overview Dashboard

**Summary cards:** Total Learners · Avg Completion % · Pending Approvals (red badge) · At-Risk count  
**At-Risk section:** Learners with required training overdue or due within 7 days — name, course, %, due date  
**Pending Approvals:** First 3 in queue with inline [Approve] [Reject] — "See all" link  
**Team Progress by Course:** Horizontal bar per course, avg %, active count

### Team Progress (replaces both Assign Courses + Roles Overview)

Table columns: Learner · Course · Current Level · % Complete · Last Active · Status  
Status values: On Track / Behind / Inactive / Completed  
Click any row → read-only view of that learner's My Learning page

### Approvals Page

- Scoped to this manager's team only
- Oldest first by default
- Evidence preview inline (image or PDF link)
- Reject requires mandatory note — learner receives this note in their notification

---

## 9. Missing Features to Add (Enterprise Best Practices)

### Tier 1 — Add to Current Prototype

| Feature | Location | Trigger |
|---|---|---|
| In-App Notification Center | Bell icon in top nav. Dropdown with last 10. | New assignment, due soon, evidence decided, level completed, cert earned. |
| Auto-Generated Certificates | Learner Certificates tab. PDF on demand. | Fires at: Resource completed + homologated / Level completed / Course completed. |
| Course Preview (unassigned) | Explore Courses → Course card click | Shows full hierarchy (paths, levels, modules). Resources greyed. [Request Access] button. |
| Global Search | Existing search bar in top nav | Returns: Courses, Resources, Skills grouped by type. |

### Tier 2 — Phase 6+ Per Architecture Plan

| Feature | Location | Value |
|---|---|---|
| Promotion Readiness Indicator | My Learning, below Continue card | Shows % ready for next career level + missing items. Connects to Promotion Engine (core domain in master plan). |
| Leaderboard | New tab in My Learning | Points-based ranking. Period: Weekly/Monthly/Quarterly. Scope: Team/Company. Points never feed readiness %. |
| Assessment / Quiz per Module | Module detail in Course page | Multiple choice, auto-scored, configurable pass threshold. Contributes to readiness when passed. |
| Manager Recognition | Team Progress → "Recognize" button per learner | Opens modal: recognition type + optional note. Awards +200 points. Learner notified. |

---

## 10. Reasoning Index

| Decision | Rationale |
|---|---|
| Rename Roles → Courses | "Role" is HR. "Course" is learning. Moodle, TalentLMS, Cornerstone all use Course as top-level container. |
| Remove Taxonomy | No enterprise LMS has Taxonomy as a nav item. Functionality moves into Course Builder metadata + Skills Catalog. |
| Remove Roles nav item | The Roles page was a list of learning containers. That is now the Courses page. Job Role lives in Course Identity as an optional auto-enrollment link. |
| Skills Catalog standalone | Degreed's core principle: skills are the connective tissue between resources and career growth. Global scope prevents duplication and enables cross-course skill tracking. |
| Resource Library standalone | One resource, reusable across many courses. Cornerstone's Content Library solves exactly this. Prevents duplicating Udemy resources across every course. |
| Platform Rules → Governance | Approval workflows are compliance config, not application settings. Matches Cornerstone's separation of Approval Workflows from Integration Settings. |
| YouTube → Auto-validated, locked | YouTube content is free and publicly verifiable. No enterprise LMS manually approves public video completion. Removes manager queue burden. |
| Status Options removed | Status lifecycle is driven by learner actions + homologation type — it is not configuration. Admins do not manage status labels. |
| Manager view → monitor only | In every enterprise LMS studied, managers monitor and approve. Building learning paths is always an admin/L&D function. Assign Courses conflated both roles. |
| Continue Learning card first | LinkedIn Learning, EPAM Learn, Degreed, TalentLMS all lead with resume-current CTA. Time-to-content is the #1 engagement predictor. |
| Skills Gained on learner dashboard | Degreed thesis: learners stay engaged when they see what they are building, not just completing. Direct feedback loop between effort and outcome. |
| At-Risk learners on manager dashboard | Cornerstone's most-used manager feature. A manager cannot help a learner who is behind if they cannot see who is behind. |
| Enrollment as standalone admin page | Gives admins full enrollment oversight. Matches Docebo's Learning Assignment module. Replaces the need for managers to manually assign courses. |
| Guided wizard for Course Builder | Wizard prevents admins from skipping hierarchy steps (e.g., adding resources before creating levels). Docebo and TalentLMS both validated this over separate entity pages. Context breadcrumb maintains orientation throughout. |

---

## 11. Implementation Notes for Claude Code

### Entity Rename Map

| Old Name | New Name | Scope |
|---|---|---|
| Role (learning container) | Course | Global rename in data + UI |
| Course (individual item) | Resource | Global rename in data + UI |
| Category | Learning Path | Structural — now a child of Course |
| Subject | Level | Structural — now a child of Learning Path |
| Topic | Module | Structural — now a child of Level |
| Taxonomy | Skills Catalog | Replaced entirely — different concept |
| Platforms & Rules | Split: Governance/Platform Rules + Settings/Platforms | Two separate pages |
| Explore Roles | Explore Courses | Label rename |
| My Learning Path | My Learning | Label rename |
| Assign Courses (mgr) | Team Progress | Replaced with read-only monitoring view |
| Roles Overview (mgr) | Team Overview | Replaced with operational dashboard |

### New Components Needed

- `CourseBuilderWizard` — 5-step wizard with step indicator, path tabs, level/module tree
- `ResourceLibrary` — global resource list with platform auto-detection on URL paste
- `SkillsCatalog` — global skill CRUD with usage counts
- `EnrollmentTable` — learner-course enrollment grid with manual enroll action
- `ContinueLearningCard` — hero card on My Learning showing current resource + progress
- `SkillsGainedBar` — horizontal chip list of earned skills with pending state
- `TeamOverviewDashboard` — manager summary cards + at-risk + mini approvals
- `ApprovalQueue` — inline evidence preview with approve/reject actions
- `NotificationDropdown` — bell icon + dropdown with last 10 in-app notifications
- `CoursePreviewPage` — unassigned course view with locked resources + Request Access

### Homologation Simplification Rule

```
IF resource.platform.domain includes "youtube.com"
  THEN resource.homologation = "auto"
  AND homologation type field is read-only (cannot be changed)
  AND no HomologationRecord is created on completion
  AND resource does NOT appear in admin or manager approval queues
ELSE
  homologation type is editable (Required | Optional | Auto)
  HomologationRecord created on evidence submission
  Appears in approval queue for assigned manager
```

### Status Options Section

Remove the "Status Options" panel from Platforms & Rules entirely. It is not configuration. Status is computed:
- `not_started` — enrollment exists, no completions
- `in_progress` — at least one resource completion, not 100%
- `awaiting_validation` — resource completed, homologation evidence submitted, not yet approved
- `completed` — all required resources completed and homologated

These states are derived from data, not configurable by admins.
