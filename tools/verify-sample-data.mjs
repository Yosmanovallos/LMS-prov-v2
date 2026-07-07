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
