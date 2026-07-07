# LMS Provana Enhancements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 6 grupos de mejoras al prototipo HTML del LMS Provana: paths por rol, levels por seniority, skills solo en resources, manager enrollments primary/secondary, learner view rediseñado (4 pantallas), y homologación iniciada por learner.

**Architecture:** Todo el trabajo ocurre en un solo archivo `Provana LMS.dc.html`. La lógica vive en una clase `Component extends DCLogic` con `state`, métodos de acción, y métodos `vChrome/vNav/vAdmin/vManager/vLearner/vModals` que retornan valores al template. El template HTML usa `{{ variable }}`, `sc-if`, y `sc-for` para renderizar.

**Tech Stack:** HTML + CSS variables (design system existente) + DCLogic (framework similar a React, todo inline en el mismo archivo)

## Global Constraints

- Solo modificar `Provana LMS.dc.html` — ningún otro archivo
- Mantener el mismo design system: variables CSS `--brand`, `--surface`, `--border`, `--text`, etc.
- No agregar dependencias externas
- Dark mode funciona automáticamente via variables CSS — no requiere trabajo adicional
- Cada tarea termina con un commit funcional (el archivo abre en browser sin errores)
- Verificación: abrir el archivo en browser y revisar visualmente el screen afectado

---

### Task 1: Actualizar data model en `state`

**Files:**
- Modify: `Provana LMS.dc.html` — sección `state = { ... }` (líneas ~1242–1338)

**Qué cambia:**
- `courses` array: reemplazar los 7 cursos actuales con los 10 roles organizacionales
- `resources` array: actualizar `courseId` de todos los recursos QA a `'qa'`, niveles a seniority names
- `users` array: agregar campo `secondaryPaths: []` a cada usuario, renombrar `courseId` → `primaryPathId`
- Agregar `homologRequests: []` al state
- Agregar `enrollRequests: []` al state

- [ ] **Step 1: Reemplazar el array `courses` en state**

Localizar la línea `courses:[` (~línea 1275) y reemplazar todo el bloque `courses:[...]` con:

```js
courses:[
  { id:'qa',    name:'Quality Assurance',    desc:'Testing, automation and quality assurance.',              icon:'flask',     color:'#2A6FDB', status:'published', learners:29 },
  { id:'ba',    name:'Business Analyst',     desc:'Requirements gathering and process analysis.',            icon:'chart',     color:'#E0457B', status:'published', learners:5  },
  { id:'bi',    name:'Business Intelligence',desc:'Data analysis, reporting and BI tooling.',               icon:'database',  color:'#0EA5A0', status:'published', learners:3  },
  { id:'rpa',   name:'RPA Developer',        desc:'Robotic process automation and orchestration.',          icon:'rocket',    color:'#E2662C', status:'published', learners:4  },
  { id:'dev',   name:'Developer',            desc:'Software development and engineering.',                  icon:'code',      color:'#1F8A5B', status:'published', learners:7  },
  { id:'arch',  name:'Architect',            desc:'System and enterprise architecture design.',             icon:'globe',     color:'#7C3AED', status:'published', learners:2  },
  { id:'it',    name:'IT',                   desc:'Infrastructure, support and IT operations.',             icon:'cpu',       color:'#475569', status:'published', learners:4  },
  { id:'cm',    name:'Case Manager',         desc:'Case management and client services.',                   icon:'clipboard', color:'#D99A00', status:'published', learners:6  },
  { id:'legal', name:'Legal System',         desc:'Legal processes, compliance and documentation.',         icon:'shield',    color:'#DC2626', status:'published', learners:3  },
  { id:'pm',    name:'Project Manager',      desc:'Project planning, delivery and stakeholder management.', icon:'briefcase', color:'#4A2E80', status:'published', learners:8  }
],
```

- [ ] **Step 2: Actualizar `users` — renombrar `courseId` → `primaryPathId` y agregar `secondaryPaths`**

Localizar el array `users:[` (~línea 1265) y reemplazar con:

```js
users:[
  { id:'u1', name:'Yolanda Ortega',    email:'yolanda.ortega@provana.com',    role:'Learner',  status:'Active',   managerId:'m1', primaryPathId:'qa',  primaryLevel:'Senior QA',    secondaryPaths:[] },
  { id:'u2', name:'Mateo Castro',      email:'mateo.castro@provana.com',      role:'Learner',  status:'Active',   managerId:'m2', primaryPathId:'dev', primaryLevel:'Junior Dev',    secondaryPaths:[{pathId:'qa',level:'Junior QA'}] },
  { id:'u3', name:'Sofia Herrera',     email:'sofia.herrera@provana.com',     role:'Learner',  status:'Active',   managerId:'m1', primaryPathId:'ba',  primaryLevel:'Junior BA',     secondaryPaths:[] },
  { id:'u4', name:'Diego Ramirez',     email:'diego.ramirez@provana.com',     role:'Learner',  status:'Inactive', managerId:'m3', primaryPathId:'rpa', primaryLevel:'Junior RPA',    secondaryPaths:[] },
  { id:'u5', name:'Carlos Mendez',     email:'carlos.mendez@provana.com',     role:'Manager',  status:'Active',   managerId:null,  primaryPathId:null,  primaryLevel:null,            secondaryPaths:[] },
  { id:'u6', name:'Lucia Fernandez',   email:'lucia.fernandez@provana.com',   role:'Learner',  status:'Active',   managerId:'m2', primaryPathId:'qa',  primaryLevel:'Mid-Level QA',  secondaryPaths:[{pathId:'bi',level:'BI Analyst'}] },
  { id:'u7', name:'Patricia Lozano',   email:'patricia.lozano@provana.com',   role:'Admin',    status:'Active',   managerId:null,  primaryPathId:null,  primaryLevel:null,            secondaryPaths:[] },
  { id:'u8', name:'Andres Vargas',     email:'andres.vargas@provana.com',     role:'Learner',  status:'Active',   managerId:'m3', primaryPathId:'qa',  primaryLevel:'Junior QA',     secondaryPaths:[] }
],
```

- [ ] **Step 3: Actualizar `resources` — cambiar `courseId` y renombrar levels a seniority**

Localizar el array `resources:[` y reemplazar cada recurso actualizando `courseId` y `level`:

**Recursos QA (los de `sr-qa`, `jr-qa`, `mid-qa`, `qa-lead`):**
- `courseId:'sr-qa'` → `courseId:'qa'`, `level:'Foundational'` → `level:'Junior QA'`, `level:'Intermediate'` → `level:'Senior QA'`, `level:'Advanced'` → `level:'QA Lead'`
- `courseId:'jr-qa'` → `courseId:'qa'`, levels → `'Junior QA'`
- `courseId:'mid-qa'` → `courseId:'qa'`, levels → `'Mid-Level QA'`
- `courseId:'qa-lead'` → `courseId:'qa'`, levels → `'QA Lead'`

**Recursos BA:**
- `courseId:'ba'` queda igual, `level:'Foundational'` → `'Junior BA'`, `level:'Intermediate'` → `'Senior BA'`

**Recursos RPA:**
- `courseId:'rpa'` queda igual, `level:'Intermediate'` → `'Senior RPA'`, `level:'Foundational'` → `'Junior RPA'`

**Recursos automation (Developer):**
- `courseId:'automation'` → `courseId:'dev'`, levels: `'Foundational'` → `'Junior Dev'`, `'Intermediate'` → `'Mid-Level Dev'`, `'Advanced'` → `'Senior Dev'`

Ejemplo del primer recurso actualizado:
```js
{ id:'c1', courseId:'qa', path:'Technical', level:'Junior QA', module:'Playwright', platform:'Udemy', title:'Playwright Fundamentals', link:'https://www.udemy.com/course/playwright/', status:'completed', homolog:'required', duration:'6h 0m', points:100, description:'Modern end-to-end browser automation with Playwright.', evidence:'playwright-cert.pdf', skills:['Test Automation','Playwright'], score:94, completedDate:'2026-04-12', hasCert:true },
```

- [ ] **Step 4: Agregar `homologRequests` y `enrollRequests` al state**

Justo después de la última línea del array `resources`, antes del cierre `};` del state, agregar:

```js
homologRequests:[
  { id:'hreq1', userId:'u1', resourceId:'c7', pathId:'qa', level:'QA Lead', module:'Performance', title:'Performance Testing with JMeter', evidence:'jmeter-prev.pdf', status:'pending', submitted:'2026-06-28', managerNote:'' }
],
enrollRequests:[],
```

- [ ] **Step 5: Actualizar método helper `courseById`**

El método `courseById` en ~línea 1379 ya funciona con el nuevo array. No requiere cambio.

Actualizar referencias a `u.courseId` en el método `enrollments()` (~línea 1435):

