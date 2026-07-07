# Realistic Sample Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the Provana LMS demo with realistic, internally consistent sample data across Learner and Manager views, per `docs/superpowers/specs/2026-07-07-realistic-sample-data-design.md`.

**Architecture:** All data lives in the `state` seed block plus a few hardcoded maps inside `Provana LMS.dc.html` (single-file DC app; no backend). A Node verification script (`tools/verify-sample-data.mjs`) extracts the seed from the HTML and asserts every consistency invariant from the spec. It is written first (fails against current data), and each data task shrinks the failure list until all checks pass.

**Tech Stack:** Plain JS object literals inside the HTML file; Node ≥18 for the verification script (no dependencies).

## Global Constraints

- Data-only change: the ONLY non-data code touched is the `TODAY` constant and the existing hardcoded maps (progress, since/last, home-secondary, `homologs()` queue, notifications).
- Simulated today: `TODAY = '2026-07-07'`.
- New resource ids continue the existing sequence: `c31`–`c88`. Never reuse or renumber existing ids.
- Resource objects are written **one per line**, matching the existing single-line style in the file.
- Certificate rule (spec §5): every `completed` resource on Udemy/Coursera/LinkedIn Learning/Pluralsight has `hasCert:true`; completed YouTube/Internal resources never have a cert. (This yields 4 certs at Yolanda's Senior QA level, superseding the spec's "3" estimate.)
- Exactly ONE resource in the whole catalog is overdue (`not-started` with `dueDate` earlier than 2026-07-07): `c10` (dueDate 2026-07-02).
- Target derived numbers: `courseProgress('qa')` = 58 (19 completed / 33 QA resources); Junior Dev landing-card progress = 14 (1/7).
- The file is ~2700 lines; the seed block starts near line 1472 (`state = {`). Use Grep to locate exact anchors before editing — line numbers may drift as tasks add lines.

---

### Task 1: Verification script

**Files:**
- Create: `tools/verify-sample-data.mjs`

**Interfaces:**
- Consumes: `Provana LMS.dc.html` (reads the `state = {...};` block, `TODAY`, and four hardcoded maps via regex).
- Produces: exit 0 + summary line when all invariants hold; exit 1 + a bulleted failure list otherwise. Later tasks run `node tools/verify-sample-data.mjs` as their test.

- [ ] **Step 1: Write the script**

```js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'Provana LMS.dc.html'), 'utf8');

const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

// ---- extract seed state (object literal only; contains no functions) ----
const stateMatch = html.match(/state = (\{[\s\S]*?\n  \})\s*;/);
if (!stateMatch) { console.error('FATAL: could not locate the state block'); process.exit(1); }
const S = new Function('return ' + stateMatch[1])();

const TODAY = (html.match(/TODAY = '(\d{4}-\d{2}-\d{2})'/) || [])[1];
ok(TODAY === '2026-07-07', `TODAY is ${TODAY}, expected 2026-07-07`);

const grabObj = (re, name) => { const m = html.match(re); if (!m) { fail.push('cannot find ' + name); return {}; } return new Function('return ' + m[1])(); };
const enrollMap = grabObj(/courseProgress\('qa'\):\((\{[^}]+\})\[u\.id\]/, 'enrollments() progress map');
const rowsMap = grabObj(/const prog=\((\{[^}]+\})\[u\.id\]/, 'enrollmentRows progress map');
const homeSecMap = grabObj(/const prog=\((\{qa:[^}]+\})\[sp\.pathId\]/, 'home secondary-path map');
const homologsArr = (() => { const m = html.match(/const map=\[([\s\S]*?)\];/); return m ? new Function('return [' + m[1] + ']')() : []; })();

const uById = id => S.users.find(u => u.id === id);
const resFor = (path, level) => S.resources.filter(r => r.courseId === path && r.level === level);
const cnt = list => list.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {});

// Inv 2: every learner assignment (primary + secondary) has >=1 resource at that path+level
for (const u of S.users.filter(u => u.role === 'Learner')) {
  const asg = [];
  if (u.primaryPathId) asg.push([u.primaryPathId, u.primaryLevel]);
  for (const sp of (u.secondaryPaths || [])) asg.push([sp.pathId, sp.level]);
  for (const [p, l] of asg) ok(resFor(p, l).length > 0, `${u.name}: no resources for ${p} / ${l}`);
}

// Explore credibility: every published path has resources
for (const c of S.courses) ok(S.resources.some(r => r.courseId === c.id), `path '${c.id}' has no resources`);

// Cast
ok((uById('u1')?.secondaryPaths || []).length >= 1, 'u1 has no secondary path');
ok(!!uById('u9') && !!uById('u10'), 'u9 (Valentina) / u10 (Javier) missing');

// Yolanda's view distributions (spec section 2)
const sq = cnt(resFor('qa', 'Senior QA'));
ok(sq['not-started'] === 4 && sq['in-progress'] === 3 && sq['waiting'] === 2 && sq['completed'] === 5,
  `Senior QA distribution ${JSON.stringify(sq)}, expected 4 ns / 3 ip / 2 waiting / 5 completed`);
const jd = cnt(resFor('dev', 'Junior Dev'));
ok(jd['not-started'] === 4 && jd['in-progress'] === 2 && jd['completed'] === 1,
  `Junior Dev distribution ${JSON.stringify(jd)}, expected 4 ns / 2 ip / 1 completed`);

// Inv 10: derived QA progress in band
const qaAll = S.resources.filter(r => r.courseId === 'qa');
const qaProg = Math.round(qaAll.filter(r => r.status === 'completed').length / qaAll.length * 100);
ok(qaProg >= 55 && qaProg <= 65, `courseProgress('qa') = ${qaProg}, expected 55-65`);

// Inv 7: hardcoded progress maps agree; u1 row matches derived value
for (const k of Object.keys(enrollMap)) ok(enrollMap[k] === rowsMap[k], `progress maps differ for ${k}: ${enrollMap[k]} vs ${rowsMap[k]}`);
ok(rowsMap.u1 === qaProg, `enrollmentRows u1=${rowsMap.u1} but derived qa progress=${qaProg}`);

// Inv 9: home secondary map 'dev' equals derived Junior Dev progress
const jdAll = resFor('dev', 'Junior Dev');
const jdProg = jdAll.length ? Math.round(jdAll.filter(r => r.status === 'completed').length / jdAll.length * 100) : -1;
ok(homeSecMap.dev === jdProg, `home secondary dev=${homeSecMap.dev} but derived=${jdProg}`);

// Inv 3: evidence-approval queue entries reference genuinely waiting, non-auto resources
const AUTO = ['YouTube', 'Internal'];
for (const h of homologsArr) {
  const r = S.resources.find(x => x.id === h.resId);
  ok(!!r, `homologs ${h.id}: resource ${h.resId} missing`);
  if (r) {
    ok(r.status === 'waiting', `homologs ${h.id}: ${r.id} status '${r.status}', expected 'waiting'`);
    ok(!AUTO.includes(r.platform), `homologs ${h.id}: ${r.id} is on auto platform ${r.platform}`);
  }
  ok(!!uById(h.userId), `homologs ${h.id}: user ${h.userId} missing`);
}
ok(homologsArr.length === 3, `expected 3 evidence-queue entries, found ${homologsArr.length}`);

// Inv 4: homologation requests reference real resources; pending ones aren't completed
for (const q of S.homologRequests) {
  const r = S.resources.find(x => x.id === q.resourceId);
  ok(!!r, `homologRequest ${q.id}: resource ${q.resourceId} missing`);
  if (r) {
    ok(r.courseId === q.pathId, `homologRequest ${q.id}: pathId '${q.pathId}' != resource courseId '${r.courseId}'`);
    if (q.status === 'pending') ok(r.status !== 'completed', `homologRequest ${q.id} pending but resource completed`);
  }
}
ok(S.homologRequests.filter(q => q.status === 'pending').length === 2, 'expected 2 pending homologation requests');
ok(S.homologRequests.some(q => q.status === 'approved') && S.homologRequests.some(q => q.status === 'rejected'),
  'expected at least one approved and one rejected homologation request');

// Inv 5: notification texts reference real catalog titles
const titles = new Set(S.resources.map(r => r.title));
for (const n of S.notifications) {
  const refs = [...n.text.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const tail = n.text.match(/(?:assigned|earned): (.+)$/);
  if (tail) refs.push(tail[1]);
  for (const t of refs) ok(titles.has(t), `notification ${n.id} references unknown title "${t}"`);
}

// Inv 6 / spec section 5: certificate rule
const CERT_PLATFORMS = ['Udemy', 'Coursera', 'LinkedIn Learning', 'Pluralsight'];
for (const r of S.resources.filter(r => r.status === 'completed')) {
  if (CERT_PLATFORMS.includes(r.platform)) ok(r.hasCert === true, `${r.id} completed on ${r.platform} but hasCert !== true`);
  else ok(!r.hasCert, `${r.id} completed on ${r.platform} must not have hasCert`);
}

// Inv 8: skills on resources exist in the skills list
const skillSet = new Set(S.skills.map(s => s.name));
for (const r of S.resources) for (const s of (r.skills || [])) ok(skillSet.has(s), `${r.id} references unknown skill '${s}'`);

// Exactly one overdue not-started resource
const overdue = S.resources.filter(r => r.status === 'not-started' && r.dueDate && r.dueDate < TODAY);
ok(overdue.length === 1, `expected exactly 1 overdue resource, found ${overdue.length}: [${overdue.map(r => r.id).join(', ')}]`);

// Structural sanity
const ids = S.resources.map(r => r.id);
ok(new Set(ids).size === ids.length, 'duplicate resource ids');
for (const r of S.resources) {
  if (r.status === 'completed') ok(typeof r.score === 'number' && !!r.completedDate, `${r.id} completed but missing score/completedDate`);
  if (r.status === 'in-progress') ok(r.progress > 0 && r.progress < 100, `${r.id} in-progress but progress=${r.progress}`);
}

if (fail.length) {
  console.error(`✗ ${fail.length} check(s) failed:`);
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`✓ all sample-data consistency checks passed (${S.resources.length} resources, ${S.users.length} users)`);
```

