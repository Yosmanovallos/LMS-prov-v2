# Realistic Sample Data for Manager & Learner Views — Design

**Date:** 2026-07-07
**Goal:** Populate the Provana LMS demo with realistic, internally consistent sample data so the Manager and Learner views feel like a production LMS instead of an empty wireframe. Data-only change: no view or logic code is modified except the simulated-date constant and the existing hardcoded progress/date maps (which are data expressed in code).

## Scope decision

**Demo-focused depth** (user-selected): richly populate the paths that appear in Learner/Manager flows (QA, Developer, BA, BI, RPA — ~70 resources total) and give the remaining 5 paths (Architect, IT, Case Manager, Legal, PM) a light but credible fill (4–6 resources each) so Explore never looks empty.

## Approach

Pure data enrichment inside the `state` seed block of `Provana LMS.dc.html` (approach chosen over a per-user progress refactor or an external generator to keep zero regression risk). All derived UI — hero stats, todo grouping, manager averages, badge counts — recomputes from the same seed, so consistency is automatic wherever the app already derives values.

## Key architectural facts the data must respect

- Learner view is hardcoded to user `u1` (Yolanda Ortega). `learnerPathResources(pathId)` filters `courseId === pathId && level === <u1's level for that path>`, so only resources at her exact level appear in ToDo / Active Learning / History / Certificates.
- Resource `status`, `progress`, `score`, `completedDate`, `hasCert` are **global per resource** and effectively represent Yolanda's state. Other learners' progress comes from hardcoded maps in `enrollments()` and `enrollmentRows`.
- `courseProgress(courseId)` = completed / total across **all levels** of a path; it drives Yolanda's home-screen primary progress and her row in Manager screens.
- Manager "team" = all users with `role:'Learner'` (not filtered by managerId).
- At-risk = progress < 40 and not completed. Overdue = `not-started` with `dueDate` before `TODAY`.
- `homologs()` (evidence approvals) only yields rows whose mapped resource is currently `status:'waiting'` and not auto-validated.
- `TODAY` constant drives due/overdue math and date labels.

## 1. Cast & assignments

- **Yolanda Ortega (u1)** gains `secondaryPaths:[{pathId:'dev', level:'Junior Dev'}]` — lights up path pills, path landing cards, and home secondary-progress card.
- **Two new learners** for a team of 8 with varied states:
  - `u9` Valentina Rios — BI path, `BI Analyst` level, manager m1, steady performer (~55%).
  - `u10` Javier Morales — Case Manager path, `Junior CM` level, manager m2, barely started (~8%) → feeds at-risk widget.
- Existing users keep their paths; their hardcoded progress numbers get re-tuned (see §4).

## 2. Resource catalog (~75 resources)