```js
enrollments(){
  return this.state.users.filter(u=>u.role==='Learner'&&u.primaryPathId).map(u=>{
    const c=this.courseById(u.primaryPathId);
    const prog=u.id==='u1'?this.courseProgress('qa'):({u2:42,u3:18,u4:5,u6:67,u8:88}[u.id]||0);
    let status='not-started';
    if(prog>=100) status='completed'; else if(prog>0) status='in-progress';
    const pendingEv=this.state.resources.some(r=>r.courseId===u.primaryPathId&&r.status==='waiting');
    if(pendingEv&&prog>0&&prog<100) status='awaiting';
    return { ...u, course:c, prog, status, source:(u.id==='u3')?'manual':'auto', since:({u1:'Apr 2026',u2:'Mar 2026',u3:'May 2026',u4:'May 2026',u6:'Feb 2026',u8:'Jan 2026'}[u.id]||'—'), last:({u1:'2 days ago',u2:'Today',u3:'5 days ago',u4:'3 weeks ago',u6:'Yesterday',u8:'Today'}[u.id]||'—') };
  });
}
```

- [ ] **Step 6: Verificar en browser**

Abrir `Provana LMS.dc.html` en browser. El viewer "Admin" → pantalla Paths debe cargarse sin errores. Los datos nuevos deben estar en memoria (verificar con console.log si necesario).