- [ ] **Step 2: Run it — expect failures against current data**

Run: `node tools/verify-sample-data.mjs`
Expected: exit 1 with failures including (at least): `TODAY is 2026-06-29…`, `Lucia Fernandez: no resources for bi / BI Analyst`, `path 'bi' has no resources` (and arch/it/cm/legal/pm), `u1 has no secondary path`, `u9 (Valentina) / u10 (Javier) missing`, `Senior QA distribution …`, `courseProgress('qa') = 24…`, `expected 2 pending homologation requests`.

- [ ] **Step 3: Commit**

```bash
git add tools/verify-sample-data.mjs
git commit -m "test: consistency verifier for LMS sample data"
```

---

### Task 2: Cast, skills, TODAY, course counts

**Files:**
- Modify: `Provana LMS.dc.html` — `users` array (~line 1500), `skills` array (~1522), `courses` array (~1510), `TODAY` (~1582)

**Interfaces:**
- Produces: users `u9`/`u10`; u1 `secondaryPaths:[{pathId:'dev',level:'Junior Dev'}]`; skills `sk19`–`sk39` (exact names below, used by Tasks 3–5); `TODAY='2026-07-07'`.

- [ ] **Step 1: Give Yolanda her secondary path.** In the `users` array, change u1's `secondaryPaths:[]` to:

```js
secondaryPaths:[{pathId:'dev',level:'Junior Dev'}]
```

- [ ] **Step 2: Add the two new learners** after the `u8` line:

```js
      { id:'u9',  name:'Valentina Rios',   email:'valentina.rios@provana.com',   role:'Learner',  status:'Active',   managerId:'m1', primaryPathId:'bi',  primaryLevel:'BI Analyst',    secondaryPaths:[] },
      { id:'u10', name:'Javier Morales',   email:'javier.morales@provana.com',   role:'Learner',  status:'Active',   managerId:'m2', primaryPathId:'cm',  primaryLevel:'Junior CM',     secondaryPaths:[] }
```

(Add a trailing comma to the `u8` line.)

- [ ] **Step 3: Extend the `skills` array.** Append after `{id:'sk18',name:'Manual Testing'}` (keep the existing 4-per-line formatting style):

```js
      {id:'sk19',name:'JavaScript'},{id:'sk20',name:'Accessibility'},{id:'sk21',name:'Mobile Testing'},{id:'sk22',name:'Web Development'},
      {id:'sk23',name:'Software Design'},{id:'sk24',name:'Architecture'},{id:'sk25',name:'Power BI'},{id:'sk26',name:'Data Visualization'},
      {id:'sk27',name:'Tableau'},{id:'sk28',name:'Data Modeling'},{id:'sk29',name:'Networking'},{id:'sk30',name:'IT Operations'},
      {id:'sk31',name:'Communication'},{id:'sk32',name:'Case Management'},{id:'sk33',name:'Compliance'},{id:'sk34',name:'Legal Research'},
      {id:'sk35',name:'Project Management'},{id:'sk36',name:'Agile'},{id:'sk37',name:'Risk Management'},{id:'sk38',name:'Process Modeling'},
      {id:'sk39',name:'Data Analysis'}
```