Per-path structure (levels must match users' assigned level strings exactly):

| Path | Levels | Approx. resources | Purpose |
|---|---|---|---|
| QA | Junior QA, Mid-Level QA, Senior QA, QA Lead | ~30 (14 at Senior QA) | Yolanda's primary; full depth |
| Developer | Junior Dev, Mid-Level Dev, Senior Dev | ~12 (7 at Junior Dev) | Yolanda's secondary; Mateo's primary |
| Business Analyst | Junior BA, Senior BA | ~7 | Sofia's primary |
| Business Intelligence | BI Analyst, Senior BI | ~7 | Lucia's secondary, Valentina's primary |
| RPA Developer | Junior RPA, Senior RPA | ~6 | Diego's primary |
| Architect / IT / Case Manager / Legal / PM | 2 levels each | 4–6 each | Explore credibility |

**Yolanda's Senior QA view (14 resources):**
- 4 `not-started` across 3 modules (one with due date ~1 week out) → ToDo list grouped by module.
- 3 `in-progress` (progress 35–80, `lastActivity`, `remaining`) → Active Learning.
- 2 `waiting` (evidence submitted) → Active Learning "awaiting validation" + manager approvals queue.
- 5 `completed` (scores 76–98, completedDates spread Feb–Jun 2026, 3 with `hasCert:true`) → History + Certificates.

**Yolanda's Junior Dev view (7 resources):** 4 `not-started`, 2 `in-progress`, 1 `completed` with cert — a believable "recently added secondary path".

**Other QA levels tell Yolanda's back-story and set her derived progress.** `courseProgress('qa')` counts completed/total across all QA levels, so: Junior QA and Mid-Level QA resources are mostly `completed` (she passed through them; completedDates in Jan–Mar 2026), QA Lead mostly `not-started` (her future). Counts chosen so overall QA progress lands ≈ 55–65% ("On Track" in manager view). Non-QA, non-Junior-Dev resources stay mostly `not-started`.

**One overdue item:** a `not-started` QA resource (level Junior QA — visible to manager at-risk logic via due-date sort, not in Yolanda's list) with `dueDate` before 2026-07-07. Plus one Senior QA item due within days for urgency in Yolanda's ToDo.

Titles/platforms/skills follow existing catalog conventions (Udemy/Coursera/LinkedIn Learning/Pluralsight/Microsoft Learn/YouTube/Internal; real-sounding course names; skills drawn from/extending the `skills` list). New skills referenced by resources get added to `skills`.

## 3. Dates & numbers

- `TODAY` → `'2026-07-07'`.
- Completed dates spread 2026-01 → 2026-06 so History reads like six months of activity.
- Due dates spread 2026-07-02 (overdue) → 2026-08-10.
- Scores 76–98; durations 1h–12h; points 30–140, consistent with existing scale.

## 4. Manager view data

- `enrollments()` progress map & `enrollmentRows` map re-tuned (both must match): u2 47, u3 22, u4 6, u6 71, u8 89, u9 55, u10 8. Yolanda's stays derived (`courseProgress('qa')`), and QA counts are chosen so it lands ≈ 55–65%.
- The home-screen secondary-path progress map (`{qa:35,ba:20,bi:60,rpa:45,dev:50}` in `vLearner`) is re-tuned so `dev` equals the value the path-landing card derives for Junior Dev (1 completed of 7 ≈ 14%) — home card and landing card must agree.
- `since` / `last` maps extended for u9/u10; `last` values range Today → 3 weeks ago.
- `homologs()` evidence queue: ~3 rows pointing at resources that are genuinely `status:'waiting'` (two of Yolanda's Senior QA waiting items + one from Lucia).
- `homologRequests` seed: 2 `pending` (Yolanda + one other learner), 1 `approved`, 1 `rejected` (with managerNote) so learner homolog history shows all badge styles.

## 5. Ambient realism

- `notifications` (~7) rewritten to reference real catalog items and dates consistent with §2–3.
- Certificates: every completed resource on a certificate-mode platform (Udemy/Coursera/LinkedIn/Pluralsight) with completed status gets `hasCert:true`; YouTube/Internal completions don't.
- `courses[].learners` counts adjusted to match the enriched team (e.g., QA 31, Dev 8, BI 4, CM 7).

## Consistency invariants (checklist for implementation & review)

1. Every `level` string on a resource matches a level string used by at least one user assignment or existing wizard data.
2. Every user's `primaryLevel`/secondary `level` has ≥ 1 resource at that path+level (no empty learner views).
3. `homologs()` map entries reference resources whose `status === 'waiting'` and non-auto platform.
4. `homologRequests` reference real resourceIds/pathIds; pending ones aren't for completed resources.
5. Notification texts reference titles that exist in `resources`.
6. Certificates count in Yolanda's Certificates screen = completed `hasCert` items at her path+level.
7. Both hardcoded progress maps (in `enrollments()` and `enrollmentRows`) contain identical numbers.
8. Skills named on resources exist in `skills`.
9. Home secondary-path progress map value for `dev` equals the derived Junior Dev landing-card percentage.
10. `courseProgress('qa')` (completed/total across all QA resources) lands between 55 and 65.

## Out of scope

- Per-user progress modeling, backend/persistence, admin-side wizard seed data changes, visual/UI changes.