- [ ] **Step 7: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: update data model — role paths, seniority levels, secondaryPaths, homologRequests"
```

---

### Task 2: Admin — Paths screen muestra los 10 roles

**Files:**
- Modify: `Provana LMS.dc.html` — método `vAdmin()` sección pathCards (~línea 1769), y HTML `<!-- ADMIN: PATHS -->` (~línea 186)

**Qué cambia:** Las cards de Paths muestran los 10 roles en lugar de los 7 cursos anteriores. Se elimina la columna "Program" ya que no aplica — el path ES el rol.

- [ ] **Step 1: Actualizar generación de `pathCards` en `vAdmin()`**

Localizar en `vAdmin()` el bloque `const courseCards=S.courses.map(...)` (~línea 1769) y reemplazar con:

```js
const pathCards=S.courses.map(c=>{
  const rs=S.resources.filter(r=>r.courseId===c.id);
  const levelSet=new Set(rs.map(r=>r.level));
  const st=c.status;
  const stCol={published:'#15803d',draft:'#b45309',archived:'#64748b'}[st];
  return { ...c, colorDark:this.dark(c.color,28), iconWhite:this.iconEl(c.icon,24,'#fff',2),
    levelCount:levelSet.size, resCount:rs.length, learnerCount:c.learners,
    statusLabel:st, statusColor:stCol,
    edit:()=>this.setState({wizard:this.newWizard(c),screen:'builder'}),
    viewLevels:()=>this.setState({screen:'levels',filterPath:c.id}) };
});
```

Asegurarse de que `pathCards` (no `courseCards`) se exponga en el return de `vAdmin()`. Buscar en el `return {` de `vAdmin()` la línea que expone estos datos y cambiar `courseCards` por `pathCards`. También actualizar:
```js
pathsCountLabel: pathCards.length+' paths',
```

- [ ] **Step 2: Actualizar HTML del screen `showPaths`**

Localizar `<!-- ADMIN: PATHS -->` (~línea 186). El template usa `{{ p.programName }}`, `{{ p.progBg }}`, `{{ p.progColor }}` que ya no existen. Reemplazar el contenido de la card:

Encontrar este bloque dentro del `sc-for list="{{ pathCards }}"`:
```html
<div style="margin-bottom:8px;"><span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:{{ p.progBg }};color:{{ p.progColor }};">{{ p.programName }}</span></div>
```
Reemplazar con:
```html
<div style="margin-bottom:8px;"><span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:var(--brand-soft);color:var(--brand);">{{ p.learnerCount }} learners</span></div>
```

Encontrar el bloque de stats de la card:
```html
<div style="display:flex;gap:16px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
  <div><div style="font-size:16px;font-weight:700;color:var(--text);">{{ p.levelCount }}</div><div style="font-size:11px;color:var(--text-3);">Levels</div></div>
  <div><div style="font-size:16px;font-weight:700;color:var(--text);">{{ p.moduleCount }}</div><div style="font-size:11px;color:var(--text-3);">Modules</div></div>
  <div><div style="font-size:16px;font-weight:700;color:var(--text);">{{ p.resCount }}</div><div style="font-size:11px;color:var(--text-3);">Resources</div></div>
</div>
```
Reemplazar con:
```html
<div style="display:flex;gap:16px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
  <div><div style="font-size:16px;font-weight:700;color:var(--text);">{{ p.levelCount }}</div><div style="font-size:11px;color:var(--text-3);">Levels</div></div>
  <div><div style="font-size:16px;font-weight:700;color:var(--text);">{{ p.resCount }}</div><div style="font-size:11px;color:var(--text-3);">Resources</div></div>
  <div><div style="font-size:16px;font-weight:700;color:var(--text);">{{ p.learnerCount }}</div><div style="font-size:11px;color:var(--text-3);">Learners</div></div>
</div>
```

- [ ] **Step 3: Actualizar `pathsCountLabel` y exponer `pathCards` en return de `vAdmin()`**

En el `return { ... }` de `vAdmin()`, cambiar:
```js
// antes (buscar y reemplazar):
pathsCountLabel: ...  // actualizar a:
pathsCountLabel: pathCards.length+' role paths',
pathCards,
```

Eliminar la referencia a `courseCards` del return si existe.

- [ ] **Step 4: Verificar en browser**

Admin → Paths: deben aparecer 10 cards con los roles (Quality Assurance, Business Analyst, etc.). Cada card muestra el ícono correcto, learner count, level count.

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: admin paths screen shows 10 role paths"
```

---

### Task 3: Admin — Levels screen muestra seniority levels

**Files:**
- Modify: `Provana LMS.dc.html` — método `vAdmin()` sección levelRows (~línea 1820+), HTML `<!-- ADMIN: LEVELS -->` (~línea 232)

- [ ] **Step 1: Actualizar `levelRows` en `vAdmin()`**

Localizar el bloque que genera `levelRows` en `vAdmin()`. Reemplazar con:

```js
// levels — derived from resources, grouped by courseId+level
const sfLevels=sf.levels||{q:'',prog:''};
const levelsSeen={}, levelsOut=[];
S.resources.forEach(r=>{
  const k=r.courseId+'|'+r.level;
  if(!levelsSeen[k]){
    levelsSeen[k]=1;
    const c=this.courseById(r.courseId)||{};
    const mods=new Set(S.resources.filter(x=>x.courseId===r.courseId&&x.level===r.level).map(x=>x.module)).size;
    const res=S.resources.filter(x=>x.courseId===r.courseId&&x.level===r.level).length;
    levelsOut.push({
      courseId:r.courseId, pathName:c.name||r.courseId, name:r.level,
      moduleCount:mods, resCount:res,
      progBg:this.mix(c.color||'#4A2E80',13), progColor:c.color||'#4A2E80',
      edit:()=>this.openEditLevel({courseId:r.courseId,pathName:c.name||r.courseId,name:r.level}),
      viewModules:()=>this.setState({screen:'modules',filterPath:r.courseId,filterLevel:r.level}),
      goPath:()=>this.setState({screen:'paths',filterPath:r.courseId})
    });
  }
});
let levelRows=[...levelsOut];
if(sfLevels.q) levelRows=levelRows.filter(l=>l.name.toLowerCase().includes(sfLevels.q.toLowerCase())||l.pathName.toLowerCase().includes(sfLevels.q.toLowerCase()));
if(sfLevels.prog) levelRows=levelRows.filter(l=>l.courseId===sfLevels.prog);
const levelsCountLabel=levelRows.length+' levels';
```

- [ ] **Step 2: Actualizar columnas en HTML `<!-- ADMIN: LEVELS -->`**

Localizar el header row de la tabla de levels (~línea 254):
```html
<div style="display:grid;grid-template-columns:1.6fr 1.4fr 1.2fr 1.2fr 0.7fr 0.7fr 1.2fr;..."><div>Level</div><div>Path</div><div>Program</div><div>Completion Rule</div><div>Modules</div><div>Resources</div><div style="text-align:right;">Actions</div></div>
```
Reemplazar con:
```html
<div style="display:grid;grid-template-columns:1.6fr 1.4fr 0.7fr 0.7fr 1.2fr;gap:14px;padding:13px 22px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--text-3);text-transform:uppercase;"><div>Level</div><div>Path</div><div>Modules</div><div>Resources</div><div style="text-align:right;">Actions</div></div>
```

Localizar la data row y reemplazar con:
```html
<sc-for list="{{ levelRows }}" as="l" hint-placeholder-count="6">
  <div style="display:grid;grid-template-columns:1.6fr 1.4fr 0.7fr 0.7fr 1.2fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--border);align-items:center;">
    <div style="font-size:13.5px;font-weight:600;color:var(--text);">{{ l.name }}</div>
    <div><button onClick="{{ l.goPath }}" style="font-size:11.5px;font-weight:700;padding:4px 11px;border-radius:20px;border:none;background:{{ l.progBg }};color:{{ l.progColor }};cursor:pointer;">{{ l.pathName }}</button></div>
    <div><button onClick="{{ l.viewModules }}" style="font-size:13.5px;font-weight:700;color:var(--brand);background:none;border:none;padding:0;cursor:pointer;">{{ l.moduleCount }}</button></div>
    <div style="font-size:13px;color:var(--text-2);">{{ l.resCount }}</div>
    <div style="display:flex;gap:6px;justify-content:flex-end;">
      <button onClick="{{ l.edit }}" style="font-size:12px;font-weight:600;color:var(--text-2);background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;">Edit</button>
      <button onClick="{{ l.viewModules }}" style="font-size:12px;font-weight:700;color:var(--brand);background:var(--brand-soft);border:none;border-radius:8px;padding:6px 13px;cursor:pointer;">Modules →</button>
    </div>
  </div>
</sc-for>
```

- [ ] **Step 3: Exponer en return de `vAdmin()`**

Asegurarse que el `return {}` de `vAdmin()` incluye `levelRows, levelsCountLabel`.

- [ ] **Step 4: Verificar en browser**

Admin → Levels: tabla muestra levels como "Junior QA", "Senior QA", "QA Lead", "Junior BA", etc. con su path asociado.

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: admin levels screen shows seniority levels per role path"
```

---

### Task 4: Admin — Modules elimina columna Skills

**Files:**
- Modify: `Provana LMS.dc.html` — HTML `<!-- ADMIN: MODULES -->` (~línea 274), `vAdmin()` moduleRows

- [ ] **Step 1: Actualizar `moduleRows` en `vAdmin()` — quitar skills**

Localizar donde se construye `moduleRows`. Encontrar la línea que mapea `m.skills` y eliminar ese campo del objeto retornado. El objeto de cada módulo debe ser:

```js
{ courseId:..., pathName:..., levelName:..., name:..., resCount:...,
  progBg:..., progColor:...,
  edit:()=>..., viewResources:()=>...,
  goLevel:()=>..., goPath:()=>... }
```
Sin el campo `skills`.

- [ ] **Step 2: Actualizar HTML del header de la tabla de Modules**

Localizar (~línea 298) el header:
```html
<div style="display:grid;grid-template-columns:1.6fr 1fr 1.3fr 0.6fr 2fr 1.1fr;..."><div>Module</div><div>Level</div><div>Path</div><div>Resources</div><div>Skills</div><div style="text-align:right;">Actions</div></div>
```
Reemplazar con:
```html
<div style="display:grid;grid-template-columns:1.6fr 1fr 1.3fr 0.6fr 1.1fr;gap:14px;padding:13px 22px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--text-3);text-transform:uppercase;"><div>Module</div><div>Level</div><div>Path</div><div>Resources</div><div style="text-align:right;">Actions</div></div>
```

- [ ] **Step 3: Actualizar HTML de la data row de Modules**

Localizar (~línea 300) la data row y reemplazar:
```html
<sc-for list="{{ moduleRows }}" as="m" hint-placeholder-count="8">
  <div style="display:grid;grid-template-columns:1.6fr 1fr 1.3fr 0.6fr 1.1fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--border);align-items:center;">
    <div style="font-size:13.5px;font-weight:600;color:var(--text);">{{ m.name }}</div>
    <div><button onClick="{{ m.goLevel }}" style="font-size:11.5px;font-weight:600;color:var(--text-2);background:var(--surface-2);border:1px solid var(--border);border-radius:20px;padding:4px 11px;cursor:pointer;">{{ m.levelName }}</button></div>
    <div><button onClick="{{ m.goPath }}" style="font-size:11.5px;font-weight:700;padding:4px 11px;border-radius:20px;border:none;background:{{ m.progBg }};color:{{ m.progColor }};cursor:pointer;">{{ m.pathName }}</button></div>
    <div><button onClick="{{ m.viewResources }}" style="font-size:13.5px;font-weight:700;color:var(--brand);background:none;border:none;padding:0;cursor:pointer;">{{ m.resCount }}</button></div>
    <div style="display:flex;gap:6px;justify-content:flex-end;">
      <button onClick="{{ m.edit }}" style="font-size:12px;font-weight:600;color:var(--text-2);background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;">Edit</button>
      <button onClick="{{ m.viewResources }}" style="font-size:12px;font-weight:700;color:var(--brand);background:var(--brand-soft);border:none;border-radius:8px;padding:6px 13px;cursor:pointer;">Resources →</button>
    </div>
  </div>
</sc-for>
```

- [ ] **Step 4: Verificar en browser**

Admin → Modules: tabla sin columna Skills. Columnas: Module | Level | Path | Resources | Actions.

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: remove skills column from admin modules table"
```

---

### Task 5: Admin — Users muestra Primary Path

**Files:**
- Modify: `Provana LMS.dc.html` — `vAdmin()` userRows, HTML `<!-- ADMIN: USERS -->` (~línea 551)

- [ ] **Step 1: Actualizar `userRows` en `vAdmin()` para incluir primary path**

Localizar la construcción de `userRows` (~línea 1813) y reemplazar con:

```js
const userRows=S.users.map(u=>{
  const mgr=S.managers.find(m=>m.id===u.managerId);
  const primaryPath=u.primaryPathId?this.courseById(u.primaryPathId):null;
  const primaryLabel=primaryPath?(primaryPath.name+(u.primaryLevel?' › '+u.primaryLevel:'')):'—';
  const primaryColor=primaryPath?primaryPath.color:'#94a3b8';
  return { ...u, initials:this.initials(u.name), avatarBg:this.avatarBg(u.name),
    roleColor:roleBadge[u.role], roleBg:this.mix(roleBadge[u.role],13),
    statusColor:u.status==='Active'?'#15803d':'#94a3b8', statusBg:this.mix(u.status==='Active'?'#15803d':'#94a3b8',14),
    managerName:mgr?mgr.name:'—',
    primaryLabel, primaryColor, primaryBg:this.mix(primaryColor,13) };
});
```

- [ ] **Step 2: Actualizar HTML header de tabla Users**

Localizar (~línea 554):
```html
<div style="display:grid;grid-template-columns:2fr 1fr 0.9fr 1.2fr 0.8fr;..."><div>User</div><div>Role</div><div>Status</div><div>Manager</div><div style="text-align:right;">Actions</div></div>
```
Reemplazar con:
```html
<div style="display:grid;grid-template-columns:1.8fr 0.9fr 1.4fr 0.8fr 1.1fr 0.8fr;gap:14px;padding:13px 22px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--text-3);text-transform:uppercase;"><div>User</div><div>Role</div><div>Primary Path</div><div>Status</div><div>Manager</div><div style="text-align:right;">Actions</div></div>
```

- [ ] **Step 3: Actualizar HTML data row de Users**

Reemplazar la data row (~línea 556):
```html
<sc-for list="{{ userRows }}" as="u" hint-placeholder-count="8">
  <div style="display:grid;grid-template-columns:1.8fr 0.9fr 1.4fr 0.8fr 1.1fr 0.8fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--border);align-items:center;">
    <div style="display:flex;align-items:center;gap:12px;min-width:0;"><div style="width:38px;height:38px;border-radius:50%;background:{{ u.avatarBg }};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12.5px;flex-shrink:0;">{{ u.initials }}</div><div style="min-width:0;"><div style="font-size:13.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ u.name }}</div><div style="font-size:11.5px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ u.email }}</div></div></div>
    <div><span style="font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px;background:{{ u.roleBg }};color:{{ u.roleColor }};text-transform:uppercase;letter-spacing:.04em;">{{ u.role }}</span></div>
    <div><span style="font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:20px;background:{{ u.primaryBg }};color:{{ u.primaryColor }};">{{ u.primaryLabel }}</span></div>
    <div><span style="font-size:11.5px;font-weight:700;padding:4px 11px;border-radius:20px;background:{{ u.statusBg }};color:{{ u.statusColor }};">{{ u.status }}</span></div>
    <div style="font-size:12.5px;color:var(--text-2);">{{ u.managerName }}</div>
    <div style="text-align:right;"><button style="font-size:12px;font-weight:600;color:var(--brand);background:var(--brand-soft);border:none;border-radius:8px;padding:7px 16px;">Edit</button></div>
  </div>
</sc-for>
```

- [ ] **Step 4: Verificar en browser**

Admin → Users: columna "Primary Path" muestra "Quality Assurance › Senior QA" para Yolanda, etc.

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: admin users table shows primary path column"
```

---

### Task 6: Manager — pantalla Enrollments + sidebar nav

**Files:**
- Modify: `Provana LMS.dc.html` — `vNav()` manager section (~línea 1731), `vManager()` return, HTML principal (agregar screen después de `<!-- MANAGER: APPROVALS -->`)

- [ ] **Step 1: Agregar "Enrollments" al nav del Manager en `vNav()`**

Localizar el bloque `} else if(V==='manager'){` (~línea 1731):
```js
navItems=[
  head('My Team'),
  item('team','Team Overview',...),
  item('progress','Team Progress',...),
  item('approvals','Approvals',...,pendingCount)
];
```
Reemplazar con:
```js
const homReq=S.homologRequests?S.homologRequests.filter(h=>h.status==='pending').length:0;
const totalPending=pendingCount+homReq;
navItems=[
  head('My Team',''),
  item('team','Team Overview',[['rect',{x:3,y:3,width:7,height:9}],['rect',{x:14,y:3,width:7,height:5}],['rect',{x:14,y:12,width:7,height:9}],['rect',{x:3,y:16,width:7,height:5}]],0,''),
  item('progress','Team Progress',[['path','M3 3v18h18'],['path','M18 17V9'],['path','M13 17V5'],['path','M8 17v-3']],0,''),
  item('enrollments','Enrollments',[['path','M9 11l3 3L22 4'],['path','M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']],0,''),
  item('approvals','Approvals',[['path','M22 11.08V12a10 10 0 1 1-5.93-9.14'],['path','M22 4 12 14.01l-3-3']],totalPending,'')
];
```

- [ ] **Step 2: Agregar state para el modal de enrollment**

En `state = { ... }` agregar (después de `deleteConfirm:null,`):
```js
enrollPanelOpen:false, enrollPanelUser:null,
enrollPanelPrimPath:'', enrollPanelPrimLevel:'',
enrollPanelAddSecPath:'', enrollPanelAddSecLevel:'',
```

- [ ] **Step 3: Agregar métodos de enrollment al Component**

Antes del método `renderVals()`, agregar:

```js
openEnrollPanel(u){ this.setState({enrollPanelOpen:true,enrollPanelUser:u.id,enrollPanelPrimPath:u.primaryPathId||'',enrollPanelPrimLevel:u.primaryLevel||'',enrollPanelAddSecPath:'',enrollPanelAddSecLevel:''}); }
closeEnrollPanel(){ this.setState({enrollPanelOpen:false,enrollPanelUser:null}); }
savePrimaryPath(){
  const S=this.state; if(!S.enrollPanelPrimPath||!S.enrollPanelPrimLevel){this.flash('Selecciona path y level','warn');return;}
  const users=S.users.map(u=>u.id===S.enrollPanelUser?{...u,primaryPathId:S.enrollPanelPrimPath,primaryLevel:S.enrollPanelPrimLevel}:u);
  this.setState({users}); this.flash('Primary path actualizado','ok');
}
addSecondaryPath(){
  const S=this.state; if(!S.enrollPanelAddSecPath||!S.enrollPanelAddSecLevel){this.flash('Selecciona path y level','warn');return;}
  const users=S.users.map(u=>{
    if(u.id!==S.enrollPanelUser) return u;
    const already=(u.secondaryPaths||[]).some(sp=>sp.pathId===S.enrollPanelAddSecPath);
    if(already){this.flash('Ya tiene ese path secundario','warn');return u;}
    return {...u,secondaryPaths:[...(u.secondaryPaths||[]),{pathId:S.enrollPanelAddSecPath,level:S.enrollPanelAddSecLevel}]};
  });
  this.setState({users,enrollPanelAddSecPath:'',enrollPanelAddSecLevel:''}); this.flash('Secondary path agregado','ok');
}
removeSecondaryPath(userId,pathId){
  const users=this.state.users.map(u=>u.id!==userId?u:{...u,secondaryPaths:(u.secondaryPaths||[]).filter(sp=>sp.pathId!==pathId)});
  this.setState({users}); this.flash('Secondary path removido','ok');
}
approveEnrollRequest(reqId){
  const req=this.state.enrollRequests.find(r=>r.id===reqId); if(!req) return;
  const users=this.state.users.map(u=>{
    if(u.id!==req.userId) return u;
    return {...u,secondaryPaths:[...(u.secondaryPaths||[]),{pathId:req.pathId,level:req.level}]};
  });
  const enrollRequests=this.state.enrollRequests.map(r=>r.id===reqId?{...r,status:'approved'}:r);
  this.setState({users,enrollRequests}); this.flash('Acceso aprobado','ok');
}
rejectEnrollRequest(reqId){
  const enrollRequests=this.state.enrollRequests.map(r=>r.id===reqId?{...r,status:'rejected'}:r);
  this.setState({enrollRequests}); this.flash('Solicitud rechazada','ok');
}
```

- [ ] **Step 4: Agregar `vManager()` datos para Enrollments**

En el método `vManager()`, dentro del `return { ... }`, agregar:

```js
showEnrollments: V==='manager'&&S.screen==='enrollments',
enrollmentRows: S.users.filter(u=>u.role==='Learner').map(u=>{
  const primary=u.primaryPathId?this.courseById(u.primaryPathId):null;
  const secondaries=(u.secondaryPaths||[]).map(sp=>{const c=this.courseById(sp.pathId);return{...sp,name:c?c.name:'—',color:c?c.color:'#94a3b8'};});
  const prog=({u1:78,u2:42,u3:18,u4:5,u6:67,u8:88}[u.id]||0);
  return { ...u, initials:this.initials(u.name), avatarBg:this.avatarBg(u.name),
    primaryName:primary?primary.name:'Sin asignar', primaryLevel:u.primaryLevel||'—', primaryColor:primary?primary.color:'#94a3b8',
    primaryBg:this.mix(primary?primary.color:'#94a3b8',12), secondaries, prog,
    statusLabel:prog===0?'No iniciado':prog>=100?'Completado':'En progreso',
    statusColor:prog===0?'#64748b':prog>=100?'#15803d':'#2563eb',
    statusBg:this.mix(prog===0?'#64748b':prog>=100?'#15803d':'#2563eb',12),
    manage:()=>this.openEnrollPanel(u) };
}),
enrollPanelOpen: S.enrollPanelOpen,
enrollPanelUser: S.enrollPanelUser?S.users.find(u=>u.id===S.enrollPanelUser):null,
enrollPanelPrimPath: S.enrollPanelPrimPath,
enrollPanelPrimLevel: S.enrollPanelPrimLevel,
enrollPanelAddSecPath: S.enrollPanelAddSecPath,
enrollPanelAddSecLevel: S.enrollPanelAddSecLevel,
enrollPanelSecondaries: S.enrollPanelUser?(S.users.find(u=>u.id===S.enrollPanelUser)||{secondaryPaths:[]}).secondaryPaths.map(sp=>{const c=this.courseById(sp.pathId);return{...sp,name:c?c.name:'—',color:c?c.color:'#94a3b8',remove:()=>this.removeSecondaryPath(S.enrollPanelUser,sp.pathId)};}):[] ,
enrollLevelOptions: S.enrollPanelPrimPath?[...new Set(S.resources.filter(r=>r.courseId===S.enrollPanelPrimPath).map(r=>r.level))].map(l=>({value:l,label:l})):[],
enrollSecLevelOptions: S.enrollPanelAddSecPath?[...new Set(S.resources.filter(r=>r.courseId===S.enrollPanelAddSecPath).map(r=>r.level))].map(l=>({value:l,label:l})):[],
setEnrollPrimPath:(e)=>this.setState({enrollPanelPrimPath:e.target.value,enrollPanelPrimLevel:''}),
setEnrollPrimLevel:(e)=>this.setState({enrollPanelPrimLevel:e.target.value}),
setEnrollSecPath:(e)=>this.setState({enrollPanelAddSecPath:e.target.value,enrollPanelAddSecLevel:''}),
setEnrollSecLevel:(e)=>this.setState({enrollPanelAddSecLevel:e.target.value}),
savePrimaryPath:()=>this.savePrimaryPath(),
addSecondaryPath:()=>this.addSecondaryPath(),
closeEnrollPanel:()=>this.closeEnrollPanel(),
stopEnrollProp:(e)=>e&&e.stopPropagation&&e.stopPropagation(),
pendingEnrollRequests: (S.enrollRequests||[]).filter(r=>r.status==='pending').length,
```

- [ ] **Step 5: Agregar HTML del screen Enrollments**

Después del bloque `<!-- MANAGER: APPROVALS -->` (después del `</sc-if>` que cierra approvals, ~línea 751), insertar:

```html
<!-- MANAGER: ENROLLMENTS -->
<sc-if value="{{ showEnrollments }}" hint-placeholder-val="{{ false }}">
<div style="max-width:1200px;margin:0 auto;">
  <div style="font-size:13.5px;color:var(--text-2);margin-bottom:16px;">Gestiona el path principal y secundarios de cada miembro de tu equipo.</div>
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);">
    <div style="display:grid;grid-template-columns:1.6fr 1.4fr 0.8fr 1.6fr 1fr 0.8fr;gap:14px;padding:13px 22px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--text-3);text-transform:uppercase;"><div>Learner</div><div>Primary Path</div><div>Level</div><div>Secondary Paths</div><div>Progreso</div><div style="text-align:right;">Actions</div></div>
    <sc-for list="{{ enrollmentRows }}" as="e" hint-placeholder-count="5">
      <div style="display:grid;grid-template-columns:1.6fr 1.4fr 0.8fr 1.6fr 1fr 0.8fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--border);align-items:center;">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;"><div style="width:34px;height:34px;border-radius:50%;background:{{ e.avatarBg }};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11.5px;flex-shrink:0;">{{ e.initials }}</div><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ e.name }}</div></div>
        <div><span style="font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:20px;background:{{ e.primaryBg }};color:{{ e.primaryColor }};">{{ e.primaryName }}</span></div>
        <div style="font-size:12px;color:var(--text-2);">{{ e.primaryLevel }}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;"><sc-for list="{{ e.secondaries }}" as="sp" hint-placeholder-count="2"><span style="font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px;background:{{ sp.color }}1a;color:{{ sp.color }};">{{ sp.name }}</span></sc-for></div>
        <div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:6px;border-radius:4px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ e.prog }}%;background:var(--brand);border-radius:4px;"></div></div><span style="font-size:11.5px;font-weight:700;color:var(--text-2);">{{ e.prog }}%</span></div>
        <div style="text-align:right;"><button onClick="{{ e.manage }}" style="font-size:12px;font-weight:700;color:var(--brand);background:var(--brand-soft);border:none;border-radius:8px;padding:7px 16px;cursor:pointer;">Manage</button></div>
      </div>
    </sc-for>
  </div>