- [ ] **Step 4: Bump learner counts in `courses`.** Change `ba` learners `5`→`6`, `bi` `3`→`4`, `dev` `7`→`8`, `cm` `6`→`7`, `qa` `29`→`31`. Leave the rest.

- [ ] **Step 5: Bump the simulated date.** Change `TODAY = '2026-06-29';` to `TODAY = '2026-07-07';`

- [ ] **Step 6: Run the verifier — cast/date failures gone**

Run: `node tools/verify-sample-data.mjs`
Expected: still exit 1, but no longer lists `TODAY…`, `u1 has no secondary path`, or `u9/u10 missing`. New expected failures appear: `Yolanda Ortega: no resources for dev / Junior Dev`, `Valentina Rios: no resources for bi / BI Analyst`, `Javier Morales: no resources for cm / Junior CM`, `home secondary dev=50 but derived=-1`.

- [ ] **Step 7: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: sample-data cast — Yolanda secondary path, two new learners, skills, TODAY"
```

---

### Task 3: QA catalog — Yolanda's story

**Files:**
- Modify: `Provana LMS.dc.html` — `resources` array, QA entries `c2`–`c26` region (~lines 1545–1574) and new entries appended after `c21`

**Interfaces:**
- Consumes: skill names from Task 2.
- Produces: QA totals — Junior QA 8 (7 completed, 1 overdue ns), Mid-Level QA 5 (4 completed, 1 waiting `c16`), Senior QA 14 (4 ns / 3 ip / 2 waiting `c6`,`c35` / 5 completed), QA Lead 6 (3 completed, 3 ns). 19/33 completed → 58%. Resources `c35` and `c6` stay `waiting` (Task 6's queue references them); `c34` stays `not-started` and `c7` stays pending-eligible (Task 6's homologRequests reference them).

- [ ] **Step 1: Update existing QA resource lines.** Replace each of these lines in full (only changed fields differ from current; each keeps its id and position):

```js
      { id:'c2', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'Playwright', platform:'Udemy', title:'Playwright Advanced Patterns', link:'https://www.udemy.com/course/playwright-adv/', status:'in-progress', homolog:'optional', duration:'7h 0m', points:110, description:'Fixtures, sharding and visual testing at scale.', evidence:null, skills:['Playwright','Test Automation'], progress:65, lastActivity:'Yesterday', remaining:'2h 30m left' },
      { id:'c3', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'Cypress', platform:'Coursera', title:'Cypress Advanced', link:'https://www.coursera.org/learn/cypress-adv/', status:'in-progress', homolog:'optional', duration:'8h 0m', points:110, description:'Component testing, network stubbing and CI integration.', evidence:null, skills:['Cypress','Test Automation'], progress:35, lastActivity:'3 days ago', remaining:'5h left' },
      { id:'c7', courseId:'qa', path:'Technical Path', level:'QA Lead', module:'Performance', platform:'Udemy', title:'Performance Testing with JMeter', link:'https://www.udemy.com/course/jmeter/', status:'not-started', homolog:'required', duration:'9h 0m', points:120, description:'Load and stress testing fundamentals with Apache JMeter.', evidence:null, skills:['Performance Testing'], progress:0, dueDate:'2026-07-21' },
      { id:'c9', courseId:'qa', path:'Compliance Path', level:'QA Lead', module:'ISTQB', platform:'Internal', title:'ISTQB Advanced Test Analyst', link:'#', status:'completed', homolog:'required', duration:'12h 0m', points:140, description:'Advanced-level certification track for senior test analysts.', evidence:'istqb-advanced.pdf', skills:['QA Strategy'], score:81, completedDate:'2026-06-05' },
      { id:'c10', courseId:'qa', path:'Compliance Path', level:'Junior QA', module:'Security', platform:'Microsoft Learn', title:'Security Testing Essentials', link:'https://learn.microsoft.com/security-testing/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'OWASP basics and security testing for QA engineers.', evidence:null, skills:['Security Testing'], progress:0, dueDate:'2026-07-02' },
      { id:'c12', courseId:'qa', path:'Leadership Path', level:'Senior QA', module:'Strategy', platform:'Coursera', title:'Building a QA Strategy', link:'https://www.coursera.org/learn/qa-strategy/', status:'in-progress', homolog:'optional', duration:'5h 0m', points:90, description:'Define quality goals, metrics and a test approach.', evidence:null, skills:['QA Strategy','Leadership'], progress:80, lastActivity:'Today', remaining:'1h left' },
      { id:'c13', courseId:'qa', path:'Technical Path', level:'Junior QA', module:'Test Cases', platform:'Udemy', title:'Writing Effective Test Cases', link:'https://www.udemy.com/course/test-cases/', status:'completed', homolog:'optional', duration:'4h 0m', points:60, description:'Crafting clear, maintainable manual test cases.', evidence:'test-cases-cert.pdf', skills:['Manual Testing'], score:88, completedDate:'2026-01-15', hasCert:true },
      { id:'c14', courseId:'qa', path:'Technical Path', level:'Junior QA', module:'SDLC', platform:'YouTube', title:'Intro to the SDLC', link:'https://www.youtube.com/watch?v=sdlc', status:'completed', homolog:'auto', duration:'1h 0m', points:30, description:'Overview of the software development lifecycle.', evidence:null, skills:['Manual Testing'], score:100, completedDate:'2026-01-10' },
      { id:'c15', courseId:'qa', path:'Soft Skills Path', level:'Junior QA', module:'Reporting', platform:'LinkedIn Learning', title:'Bug Reporting 101', link:'https://www.linkedin.com/learning/bug-reporting/', status:'completed', homolog:'optional', duration:'2h 0m', points:40, description:'Writing actionable, reproducible bug reports.', evidence:'bug-reporting-badge.png', skills:['Manual Testing'], score:90, completedDate:'2026-02-02', hasCert:true },
      { id:'c17', courseId:'qa', path:'Technical Path', level:'Mid-Level QA', module:'Databases', platform:'LinkedIn Learning', title:'SQL Fundamentals', link:'https://www.linkedin.com/learning/sql/', status:'completed', homolog:'optional', duration:'4h 0m', points:70, description:'Core SQL queries for test data validation.', evidence:'sql-fundamentals-badge.png', skills:['SQL'], score:85, completedDate:'2026-02-08', hasCert:true },
      { id:'c18', courseId:'qa', path:'Compliance Path', level:'Mid-Level QA', module:'ISTQB', platform:'Udemy', title:'ISTQB Foundation Level', link:'https://www.udemy.com/course/istqb/', status:'completed', homolog:'required', duration:'12h 0m', points:120, description:'Foundation-level ISTQB certification prep.', evidence:'istqb-foundation.pdf', skills:['QA Strategy'], score:82, completedDate:'2026-03-15', hasCert:true },
      { id:'c21', courseId:'qa', path:'Soft Skills Path', level:'QA Lead', module:'Stakeholders', platform:'LinkedIn Learning', title:'Stakeholder Management', link:'https://www.linkedin.com/learning/stakeholders/', status:'completed', homolog:'optional', duration:'4h 0m', points:70, description:'Managing expectations across stakeholders.', evidence:'stakeholder-badge.png', skills:['Leadership'], score:79, completedDate:'2026-05-30', hasCert:true },
      { id:'c26', courseId:'ba', path:'Technical Path', level:'Junior BA', module:'Requirements', platform:'Coursera', title:'Requirements Engineering', link:'https://www.coursera.org/learn/requirements/', status:'not-started', homolog:'required', duration:'7h 0m', points:90, description:'Eliciting and documenting clear requirements.', evidence:null, skills:['Requirements Analysis'] },
```

Leave `c1`, `c4`, `c5`, `c6`, `c8`, `c11`, `c16`, `c19`, `c20`, `c22`–`c25`, `c27`–`c30` untouched in this task.

- [ ] **Step 2: Insert the new QA resources** after the `c21` line (before `c22`):

```js
      { id:'c31', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'Performance', platform:'Udemy', title:'Grafana k6 Load Testing', link:'https://www.udemy.com/course/k6-load-testing/', status:'not-started', homolog:'required', duration:'6h 0m', points:90, description:'Scriptable load testing with Grafana k6 and CI integration.', evidence:null, skills:['Performance Testing','CI/CD'], progress:0, dueDate:'2026-07-14' },
      { id:'c32', courseId:'qa', path:'Compliance Path', level:'Senior QA', module:'Security', platform:'Microsoft Learn', title:'OWASP Top 10 for Testers', link:'https://learn.microsoft.com/owasp-top10/', status:'not-started', homolog:'optional', duration:'4h 0m', points:70, description:'Recognizing and testing for the OWASP Top 10 vulnerabilities.', evidence:null, skills:['Security Testing'], progress:0, dueDate:'2026-07-28' },
      { id:'c33', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'CI/CD', platform:'LinkedIn Learning', title:'Test Automation in GitHub Actions', link:'https://www.linkedin.com/learning/github-actions-testing/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'Running automated test suites in GitHub Actions pipelines.', evidence:null, skills:['CI/CD','Test Automation'], progress:0, dueDate:'2026-08-10' },
      { id:'c34', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'CI/CD', platform:'Pluralsight', title:'Quality Gates with SonarQube', link:'https://www.pluralsight.com/courses/sonarqube/', status:'not-started', homolog:'required', duration:'4h 0m', points:70, description:'Enforcing code quality gates with SonarQube in CI.', evidence:null, skills:['CI/CD'], progress:0 },
      { id:'c35', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'Mobile', platform:'Udemy', title:'Mobile Testing with Appium', link:'https://www.udemy.com/course/appium/', status:'waiting', homolog:'required', duration:'7h 0m', points:100, description:'Automating Android and iOS tests with Appium.', evidence:'appium-cert.pdf', skills:['Mobile Testing','Test Automation'], progress:100, lastActivity:'5 days ago' },
      { id:'c36', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'REST APIs', platform:'Pluralsight', title:'Contract Testing with Pact', link:'https://www.pluralsight.com/courses/pact/', status:'completed', homolog:'optional', duration:'5h 0m', points:90, description:'Consumer-driven contract testing for microservices.', evidence:'pact-cert.pdf', skills:['API Testing','Test Automation'], score:89, completedDate:'2026-05-14', hasCert:true },
      { id:'c37', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'Test Design', platform:'Udemy', title:'Exploratory Testing Masterclass', link:'https://www.udemy.com/course/exploratory-testing/', status:'completed', homolog:'optional', duration:'4h 0m', points:70, description:'Charters, heuristics and session-based test management.', evidence:'exploratory-cert.pdf', skills:['Manual Testing','QA Strategy'], score:84, completedDate:'2026-04-03', hasCert:true },
      { id:'c38', courseId:'qa', path:'Compliance Path', level:'Senior QA', module:'Accessibility', platform:'Coursera', title:'Accessibility Testing Fundamentals', link:'https://www.coursera.org/learn/a11y-testing/', status:'completed', homolog:'required', duration:'5h 0m', points:80, description:'WCAG 2.2 auditing with assistive technologies.', evidence:'a11y-cert.pdf', skills:['Accessibility','Manual Testing'], score:92, completedDate:'2026-03-21', hasCert:true },
      { id:'c39', courseId:'qa', path:'Technical Path', level:'Senior QA', module:'Test Design', platform:'YouTube', title:'Bug Triage & Root Cause Analysis (talk)', link:'https://www.youtube.com/watch?v=bug-triage', status:'completed', homolog:'auto', duration:'1h 0m', points:30, description:'Conference talk on triaging defects and finding root causes.', evidence:null, skills:['Manual Testing'], score:100, completedDate:'2026-06-10' },
      { id:'c40', courseId:'qa', path:'Technical Path', level:'Mid-Level QA', module:'Databases', platform:'Pluralsight', title:'Test Data Management', link:'https://www.pluralsight.com/courses/test-data/', status:'completed', homolog:'optional', duration:'5h 0m', points:80, description:'Designing and maintaining reliable test data sets.', evidence:'tdm-cert.pdf', skills:['SQL'], score:87, completedDate:'2026-03-10', hasCert:true },
      { id:'c41', courseId:'qa', path:'Technical Path', level:'Mid-Level QA', module:'Agile', platform:'Coursera', title:'Agile Testing Practices', link:'https://www.coursera.org/learn/agile-testing/', status:'completed', homolog:'optional', duration:'6h 0m', points:90, description:'Testing inside Scrum: sprints, DoD and continuous feedback.', evidence:'agile-testing-cert.pdf', skills:['Manual Testing','QA Strategy'], score:91, completedDate:'2026-02-25', hasCert:true },
      { id:'c43', courseId:'qa', path:'Technical Path', level:'Junior QA', module:'SDLC', platform:'YouTube', title:'Git Basics for Testers (talk)', link:'https://www.youtube.com/watch?v=git-basics', status:'completed', homolog:'auto', duration:'1h 0m', points:30, description:'Version-control fundamentals every tester needs.', evidence:null, skills:['Manual Testing'], score:100, completedDate:'2026-01-08' },
```

(Note: there is intentionally no `c42`; ids need not be gapless, and keeping the list stable beats renumbering. The verifier only checks uniqueness.)

- [ ] **Step 3: Run the verifier**

Run: `node tools/verify-sample-data.mjs`
Expected: exit 1, but `Senior QA distribution`, `courseProgress('qa')`, and the certificate-rule failures for QA resources are gone. Remaining failures are about dev/bi/cm/light-fill paths, maps, and homolog data.

- [ ] **Step 4: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: QA sample catalog — full four-level story for Yolanda"
```

---

### Task 4: Developer, BA, BI, RPA catalogs

**Files:**
- Modify: `Provana LMS.dc.html` — `resources` array: update `c24`, append `c44`–`c66` after `c30`

**Interfaces:**
- Consumes: skills from Task 2.
- Produces: Junior Dev = `c24`,`c44`–`c49` (7: 4 ns / 2 ip / 1 completed); `c44` completed 2026-07-06 with cert (Task 6's approved homolog request hreq3 references it); `c46` stays ns (Task 6's pending hreq2 references it). BI Analyst gets 5 resources (feeds u6/u9 assignments).

- [ ] **Step 1: Update `c24`** (full line replacement):

```js
      { id:'c24', courseId:'dev', path:'Technical Path', level:'Junior Dev', module:'Programming', platform:'Udemy', title:'Python for Automation', link:'https://www.udemy.com/course/python-automation/', status:'in-progress', homolog:'optional', duration:'6h 0m', points:85, description:'Python essentials for test automation engineers.', evidence:null, skills:['Python','Test Automation'], progress:40, lastActivity:'Yesterday', remaining:'3h 30m left' },
```

- [ ] **Step 2: Append after the `c30` line:**

```js
      { id:'c44', courseId:'dev', path:'Technical Path', level:'Junior Dev', module:'Programming', platform:'Udemy', title:'JavaScript Essentials', link:'https://www.udemy.com/course/javascript-essentials/', status:'completed', homolog:'required', duration:'8h 0m', points:100, description:'Core JavaScript: types, functions, async and the DOM.', evidence:'js-essentials-cert.pdf', skills:['JavaScript'], score:88, completedDate:'2026-07-06', hasCert:true },
      { id:'c45', courseId:'dev', path:'Technical Path', level:'Junior Dev', module:'Web', platform:'Coursera', title:'HTML & CSS Foundations', link:'https://www.coursera.org/learn/html-css/', status:'in-progress', homolog:'optional', duration:'5h 0m', points:70, description:'Semantic markup and modern CSS layout.', evidence:null, skills:['Web Development'], progress:20, lastActivity:'4 days ago', remaining:'4h left' },
      { id:'c46', courseId:'dev', path:'Technical Path', level:'Junior Dev', module:'Craft', platform:'Udemy', title:'Clean Code Principles', link:'https://www.udemy.com/course/clean-code/', status:'not-started', homolog:'required', duration:'6h 0m', points:90, description:'Naming, functions and refactoring for readable code.', evidence:null, skills:['Software Design'], progress:0, dueDate:'2026-07-25' },
      { id:'c47', courseId:'dev', path:'Technical Path', level:'Junior Dev', module:'Databases', platform:'LinkedIn Learning', title:'SQL for Developers', link:'https://www.linkedin.com/learning/sql-developers/', status:'not-started', homolog:'optional', duration:'4h 0m', points:70, description:'Queries, joins and indexes for application developers.', evidence:null, skills:['SQL'] },
      { id:'c48', courseId:'dev', path:'Technical Path', level:'Junior Dev', module:'Testing', platform:'Pluralsight', title:'Unit Testing with Jest', link:'https://www.pluralsight.com/courses/jest/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'Writing fast, isolated unit tests in Jest.', evidence:null, skills:['Test Automation','JavaScript'] },
      { id:'c49', courseId:'dev', path:'Technical Path', level:'Junior Dev', module:'APIs', platform:'Microsoft Learn', title:'REST API Design Basics', link:'https://learn.microsoft.com/rest-api-design/', status:'not-started', homolog:'optional', duration:'4h 0m', points:70, description:'Resource modeling, verbs and status codes done right.', evidence:null, skills:['API Testing'] },
      { id:'c50', courseId:'dev', path:'Technical Path', level:'Mid-Level Dev', module:'Craft', platform:'Udemy', title:'Design Patterns in Practice', link:'https://www.udemy.com/course/design-patterns/', status:'not-started', homolog:'optional', duration:'7h 0m', points:100, description:'Applying classic GoF patterns to real codebases.', evidence:null, skills:['Software Design'] },
      { id:'c51', courseId:'dev', path:'Technical Path', level:'Senior Dev', module:'Architecture', platform:'Coursera', title:'Microservices Architecture', link:'https://www.coursera.org/learn/microservices/', status:'not-started', homolog:'required', duration:'9h 0m', points:120, description:'Decomposition, resilience and inter-service communication.', evidence:null, skills:['Architecture'] },
      { id:'c52', courseId:'ba', path:'Technical Path', level:'Junior BA', module:'Requirements', platform:'Udemy', title:'User Story Mapping', link:'https://www.udemy.com/course/story-mapping/', status:'not-started', homolog:'optional', duration:'4h 0m', points:70, description:'Slicing releases with collaborative story maps.', evidence:null, skills:['Requirements Analysis'], dueDate:'2026-07-18' },
      { id:'c53', courseId:'ba', path:'Technical Path', level:'Junior BA', module:'Process', platform:'Coursera', title:'BPMN Process Modeling', link:'https://www.coursera.org/learn/bpmn/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'Modeling as-is and to-be processes in BPMN 2.0.', evidence:null, skills:['Process Modeling'] },
      { id:'c54', courseId:'ba', path:'Soft Skills Path', level:'Junior BA', module:'Elicitation', platform:'LinkedIn Learning', title:'Stakeholder Interview Techniques', link:'https://www.linkedin.com/learning/stakeholder-interviews/', status:'not-started', homolog:'optional', duration:'3h 0m', points:60, description:'Preparing and running effective discovery interviews.', evidence:null, skills:['Requirements Analysis','Facilitation'] },
      { id:'c55', courseId:'ba', path:'Technical Path', level:'Senior BA', module:'Analytics', platform:'Coursera', title:'Data-Driven Decision Making', link:'https://www.coursera.org/learn/data-decisions/', status:'not-started', homolog:'optional', duration:'6h 0m', points:90, description:'Framing business questions with quantitative evidence.', evidence:null, skills:['Data Analysis'] },
      { id:'c56', courseId:'bi', path:'Technical Path', level:'BI Analyst', module:'Power BI', platform:'Microsoft Learn', title:'Power BI Fundamentals', link:'https://learn.microsoft.com/power-bi/', status:'not-started', homolog:'optional', duration:'6h 0m', points:90, description:'Reports, datasets and dashboards in Power BI.', evidence:null, skills:['Power BI'] },
      { id:'c57', courseId:'bi', path:'Technical Path', level:'BI Analyst', module:'Power BI', platform:'Udemy', title:'DAX Essentials', link:'https://www.udemy.com/course/dax/', status:'not-started', homolog:'required', duration:'7h 0m', points:100, description:'Measures, calculated columns and evaluation context.', evidence:null, skills:['Power BI','Data Analysis'] },
      { id:'c58', courseId:'bi', path:'Technical Path', level:'BI Analyst', module:'Databases', platform:'LinkedIn Learning', title:'SQL for Data Analysis', link:'https://www.linkedin.com/learning/sql-data-analysis/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'Window functions and aggregations for analysts.', evidence:null, skills:['SQL','Data Analysis'] },
      { id:'c59', courseId:'bi', path:'Technical Path', level:'BI Analyst', module:'Visualization', platform:'Coursera', title:'Data Visualization Principles', link:'https://www.coursera.org/learn/dataviz/', status:'not-started', homolog:'optional', duration:'4h 0m', points:70, description:'Choosing chart forms that communicate honestly.', evidence:null, skills:['Data Visualization'] },
      { id:'c60', courseId:'bi', path:'Technical Path', level:'BI Analyst', module:'Tableau', platform:'Pluralsight', title:'Tableau Desktop I', link:'https://www.pluralsight.com/courses/tableau/', status:'not-started', homolog:'optional', duration:'6h 0m', points:90, description:'Connecting data and building interactive views.', evidence:null, skills:['Tableau','Data Visualization'] },
      { id:'c61', courseId:'bi', path:'Technical Path', level:'Senior BI', module:'Modeling', platform:'Udemy', title:'Advanced Data Modeling', link:'https://www.udemy.com/course/data-modeling/', status:'not-started', homolog:'required', duration:'8h 0m', points:110, description:'Star schemas, slowly changing dimensions and grain.', evidence:null, skills:['Data Modeling'] },
      { id:'c62', courseId:'bi', path:'Technical Path', level:'Senior BI', module:'Warehousing', platform:'Coursera', title:'Data Warehouse Design', link:'https://www.coursera.org/learn/data-warehouse/', status:'not-started', homolog:'optional', duration:'7h 0m', points:100, description:'ELT pipelines and warehouse architecture patterns.', evidence:null, skills:['Data Modeling','SQL'] },
      { id:'c63', courseId:'rpa', path:'Technical Path', level:'Junior RPA', module:'UiPath', platform:'Udemy', title:'UiPath Studio Basics', link:'https://www.udemy.com/course/uipath-basics/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'Sequences, selectors and your first attended bot.', evidence:null, skills:['RPA'], dueDate:'2026-07-31' },
      { id:'c64', courseId:'rpa', path:'Technical Path', level:'Junior RPA', module:'Analysis', platform:'Internal', title:'Process Discovery Fundamentals', link:'#', status:'not-started', homolog:'auto', duration:'3h 0m', points:60, description:'Identifying automation candidates and measuring ROI.', evidence:null, skills:['RPA','Process Modeling'] },
      { id:'c65', courseId:'rpa', path:'Technical Path', level:'Senior RPA', module:'UiPath', platform:'Pluralsight', title:'Automation Exception Handling', link:'https://www.pluralsight.com/courses/rpa-exceptions/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'Robust retry, recovery and logging strategies for bots.', evidence:null, skills:['RPA'] },
      { id:'c66', courseId:'rpa', path:'Technical Path', level:'Senior RPA', module:'Orchestrator', platform:'Udemy', title:'Orchestrator Administration', link:'https://www.udemy.com/course/orchestrator/', status:'not-started', homolog:'required', duration:'6h 0m', points:100, description:'Queues, triggers and asset management at scale.', evidence:null, skills:['RPA'] },
```

- [ ] **Step 3: Run the verifier**

Run: `node tools/verify-sample-data.mjs`
Expected: exit 1; `Junior Dev distribution` and the bi/dev assignment failures are gone. Remaining: cm/arch/it/legal/pm empty paths, `Javier Morales: no resources for cm / Junior CM`, map mismatches, homolog counts, notification titles.

- [ ] **Step 4: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: Developer, BA, BI and RPA sample catalogs"
```

---

### Task 5: Light-fill catalogs (Architect, IT, Case Manager, Legal, PM)

**Files:**
- Modify: `Provana LMS.dc.html` — append `c67`–`c88` at the end of the `resources` array (after `c66`, before the closing `],`)

**Interfaces:**
- Consumes: skills from Task 2.
- Produces: every published path has resources; `cm` has `Junior CM` level for u10.

- [ ] **Step 1: Append the light-fill resources:**

```js
      { id:'c67', courseId:'arch', path:'Technical Path', level:'Junior Architect', module:'Foundations', platform:'Coursera', title:'Software Architecture Foundations', link:'https://www.coursera.org/learn/software-architecture/', status:'not-started', homolog:'optional', duration:'6h 0m', points:90, description:'Views, quality attributes and architectural styles.', evidence:null, skills:['Architecture'] },
      { id:'c68', courseId:'arch', path:'Technical Path', level:'Junior Architect', module:'Practices', platform:'YouTube', title:'Architecture Decision Records (talk)', link:'https://www.youtube.com/watch?v=adr-talk', status:'not-started', homolog:'auto', duration:'1h 0m', points:30, description:'Documenting decisions teams can actually revisit.', evidence:null, skills:['Architecture'] },
      { id:'c69', courseId:'arch', path:'Technical Path', level:'Senior Architect', module:'Design', platform:'Udemy', title:'Domain-Driven Design', link:'https://www.udemy.com/course/ddd/', status:'not-started', homolog:'required', duration:'10h 0m', points:130, description:'Bounded contexts, aggregates and strategic design.', evidence:null, skills:['Architecture','Software Design'] },
      { id:'c70', courseId:'arch', path:'Technical Path', level:'Senior Architect', module:'Cloud', platform:'Microsoft Learn', title:'Cloud Architecture on Azure', link:'https://learn.microsoft.com/azure-architecture/', status:'not-started', homolog:'optional', duration:'8h 0m', points:110, description:'Reference architectures and the well-architected framework.', evidence:null, skills:['Architecture'] },
      { id:'c71', courseId:'it', path:'Technical Path', level:'IT Support', module:'Hardware', platform:'Udemy', title:'CompTIA A+ Prep', link:'https://www.udemy.com/course/comptia-a/', status:'not-started', homolog:'required', duration:'12h 0m', points:130, description:'Hardware, OS and troubleshooting for the A+ exam.', evidence:null, skills:['IT Operations'] },
      { id:'c72', courseId:'it', path:'Technical Path', level:'IT Support', module:'Networking', platform:'Coursera', title:'Networking Fundamentals', link:'https://www.coursera.org/learn/networking/', status:'not-started', homolog:'optional', duration:'6h 0m', points:90, description:'TCP/IP, DNS and everyday network debugging.', evidence:null, skills:['Networking'] },
      { id:'c73', courseId:'it', path:'Technical Path', level:'IT Administrator', module:'Servers', platform:'Microsoft Learn', title:'Windows Server Administration', link:'https://learn.microsoft.com/windows-server/', status:'not-started', homolog:'optional', duration:'8h 0m', points:100, description:'Active Directory, group policy and server roles.', evidence:null, skills:['IT Operations'] },
      { id:'c74', courseId:'it', path:'Technical Path', level:'IT Administrator', module:'Process', platform:'Pluralsight', title:'ITIL 4 Foundation', link:'https://www.pluralsight.com/courses/itil4/', status:'not-started', homolog:'required', duration:'7h 0m', points:100, description:'Service management practices and the ITIL value chain.', evidence:null, skills:['IT Operations'] },
      { id:'c75', courseId:'cm', path:'Technical Path', level:'Junior CM', module:'Foundations', platform:'Internal', title:'Case Management Fundamentals', link:'#', status:'not-started', homolog:'auto', duration:'4h 0m', points:70, description:'Intake, assessment and case lifecycle at Provana.', evidence:null, skills:['Case Management'], dueDate:'2026-07-20' },
      { id:'c76', courseId:'cm', path:'Soft Skills Path', level:'Junior CM', module:'Communication', platform:'LinkedIn Learning', title:'Client Communication Skills', link:'https://www.linkedin.com/learning/client-communication/', status:'not-started', homolog:'optional', duration:'3h 0m', points:60, description:'Clear, empathetic communication with clients.', evidence:null, skills:['Communication'] },
      { id:'c77', courseId:'cm', path:'Soft Skills Path', level:'Junior CM', module:'Communication', platform:'Udemy', title:'Conflict Resolution', link:'https://www.udemy.com/course/conflict-resolution/', status:'not-started', homolog:'optional', duration:'3h 0m', points:60, description:'De-escalation techniques for difficult conversations.', evidence:null, skills:['Communication'] },
      { id:'c78', courseId:'cm', path:'Technical Path', level:'Senior CM', module:'Strategy', platform:'Internal', title:'Complex Case Strategies', link:'#', status:'not-started', homolog:'auto', duration:'5h 0m', points:90, description:'Handling multi-party, long-running cases.', evidence:null, skills:['Case Management'] },
      { id:'c79', courseId:'cm', path:'Compliance Path', level:'Senior CM', module:'Compliance', platform:'Coursera', title:'Regulatory Documentation', link:'https://www.coursera.org/learn/regulatory-docs/', status:'not-started', homolog:'required', duration:'6h 0m', points:100, description:'Audit-ready documentation for regulated casework.', evidence:null, skills:['Compliance'] },
      { id:'c80', courseId:'legal', path:'Technical Path', level:'Junior Legal', module:'Research', platform:'Internal', title:'Legal Research Basics', link:'#', status:'not-started', homolog:'auto', duration:'4h 0m', points:70, description:'Finding and citing authoritative legal sources.', evidence:null, skills:['Legal Research'] },
      { id:'c81', courseId:'legal', path:'Technical Path', level:'Junior Legal', module:'Contracts', platform:'Coursera', title:'Contract Law Essentials', link:'https://www.coursera.org/learn/contract-law/', status:'not-started', homolog:'required', duration:'7h 0m', points:100, description:'Formation, terms and remedies in commercial contracts.', evidence:null, skills:['Legal Research'] },
      { id:'c82', courseId:'legal', path:'Compliance Path', level:'Senior Legal', module:'Compliance', platform:'LinkedIn Learning', title:'Compliance & Ethics Program Design', link:'https://www.linkedin.com/learning/compliance-ethics/', status:'not-started', homolog:'optional', duration:'4h 0m', points:80, description:'Building and monitoring an effective compliance program.', evidence:null, skills:['Compliance'] },
      { id:'c83', courseId:'legal', path:'Technical Path', level:'Senior Legal', module:'Litigation', platform:'Udemy', title:'eDiscovery Fundamentals', link:'https://www.udemy.com/course/ediscovery/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'ESI preservation, review and production workflows.', evidence:null, skills:['Legal Research'] },
      { id:'c84', courseId:'pm', path:'Technical Path', level:'Junior PM', module:'Foundations', platform:'LinkedIn Learning', title:'Project Management Foundations', link:'https://www.linkedin.com/learning/pm-foundations/', status:'not-started', homolog:'optional', duration:'5h 0m', points:80, description:'Scope, schedule and budget for first-time PMs.', evidence:null, skills:['Project Management'] },
      { id:'c85', courseId:'pm', path:'Technical Path', level:'Junior PM', module:'Agile', platform:'Udemy', title:'Agile with Scrum', link:'https://www.udemy.com/course/agile-scrum/', status:'not-started', homolog:'required', duration:'6h 0m', points:90, description:'Sprints, ceremonies and empirical planning.', evidence:null, skills:['Agile','Project Management'] },
      { id:'c86', courseId:'pm', path:'Soft Skills Path', level:'Junior PM', module:'Communication', platform:'YouTube', title:'Stakeholder Communication (talk)', link:'https://www.youtube.com/watch?v=pm-comms', status:'not-started', homolog:'auto', duration:'1h 0m', points:30, description:'Status reporting people actually read.', evidence:null, skills:['Communication','Project Management'] },
      { id:'c87', courseId:'pm', path:'Technical Path', level:'Senior PM', module:'Risk', platform:'Coursera', title:'Risk Management in Projects', link:'https://www.coursera.org/learn/project-risk/', status:'not-started', homolog:'optional', duration:'6h 0m', points:90, description:'Identifying, quantifying and mitigating delivery risk.', evidence:null, skills:['Risk Management','Project Management'] },
      { id:'c88', courseId:'pm', path:'Technical Path', level:'Senior PM', module:'Certification', platform:'Pluralsight', title:'PMP Exam Prep', link:'https://www.pluralsight.com/courses/pmp/', status:'not-started', homolog:'required', duration:'12h 0m', points:140, description:'Structured preparation for the PMP certification.', evidence:null, skills:['Project Management'] },
```

- [ ] **Step 2: Run the verifier**

Run: `node tools/verify-sample-data.mjs`
Expected: exit 1; all "path 'X' has no resources" and assignment failures are gone. Remaining failures concern only the maps, `homologs()` queue, `homologRequests`, and notifications (Task 6).

- [ ] **Step 3: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: light-fill catalogs for Architect, IT, Case Manager, Legal and PM"
```

---

### Task 6: Maps, approval queues, homologation history, notifications

**Files:**
- Modify: `Provana LMS.dc.html` — `notifications` (~line 1492), `homologRequests` (~1576), `homologs()` map (~1704), `enrollments()` progress/since/last line (~1694–1699), `enrollmentRows` prog line (~2493), home secondary map (~2542)

**Interfaces:**
- Consumes: resources `c6`,`c35` (waiting, u1), `c16` (waiting, u6), `c7`/`c46` (not-started, pending requests), `c44` (completed, approved request), `c34` (not-started, rejected request) — all guaranteed by Tasks 3–4.
- Produces: fully green verifier.

- [ ] **Step 1: Replace the `notifications` array contents:**

```js
    notifications:[
      {id:'n1', type:'due', text:'Resource "Grafana k6 Load Testing" is due in 7 days', time:'2h ago', read:false},
      {id:'n2', type:'assign', text:'New course assigned: Test Automation in GitHub Actions', time:'5h ago', read:false},
      {id:'n3', type:'approved', text:'Your homologation of "JavaScript Essentials" was approved', time:'Yesterday', read:false},
      {id:'n4', type:'cert', text:'Certificate earned: JavaScript Essentials', time:'Yesterday', read:true},
      {id:'n5', type:'level', text:'You reached 58% completion of your Quality Assurance path', time:'3 days ago', read:true},
      {id:'n6', type:'reject', text:'Evidence for "Quality Gates with SonarQube" was rejected — see manager note', time:'2 weeks ago', read:true}
    ],
```

- [ ] **Step 2: Replace the `homologRequests` array contents:**

```js
    homologRequests:[
      { id:'hreq1', userId:'u1', resourceId:'c7', pathId:'qa', level:'QA Lead', module:'Performance', title:'Performance Testing with JMeter', evidence:'jmeter-prev.pdf', status:'pending', submitted:'2026-07-01', managerNote:'' },
      { id:'hreq2', userId:'u2', resourceId:'c46', pathId:'dev', level:'Junior Dev', module:'Craft', title:'Clean Code Principles', evidence:'cleancode-cert.pdf', status:'pending', submitted:'2026-07-05', managerNote:'' },
      { id:'hreq3', userId:'u1', resourceId:'c44', pathId:'dev', level:'Junior Dev', module:'Programming', title:'JavaScript Essentials', evidence:'js-essentials-cert.pdf', status:'approved', submitted:'2026-07-02', managerNote:'Valid Udemy certificate — approved.' },
      { id:'hreq4', userId:'u1', resourceId:'c34', pathId:'qa', level:'Senior QA', module:'CI/CD', title:'Quality Gates with SonarQube', evidence:'sonar-screenshot.png', status:'rejected', submitted:'2026-06-20', managerNote:'Certificate does not cover the SonarQube quality-gates module — please complete the assessment.' }
    ],
```

- [ ] **Step 3: Replace the `homologs()` seed map** (inside the `homologs()` method):

```js
    const map=[
      {id:'h1', userId:'u1', resId:'c6', submitted:'2026-06-30'},
      {id:'h2', userId:'u1', resId:'c35', submitted:'2026-07-02'},
      {id:'h3', userId:'u6', resId:'c16', submitted:'2026-07-04'}
    ];
```

- [ ] **Step 4: Re-tune the `enrollments()` line** (progress, since, last):

```js
      const prog=u.id==='u1'?this.courseProgress('qa'):({u2:47,u3:22,u4:6,u6:71,u8:89,u9:55,u10:8}[u.id]||0);
```

and in the same method's return, replace the `since`/`last` maps:

```js
since:({u1:'Apr 2026',u2:'Mar 2026',u3:'May 2026',u4:'May 2026',u6:'Feb 2026',u8:'Jan 2026',u9:'Mar 2026',u10:'Jun 2026'}[u.id]||'—'), last:({u1:'Today',u2:'Today',u3:'5 days ago',u4:'3 weeks ago',u6:'Yesterday',u8:'Today',u9:'2 days ago',u10:'1 week ago'}[u.id]||'—')
```

- [ ] **Step 5: Re-tune the `enrollmentRows` prog line** (in `vManager()`):

```js
        const prog=({u1:58,u2:47,u3:22,u4:6,u6:71,u8:89,u9:55,u10:8}[u.id]||0);
```

- [ ] **Step 6: Re-tune the home secondary-path map** (in `vLearner()`):

```js
      const c=this.courseById(sp.pathId); const prog=({qa:35,ba:20,bi:60,rpa:45,dev:14}[sp.pathId]||0);
```

- [ ] **Step 7: Run the verifier — all green**

Run: `node tools/verify-sample-data.mjs`
Expected: exit 0 — `✓ all sample-data consistency checks passed (87 resources, 10 users)`

- [ ] **Step 8: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: manager queues, homolog history, notifications and tuned progress maps"
```

---

### Task 7: Visual verification

**Files:** none modified (fix-forward only if a defect is found).

**Interfaces:**
- Consumes: the fully seeded app.

- [ ] **Step 1: Open the app.** Use the Playwright MCP browser to navigate to `file:///C:/Users/yosman/Documents/LMS-provana-v4/LMS-provana/Provana%20LMS.dc.html`. If the page renders blank (the `.dc.html` runtime may require its host preview), fall back to asking the user to open their DC preview — the verifier already guarantees data consistency.

- [ ] **Step 2: Walk the Learner view.** Snapshot and check:
  - Home: primary path ~58%, secondary Developer card at 14%, Continue card populated.
  - Paths landing: two cards (Quality Assurance primary, Developer secondary).
  - ToDo List: 4 items in 3 module groups (Performance / Security / CI-CD), "Due Jul 14" visible on Grafana k6.
  - Active Learning: 5 cards — 3 in progress (65/35/80%) + 2 awaiting validation.
  - History: 5 completed rows with dates Feb–Jun 2026 and scores.
  - Certificates: 4 certificate cards; opening one shows the certificate modal.
  - Switching the path pill to Developer: 4 todo / 2 active / 1 history / 1 certificate.
  - Homologar: history shows Pendiente + Aprobado + Rechazado badges.

- [ ] **Step 3: Walk the Manager view.** Snapshot and check:
  - Team overview: 8 learners, avg completion ≈ 45%, 5 pending approvals, 3 at-risk (Sofia, Diego, Javier).
  - Team progress: rows show mixed statuses (On Track / Behind / Inactive).
  - Approvals: 5 rows — 3 Evidence + 2 Homologation, sorted oldest first.
  - Enrollments: 8 rows, Yolanda shows Developer as secondary path.

- [ ] **Step 4: Fix anything found, re-run `node tools/verify-sample-data.mjs`, and commit any fixes**

```bash
git add "Provana LMS.dc.html"
git commit -m "fix: visual polish after sample-data walkthrough"
```

(Skip the commit if nothing needed fixing.)