</div>
</sc-if>
```

- [ ] **Step 6: Agregar modal Enrollment Panel**

Antes del cierre `</div>` del componente raíz (~línea 1238), agregar:

```html
<!-- ENROLLMENT PANEL MODAL -->
<sc-if value="{{ enrollPanelOpen }}" hint-placeholder-val="{{ false }}">
<div onClick="{{ closeEnrollPanel }}" style="position:fixed;inset:0;background:rgba(23,17,48,.5);z-index:60;display:flex;align-items:center;justify-content:center;padding:30px;animation:ovIn .15s ease;">
  <div onClick="{{ stopEnrollProp }}" style="width:520px;max-height:88vh;overflow-y:auto;background:var(--surface);border-radius:18px;box-shadow:var(--shadow-lg);animation:shIn .2s ease;">
    <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:16px;font-weight:700;">Gestionar Enrollment</div><div style="font-size:12.5px;color:var(--text-3);margin-top:2px;">{{ enrollPanelUser.name }}</div></div>
      <button onClick="{{ closeEnrollPanel }}" style="background:none;border:none;font-size:20px;color:var(--text-3);cursor:pointer;">×</button>
    </div>
    <div style="padding:22px 24px;display:flex;flex-direction:column;gap:20px;">
      <!-- PRIMARY PATH -->
      <div style="padding:16px;border-radius:13px;border:1px solid var(--border);background:var(--surface-2);">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px;">🎯 Primary Path</div>
        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <select value="{{ enrollPanelPrimPath }}" onChange="{{ setEnrollPrimPath }}" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);font-size:13px;color:var(--text);outline:none;">
            <option value="">Seleccionar path…</option>
            <sc-for list="{{ programOptions }}" as="o" hint-placeholder-count="10"><option value="{{ o.id }}">{{ o.name }}</option></sc-for>
          </select>
          <select value="{{ enrollPanelPrimLevel }}" onChange="{{ setEnrollPrimLevel }}" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);font-size:13px;color:var(--text);outline:none;">
            <option value="">Seleccionar level…</option>
            <sc-for list="{{ enrollLevelOptions }}" as="lo" hint-placeholder-count="4"><option value="{{ lo.value }}">{{ lo.label }}</option></sc-for>
          </select>
        </div>
        <button onClick="{{ savePrimaryPath }}" style="width:100%;padding:9px;border-radius:9px;border:none;background:var(--brand);color:#fff;font-size:13px;font-weight:700;cursor:pointer;">Guardar Primary Path</button>
      </div>
      <!-- SECONDARY PATHS -->
      <div style="padding:16px;border-radius:13px;border:1px solid var(--border);background:var(--surface-2);">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px;">📘 Secondary Paths</div>
        <sc-for list="{{ enrollPanelSecondaries }}" as="sp" hint-placeholder-count="2">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:9px;background:var(--surface);border:1px solid var(--border);margin-bottom:7px;">
            <span style="font-size:13px;font-weight:600;">{{ sp.name }} › {{ sp.level }}</span>
            <button onClick="{{ sp.remove }}" style="font-size:13px;color:#dc2626;background:none;border:none;cursor:pointer;font-weight:700;">×</button>
          </div>
        </sc-for>
        <div style="font-size:11.5px;font-weight:600;color:var(--text-3);margin:10px 0 8px;">+ Agregar secondary path</div>
        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <select value="{{ enrollPanelAddSecPath }}" onChange="{{ setEnrollSecPath }}" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);font-size:13px;color:var(--text);outline:none;">
            <option value="">Path…</option>
            <sc-for list="{{ programOptions }}" as="o" hint-placeholder-count="10"><option value="{{ o.id }}">{{ o.name }}</option></sc-for>
          </select>
          <select value="{{ enrollPanelAddSecLevel }}" onChange="{{ setEnrollSecLevel }}" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);font-size:13px;color:var(--text);outline:none;">
            <option value="">Level…</option>
            <sc-for list="{{ enrollSecLevelOptions }}" as="lo" hint-placeholder-count="4"><option value="{{ lo.value }}">{{ lo.label }}</option></sc-for>
          </select>
        </div>
        <button onClick="{{ addSecondaryPath }}" style="width:100%;padding:9px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:13px;font-weight:600;cursor:pointer;">Agregar Secondary Path</button>
      </div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;">
      <button onClick="{{ closeEnrollPanel }}" style="padding:10px 22px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:13px;font-weight:700;">Cerrar</button>
    </div>
  </div>
</div>
</sc-if>
```

- [ ] **Step 7: Exponer `programOptions` desde `vAdmin()` para que el modal del manager pueda usarlo**

`programOptions` ya existe en `vAdmin()`. Verificar que se expone en el return de `vAdmin()`. Si no, agregar:
```js
programOptions: S.courses.map(c=>({id:c.id,name:c.name})),
```

- [ ] **Step 8: Verificar en browser**

Manager → Enrollments: tabla con equipo, progreso, primary/secondary paths. Clic en "Manage" abre modal con dropdowns.

- [ ] **Step 9: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: manager enrollments screen with primary/secondary path panel"
```

---

### Task 7: Manager — Approvals diferencia Evidence vs Homologation

**Files:**
- Modify: `Provana LMS.dc.html` — `vManager()` approvalRows, HTML `<!-- MANAGER: APPROVALS -->` (~línea 731)

- [ ] **Step 1: Actualizar `approvalRows` en `vManager()` para incluir tipo y homologRequests**

Localizar en `vManager()` donde se construye `approvalRows`. Reemplazar:

```js
// Approvals: homologs del equipo (evidence) + homologRequests del learner
const myTeamIds=S.users.filter(u=>u.role==='Learner'&&S.managers.some(m=>m.id===u.managerId&&m.name==='Carlos Mendez')).map(u=>u.id);
const evidenceRows=this.homologs().filter(h=>myTeamIds.includes(h.userId)).map(h=>({
  ...h, type:'evidence', typeBg:this.mix('#2563eb',12), typeColor:'#2563eb', typeLabel:'Evidence',
  approve:()=>this.approve(h), reject:()=>this.openReject(h)
}));
const homReqs=(S.homologRequests||[]).filter(h=>h.status==='pending').map(h=>{
  const u=this.userById(h.userId); const res=S.resources.find(r=>r.id===h.resourceId)||{title:h.title,platform:'—'};
  return { id:h.id, res:{...res,title:h.title||res.title,evidence:h.evidence||'evidencia.pdf'}, user:u,
    overdue:false, submittedLabel:this.fmtDate(h.submitted),
    type:'homologation', typeBg:this.mix('#7c3aed',12), typeColor:'#7c3aed', typeLabel:'Homologation',
    approve:()=>this.approveHomologRequest(h.id),
    reject:()=>this.openReject({resId:h.resourceId,res:{title:h.title},user:u}) };
});
const approvalRows=[...evidenceRows,...homReqs].sort((a,b)=>new Date(a.submitted||'2026-06-01')-new Date(b.submitted||'2026-06-01'));
const approvalsEmpty=approvalRows.length===0;
```

- [ ] **Step 2: Agregar método `approveHomologRequest`**

```js
approveHomologRequest(reqId){
  const req=this.state.homologRequests.find(r=>r.id===reqId); if(!req) return;
  const resources=this.state.resources.map(r=>r.id===req.resourceId?{...r,status:'completed',hasCert:true,score:90,completedDate:this.TODAY}:r);
  const homologRequests=this.state.homologRequests.map(r=>r.id===reqId?{...r,status:'approved'}:r);
  this.setState({resources,homologRequests});
  this.pushNotif('Homologación aprobada: "'+req.title+'"','approved');
  this.flash('Homologación aprobada — recurso marcado como completado','ok');
}
```

- [ ] **Step 3: Actualizar HTML de `<!-- MANAGER: APPROVALS -->`**

Localizar la card de aprobación (~línea 736) y agregar el badge de tipo justo después del nombre del recurso:

```html
<div style="display:flex;align-items:center;gap:10px;">
  <span style="font-size:14.5px;font-weight:700;">{{ h.res.title }}</span>
  <span style="font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:20px;background:{{ h.typeBg }};color:{{ h.typeColor }};">{{ h.typeLabel }}</span>
  <sc-if value="{{ h.overdue }}" hint-placeholder-val="{{ false }}"><span style="font-size:10.5px;font-weight:700;color:#dc2626;background:color-mix(in srgb,#dc2626 12%,var(--surface));padding:2px 9px;border-radius:20px;">OVERDUE</span></sc-if>
</div>
```

- [ ] **Step 4: Verificar en browser**

Manager → Approvals: items con badge "Evidence" (azul) y "Homologation" (morado). La homologación de Yolanda para "Performance Testing with JMeter" aparece con badge morado.

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: manager approvals differentiates evidence vs homologation requests"
```

---

### Task 8: Learner — sidebar nav rediseñado + pantalla Home

**Files:**
- Modify: `Provana LMS.dc.html` — `vNav()` learner section (~línea 1738), `vLearner()`, HTML `<!-- LEARNER: MY LEARNING -->` (~línea 753)

- [ ] **Step 1: Actualizar nav del Learner en `vNav()`**

Reemplazar el bloque `} else {` del learner nav:
```js
} else {
  navItems=[
    item('home','Home',[['rect',{x:3,y:3,width:7,height:9}],['rect',{x:14,y:3,width:7,height:5}],['rect',{x:14,y:12,width:7,height:9}],['rect',{x:3,y:16,width:7,height:5}]],0,''),
    item('mypaths','Mis Paths',[['path','M4 19.5A2.5 2.5 0 0 1 6.5 17H20'],['path','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z']],0,''),
    item('explore','Explorar',[['circle',{cx:12,cy:12,r:10}],['polygon',{points:'16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76'}]],0,''),
    item('homologar','Homologar',[['path','M9 11l3 3L22 4'],['path','M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']],0,'')
  ];
}
```

- [ ] **Step 2: Actualizar `setViewer` para learner default screen**

Localizar `setViewer` (~línea 1465):
```js
setViewer(v){ const def={admin:'paths',manager:'team',learner:'mylearning'}[v]; ...
```
Cambiar `learner:'mylearning'` por `learner:'home'`.

- [ ] **Step 3: Agregar state para learner home**

En `state = { ... }`, cambiar `screen:'paths'` inicial para admins y asegurarse que el título de screen 'home' esté en `vChrome()` titles:
```js
home:['Home','Tu aprendizaje de hoy'],
mypaths:['Mis Paths','Todos tus paths asignados'],
homologar:['Homologar','Solicita crédito por cursos previos'],
```

- [ ] **Step 4: Reemplazar HTML `<!-- LEARNER: MY LEARNING -->` con pantalla Home**

Reemplazar todo el bloque desde `<!-- LEARNER: MY LEARNING -->` hasta su `</sc-if>` (~líneas 753–850) con:

```html
<!-- LEARNER: HOME -->
<sc-if value="{{ showHome }}" hint-placeholder-val="{{ false }}">
<div style="max-width:1000px;margin:0 auto;">

  <!-- Continue hero -->
  <sc-if value="{{ hasContinue }}" hint-placeholder-val="{{ true }}">
  <div style="border-radius:20px;overflow:hidden;background:linear-gradient(125deg,{{ cl_color }},{{ cl_colorDark }});padding:24px 28px;margin-bottom:20px;box-shadow:var(--shadow-lg);">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;">
      <div style="min-width:0;color:#fff;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.8;margin-bottom:7px;">Continuar donde dejé</div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-.01em;">{{ cl_title }}</div>
        <div style="font-size:12.5px;opacity:.85;margin-top:4px;">{{ cl_breadcrumb }}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:14px;max-width:380px;">
          <div style="flex:1;height:7px;border-radius:6px;background:rgba(255,255,255,.25);overflow:hidden;"><div style="height:100%;width:{{ cl_progress }}%;background:#fff;border-radius:6px;"></div></div>
          <span style="font-size:13px;font-weight:700;color:#fff;">{{ cl_progress }}%</span>
        </div>
      </div>
      <button onClick="{{ cl_continue }}" style="display:flex;align-items:center;gap:9px;padding:13px 24px;border-radius:13px;border:none;background:#fff;color:#1c1830;font-size:14px;font-weight:700;flex-shrink:0;">Continuar<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
    </div>
  </div>
  </sc-if>

  <!-- Primary Path card -->
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px 22px;box-shadow:var(--shadow);margin-bottom:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);">🎯 Mi Path Principal</div>
      <button onClick="{{ goMyPaths }}" style="font-size:12px;font-weight:700;color:var(--brand);background:none;border:none;cursor:pointer;">Ver path →</button>
    </div>
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="flex:1;">
        <div style="font-size:17px;font-weight:800;color:var(--text);">{{ homePrimaryName }}</div>
        <div style="font-size:13px;color:var(--text-2);margin-top:2px;">{{ homePrimaryLevel }}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:12px;">
          <div style="flex:1;height:8px;border-radius:6px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ homePrimaryProg }}%;background:var(--brand);border-radius:6px;"></div></div>
          <span style="font-size:12.5px;font-weight:700;color:var(--text-2);">{{ homePrimaryProg }}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Secondary Paths -->
  <sc-if value="{{ homeHasSecondary }}" hint-placeholder-val="{{ false }}">
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px 22px;box-shadow:var(--shadow);margin-bottom:16px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px;">📘 Paths Secundarios</div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <sc-for list="{{ homeSecondaries }}" as="sp" hint-placeholder-count="2">
        <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:11px;background:var(--surface-2);border:1px solid var(--border);">
          <div style="width:8px;height:8px;border-radius:50%;background:{{ sp.color }};flex-shrink:0;"></div>
          <div style="flex:1;"><div style="font-size:13px;font-weight:600;">{{ sp.name }}</div><div style="font-size:11.5px;color:var(--text-3);">{{ sp.level }}</div></div>
          <div style="display:flex;align-items:center;gap:8px;width:120px;"><div style="flex:1;height:5px;border-radius:4px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ sp.prog }}%;background:{{ sp.color }};border-radius:4px;"></div></div><span style="font-size:11px;font-weight:700;color:var(--text-2);">{{ sp.prog }}%</span></div>
          <button onClick="{{ sp.go }}" style="font-size:12px;font-weight:700;color:var(--brand);background:none;border:none;cursor:pointer;">Ver →</button>
        </div>
      </sc-for>
    </div>
  </div>
  </sc-if>

  <!-- Quick actions -->
  <div style="display:flex;gap:12px;margin-bottom:16px;">
    <button onClick="{{ goMyPaths }}" style="flex:1;padding:13px;border-radius:13px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:13.5px;font-weight:700;cursor:pointer;">📚 Ver mis paths</button>
    <button onClick="{{ goHomologar }}" style="flex:1;padding:13px;border-radius:13px;border:none;background:var(--brand-soft);color:var(--brand);font-size:13.5px;font-weight:700;cursor:pointer;">✅ Homologar curso previo</button>
  </div>

</div>
</sc-if>
```

- [ ] **Step 5: Agregar datos home en `vLearner()`**

En el método `vLearner()`, agregar al return:

```js
showHome: V==='learner'&&S.screen==='home',
goMyPaths:()=>this.setState({screen:'mypaths'}),
goHomologar:()=>this.setState({screen:'homologar'}),
```

Y las variables de home (learner actual = u1, Yolanda):
```js
const learnerUser=S.users.find(u=>u.id==='u1')||S.users.find(u=>u.role==='Learner')||{};
const primaryPath=learnerUser.primaryPathId?this.courseById(learnerUser.primaryPathId):null;
const primaryProg=this.courseProgress(learnerUser.primaryPathId||'qa');
const homeSecondaries=(learnerUser.secondaryPaths||[]).map(sp=>{
  const c=this.courseById(sp.pathId); const prog=Math.floor(Math.random()*40);
  return {...sp,name:c?c.name:'—',color:c?c.color:'#94a3b8',prog,go:()=>this.setState({screen:'mypaths',detailCourse:sp.pathId})};
});
```

Exponer:
```js
homePrimaryName: primaryPath?primaryPath.name:'Sin path asignado',
homePrimaryLevel: learnerUser.primaryLevel||'—',
homePrimaryProg: primaryProg,
homeHasSecondary: homeSecondaries.length>0,
homeSecondaries,
```

- [ ] **Step 6: Verificar en browser**

Learner → Home: muestra "Continuar" hero, card de Primary Path con progreso, secondary paths si aplica, dos botones de acción.

- [ ] **Step 7: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner home screen redesigned — primary/secondary paths, quick actions"
```

---

### Task 9: Learner — pantalla Mi Paths (detalle de path)

**Files:**
- Modify: `Provana LMS.dc.html` — agregar HTML screen `showMyPaths`, agregar datos en `vLearner()`

- [ ] **Step 1: Agregar HTML screen Mi Paths**

Después del bloque `</sc-if>` de Home, agregar:

```html
<!-- LEARNER: MIS PATHS -->
<sc-if value="{{ showMyPaths }}" hint-placeholder-val="{{ false }}">
<div style="max-width:1100px;margin:0 auto;">

  <!-- Path selector tabs -->
  <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
    <sc-for list="{{ myPathTabs }}" as="t" hint-placeholder-count="3">
      <button onClick="{{ t.pick }}" style="{{ t.style }}">{{ t.label }}<sc-if value="{{ t.isPrimary }}" hint-placeholder-val="{{ false }}"> 🎯</sc-if></button>
    </sc-for>
  </div>

  <!-- Tree: Module > Resources -->
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px 24px;box-shadow:var(--shadow);">
    <div style="margin-bottom:16px;">
      <div style="font-size:18px;font-weight:800;color:var(--text);">{{ myPathActiveName }}</div>
      <div style="font-size:13px;color:var(--text-2);margin-top:2px;">{{ myPathActiveLevel }}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:10px;max-width:360px;">
        <div style="flex:1;height:7px;border-radius:6px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ myPathActiveProg }}%;background:var(--brand);border-radius:6px;"></div></div>
        <span style="font-size:12px;font-weight:700;color:var(--text-2);">{{ myPathActiveProg }}% completado</span>
      </div>
    </div>

    <sc-for list="{{ myPathModules }}" as="mod" hint-placeholder-count="4">
      <div style="margin-bottom:14px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);padding:6px 0;border-bottom:1px solid var(--border);margin-bottom:8px;">{{ mod.name }}</div>
        <sc-for list="{{ mod.resources }}" as="r" hint-placeholder-count="3">
          <button onClick="{{ r.open }}" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);margin-bottom:6px;">
            <span style="font-size:16px;flex-shrink:0;">{{ r.statusIcon }}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ r.title }}</div>
              <div style="font-size:11.5px;color:var(--text-3);">{{ r.platform }} · {{ r.duration }}</div>
            </div>
            <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:{{ r.statusBg }};color:{{ r.statusColor }};">{{ r.statusLabel }}</span>
          </button>
        </sc-for>
      </div>
    </sc-for>

    <sc-if value="{{ myPathEmpty }}" hint-placeholder-val="{{ false }}">
      <div style="padding:32px;text-align:center;font-size:13px;color:var(--text-3);">No hay recursos en este path aún.</div>
    </sc-if>
  </div>

</div>
</sc-if>
```

- [ ] **Step 2: Agregar datos myPaths en `vLearner()`**

```js
showMyPaths: V==='learner'&&(S.screen==='mypaths'||S.screen==='course'),
```

Agregar al return:
```js
const activeMyPath=S.detailCourse||learnerUser.primaryPathId||'qa';
const activeMyLevel=learnerUser.primaryLevel||'Senior QA';
const myPathResources=S.resources.filter(r=>r.courseId===activeMyPath&&r.level===activeMyLevel);
const myPathModuleMap={};
myPathResources.forEach(r=>{ (myPathModuleMap[r.module]=myPathModuleMap[r.module]||[]).push(r); });
const STATUS_ICON={'completed':'✅','in-progress':'🔵','waiting':'⏳','not-started':'○'};
const myPathModules=Object.keys(myPathModuleMap).map(mod=>({
  name:mod,
  resources:myPathModuleMap[mod].map(r=>({...this.decorate(r),statusIcon:STATUS_ICON[r.status]||'○',open:()=>this.setState({detailRes:r.id,detailCourse:activeMyPath,evidenceFile:'',screen:'mypaths'})}))
}));
const myPathProg=myPathResources.length?Math.round(myPathResources.filter(r=>r.status==='completed').length/myPathResources.length*100):0;
const allPaths=[
  {pathId:learnerUser.primaryPathId,level:learnerUser.primaryLevel,isPrimary:true},
  ...(learnerUser.secondaryPaths||[]).map(sp=>({...sp,isPrimary:false}))
].filter(p=>p.pathId);
const activeMyPathObj=this.courseById(activeMyPath)||{};
```

Exponer:
```js
myPathTabs: allPaths.map(p=>{
  const c=this.courseById(p.pathId)||{}; const isActive=p.pathId===activeMyPath;
  return { label:c.name||p.pathId, isPrimary:p.isPrimary, pick:()=>this.setState({detailCourse:p.pathId,screen:'mypaths'}),
    style:isActive?'padding:8px 16px;border-radius:20px;border:none;background:var(--brand);color:#fff;font-size:13px;font-weight:700;cursor:pointer;':'padding:8px 16px;border-radius:20px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);font-size:13px;font-weight:500;cursor:pointer;' };
}),
myPathActiveName: activeMyPathObj.name||'—',
myPathActiveLevel: activeMyLevel,
myPathActiveProg: myPathProg,
myPathModules,
myPathEmpty: myPathModules.length===0,
```

- [ ] **Step 3: Verificar en browser**

Learner → Mis Paths: tabs con Primary y Secondary paths. Árbol de módulos con recursos y sus estados visuales.

- [ ] **Step 4: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner my-paths screen with module tree and resource status"
```

---

### Task 10: Learner — Explorar con "Solicitar acceso"

**Files:**
- Modify: `Provana LMS.dc.html` — `vLearner()` exploreCards, HTML `<!-- LEARNER: EXPLORE COURSES -->` (~línea 852)

- [ ] **Step 1: Actualizar `exploreCards` en `vLearner()`**

Los explore cards deben mostrar solo paths NO asignados al learner. Actualizar:

```js
const assignedPathIds=new Set([learnerUser.primaryPathId,...(learnerUser.secondaryPaths||[]).map(sp=>sp.pathId)].filter(Boolean));
const exploreCards=S.courses.filter(c=>!assignedPathIds.has(c.id)).map(c=>{
  const rs=S.resources.filter(r=>r.courseId===c.id);
  const levels=[...new Set(rs.map(r=>r.level))];
  const pending=(S.enrollRequests||[]).some(r=>r.userId===learnerUser.id&&r.pathId===c.id&&r.status==='pending');
  return { ...c, colorDark:this.dark(c.color,28), iconWhite:this.iconEl(c.icon,24,'#fff',2),
    levelCount:levels.size||levels.length, resCount:rs.length,
    skills:[...new Set(rs.flatMap(r=>r.skills||[]))].slice(0,4),
    pending, assigned:false,
    preview:()=>this.setState({previewCourse:c.id,previewOpen:true}),
    request:()=>this.requestSecondaryPath(c.id,levels[0]||'Junior') };
});
```

- [ ] **Step 2: Agregar método `requestSecondaryPath`**

```js
requestSecondaryPath(pathId,level){
  const S=this.state; const learner=S.users.find(u=>u.id==='u1');
  const alreadyReq=(S.enrollRequests||[]).some(r=>r.userId==='u1'&&r.pathId===pathId&&r.status==='pending');
  if(alreadyReq){this.flash('Ya enviaste una solicitud para este path','warn');return;}
  const req={id:'ereq'+Date.now(),userId:'u1',pathId,level,status:'pending',submitted:this.TODAY};
  const c=this.courseById(pathId);
  this.setState({enrollRequests:[...(S.enrollRequests||[]),req]});
  this.pushNotif('Solicitud de acceso enviada: '+( c?c.name:pathId),'assign');
  this.flash('Solicitud enviada al manager','ok');
}
```

- [ ] **Step 3: Actualizar HTML de explore cards**

Localizar el botón de acción en explore cards (~línea 865) y reemplazar:
```html
<div style="display:flex;gap:8px;margin-top:14px;">
  <button onClick="{{ c.preview }}" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:12.5px;font-weight:700;">Preview</button>
  <sc-if value="{{ c.pending }}" hint-placeholder-val="{{ false }}">
    <button style="padding:10px 14px;border-radius:10px;border:none;background:var(--surface-2);color:var(--text-3);font-size:12.5px;font-weight:700;" disabled>Solicitud enviada</button>
  </sc-if>
  <sc-if value="{{ c.pending }}" hint-placeholder-val="{{ true }}">
    <button onClick="{{ c.request }}" style="padding:10px 14px;border-radius:10px;border:none;background:var(--brand);color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;">Solicitar acceso</button>
  </sc-if>
</div>
```

- [ ] **Step 4: Verificar en browser**

Learner → Explorar: solo aparecen paths que el learner NO tiene asignados. El botón "Solicitar acceso" envía la solicitud y cambia a "Solicitud enviada".

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner explore shows unassigned paths with request-access flow"
```

---

### Task 11: Learner — pantalla Homologar

**Files:**
- Modify: `Provana LMS.dc.html` — agregar HTML screen `showHomologar`, métodos JS, datos en `vLearner()`

- [ ] **Step 1: Agregar state para homologar form**

En `state = { ... }` agregar:
```js
homologFormPath:'', homologFormResource:'', homologFormEvidence:'', homologFormNote:'',
```

- [ ] **Step 2: Agregar métodos de homologación**

```js
submitHomologRequest(){
  const S=this.state;
  if(!S.homologFormPath||!S.homologFormResource){this.flash('Selecciona un path y un recurso','warn');return;}
  if(!S.homologFormEvidence){this.flash('Adjunta una evidencia','warn');return;}
  const res=S.resources.find(r=>r.id===S.homologFormResource);
  const req={id:'hreq'+Date.now(),userId:'u1',resourceId:S.homologFormResource,pathId:S.homologFormPath,
    level:res?res.level:'',module:res?res.module:'',title:res?res.title:'',
    evidence:S.homologFormEvidence,note:S.homologFormNote,status:'pending',submitted:this.TODAY,managerNote:''};
  this.setState({homologRequests:[...S.homologRequests,req],homologFormPath:'',homologFormResource:'',homologFormEvidence:'',homologFormNote:''});
  this.pushNotif('Solicitud de homologación enviada al manager','assign');
  this.flash('Solicitud enviada al manager','ok');
}
pickHomologEvidence(){ this.setState({homologFormEvidence:'certificado-'+Date.now()+'.pdf'}); }
```

- [ ] **Step 3: Agregar datos homologar en `vLearner()`**

```js
const homologPathOptions=[
  {id:learnerUser.primaryPathId,name:(this.courseById(learnerUser.primaryPathId)||{}).name||'Primary'},
  ...(learnerUser.secondaryPaths||[]).map(sp=>({id:sp.pathId,name:(this.courseById(sp.pathId)||{}).name||sp.pathId}))
].filter(p=>p.id);
const homologResourceOptions=S.homologFormPath?S.resources.filter(r=>r.courseId===S.homologFormPath&&r.status!=='completed').map(r=>({id:r.id,label:r.title+' ('+r.level+' · '+r.module+')'})):[];
const homologHistory=(S.homologRequests||[]).filter(h=>h.userId==='u1').map(h=>({
  ...h, statusLabel:h.status==='pending'?'Pendiente':h.status==='approved'?'Aprobado':'Rechazado',
  statusColor:h.status==='pending'?'#b45309':h.status==='approved'?'#15803d':'#dc2626',
  statusBg:this.mix(h.status==='pending'?'#b45309':h.status==='approved'?'#15803d':'#dc2626',12),
  submittedLabel:this.fmtDate(h.submitted)
}));
```

Exponer:
```js
showHomologar: V==='learner'&&S.screen==='homologar',
homologPathOptions, homologResourceOptions,
homologFormPath:S.homologFormPath, homologFormResource:S.homologFormResource,
homologFormEvidence:S.homologFormEvidence, homologFormNote:S.homologFormNote,
homologEvidenceLabel:S.homologFormEvidence||'Adjuntar certificado o captura…',
homologEvidenceColor:S.homologFormEvidence?'var(--brand)':'var(--text-3)',
homologHistory, homologHistoryEmpty:homologHistory.length===0,
setHomologPath:(e)=>this.setState({homologFormPath:e.target.value,homologFormResource:''}),
setHomologResource:(e)=>this.setState({homologFormResource:e.target.value}),
setHomologNote:(e)=>this.setState({homologFormNote:e.target.value}),
pickHomologEvidence:()=>this.pickHomologEvidence(),
submitHomologRequest:()=>this.submitHomologRequest(),
```

- [ ] **Step 4: Agregar HTML screen Homologar**

Después del bloque `</sc-if>` de Explorar, agregar:

```html
<!-- LEARNER: HOMOLOGAR -->
<sc-if value="{{ showHomologar }}" hint-placeholder-val="{{ false }}">
<div style="max-width:720px;margin:0 auto;">

  <!-- Form -->
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px 26px;box-shadow:var(--shadow);margin-bottom:20px;">
    <div style="font-size:16px;font-weight:700;margin-bottom:4px;">Solicitar homologación</div>
    <div style="font-size:13px;color:var(--text-3);margin-bottom:20px;">Declara que ya completaste un recurso fuera de la plataforma y sube tu evidencia. Tu manager lo revisará.</div>

    <!-- Step 1: Select resource -->
    <div style="margin-bottom:16px;">
      <label style="font-size:12px;font-weight:700;color:var(--text-2);display:block;margin-bottom:6px;">1. Seleccionar recurso</label>
      <div style="display:flex;gap:10px;">
        <select value="{{ homologFormPath }}" onChange="{{ setHomologPath }}" style="flex:1;padding:10px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);font-size:13px;color:var(--text);outline:none;">
          <option value="">Seleccionar path…</option>
          <sc-for list="{{ homologPathOptions }}" as="po" hint-placeholder-count="3"><option value="{{ po.id }}">{{ po.name }}</option></sc-for>
        </select>
        <select value="{{ homologFormResource }}" onChange="{{ setHomologResource }}" style="flex:1.6;padding:10px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);font-size:13px;color:var(--text);outline:none;">
          <option value="">Seleccionar recurso…</option>
          <sc-for list="{{ homologResourceOptions }}" as="ro" hint-placeholder-count="4"><option value="{{ ro.id }}">{{ ro.label }}</option></sc-for>
        </select>
      </div>
    </div>

    <!-- Step 2: Evidence -->
    <div style="margin-bottom:16px;">
      <label style="font-size:12px;font-weight:700;color:var(--text-2);display:block;margin-bottom:6px;">2. Subir evidencia</label>
      <button onClick="{{ pickHomologEvidence }}" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;border-radius:11px;border:1.5px dashed var(--border);background:var(--surface-2);color:{{ homologEvidenceColor }};font-size:13px;font-weight:600;text-align:left;cursor:pointer;">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8 12 3 7 8"/><path d="M12 3v12"/></svg>
        {{ homologEvidenceLabel }}
      </button>
    </div>

    <!-- Step 3: Note + Submit -->
    <div style="margin-bottom:16px;">
      <label style="font-size:12px;font-weight:700;color:var(--text-2);display:block;margin-bottom:6px;">3. Nota adicional <span style="font-weight:400;color:var(--text-3);">(opcional)</span></label>
      <textarea value="{{ homologFormNote }}" onInput="{{ setHomologNote }}" placeholder="Contexto adicional para tu manager…" style="width:100%;padding:10px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);font-size:13px;color:var(--text);outline:none;min-height:72px;resize:vertical;"></textarea>
    </div>

    <button onClick="{{ submitHomologRequest }}" style="width:100%;padding:13px;border-radius:11px;border:none;background:var(--brand);color:#fff;font-size:14px;font-weight:700;cursor:pointer;">Enviar solicitud al manager</button>
  </div>

  <!-- History -->
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px 24px;box-shadow:var(--shadow);">
    <div style="font-size:14px;font-weight:700;margin-bottom:14px;">Historial de solicitudes</div>
    <sc-if value="{{ homologHistoryEmpty }}" hint-placeholder-val="{{ false }}">
      <div style="padding:20px;text-align:center;font-size:13px;color:var(--text-3);">No has enviado solicitudes aún.</div>
    </sc-if>
    <sc-for list="{{ homologHistory }}" as="h" hint-placeholder-count="2">
      <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ h.title }}</div>
          <div style="font-size:11.5px;color:var(--text-3);margin-top:2px;">Enviado {{ h.submittedLabel }}<sc-if value="{{ h.managerNote }}" hint-placeholder-val="{{ false }}"> · {{ h.managerNote }}</sc-if></div>
        </div>
        <span style="font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px;background:{{ h.statusBg }};color:{{ h.statusColor }};white-space:nowrap;">{{ h.statusLabel }}</span>
      </div>
    </sc-for>
  </div>

</div>
</sc-if>
```

- [ ] **Step 5: Verificar en browser**

Learner → Homologar: formulario con 3 pasos, dropdowns de path y recurso, botón de evidencia, historial debajo. Enviar muestra toast y aparece en historial como "Pendiente". El manager ve la solicitud en Approvals con badge "Homologation".

- [ ] **Step 6: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner homologar screen — 3-step form, history, manager approval integration"
```

---

## Resumen de tareas

| # | Tarea | Screen afectado |
|---|---|---|
| 1 | Data model: 10 role paths, seniority levels, secondaryPaths, homologRequests | State |
| 2 | Admin Paths: 10 role cards | Admin → Paths |
| 3 | Admin Levels: seniority levels | Admin → Levels |
| 4 | Admin Modules: sin columna Skills | Admin → Modules |
| 5 | Admin Users: columna Primary Path | Admin → Users |
| 6 | Manager Enrollments: primary/secondary panel | Manager → Enrollments (nuevo) |
| 7 | Manager Approvals: badge Evidence/Homologation | Manager → Approvals |
| 8 | Learner Home: rediseñado, 4 nav items | Learner → Home (nuevo) |
| 9 | Learner Mi Paths: árbol módulos/recursos | Learner → Mis Paths (nuevo) |
| 10 | Learner Explorar: solicitar acceso a secondary path | Learner → Explorar |
| 11 | Learner Homologar: formulario + historial | Learner → Homologar (nuevo) |

**Orden recomendado:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11. Cada tarea hace commit independiente.
