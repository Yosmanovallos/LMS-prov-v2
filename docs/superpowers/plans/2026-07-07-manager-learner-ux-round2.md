# Manager + Learner UX Round 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limpiar el Team Overview del manager (sin Avg Completion), rediseñar Team Progress con columnas Primary/Secondary path y progreso por cada una, renombrar History → Achievements en el learner, simplificar Active Learning (chip "In Progress" en vez de porcentajes) y agregar una vista de detalle de path para el learner con la jerarquía completa (levels → modules → resources), skills, progreso total y navegación por estado (in-progress → Active Learning, not-started → ToDo, completed → Achievements).

**Architecture:** Todo el trabajo ocurre en `Provana LMS.dc.html`. Manager: `vManager()` (~línea 2504) alimenta los templates `MANAGER: TEAM OVERVIEW` (~661) y `MANAGER: TEAM PROGRESS` (~709). Learner: `vLearner()` (~2591) alimenta `LEARNER: PATHS (landing)` (~837) y `LEARNER: CONTENT HERO / ACTIVE LEARNING` (~890). La nueva pantalla `pathdetail` sigue el patrón existente: key de screen + entrada en `titles` de `vChrome()` + bloque `<sc-if value="{{ showPathDetail }}">` + props en `vLearner()`. La jerarquía se deriva con el helper existente `this.tree(courseId)` (línea 1708) y `this.decorate(r)` para los chips de estado.

**Tech Stack:** HTML + CSS variables (design system existente) + DCLogic, sin dependencias nuevas.

## Global Constraints

- Solo modificar `Provana LMS.dc.html` — ningún otro archivo.
- Mantener el design system existente: variables CSS `--brand`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-2`, `--text-3`, `--brand-soft`, `--shadow`.
- No agregar dependencias externas.
- El "Avg completion" del **admin** (peopleStats, línea ~2350) NO se toca — solo el del manager.
- Cada tarea termina con un commit funcional (el archivo abre en browser sin errores de consola).
- Verificación por tarea: abrir `Provana LMS.dc.html` en browser, cambiar de rol con el switcher del sidebar y revisar visualmente la pantalla afectada.
- Los números de línea son del estado actual del archivo; se corren a medida que se editan tareas anteriores — usar los snippets como ancla, no la línea.

---

### Task 1: Manager Team Overview — quitar "Avg completion"

**Files:**
- Modify: `Provana LMS.dc.html` — template Team Overview (~línea 664) y `vManager()` `mgrCards` (~líneas 2508, 2546-2549)

**Interfaces:**
- Produces: `mgrCards` pasa de 4 a 3 tarjetas; el grid del template pasa a 3 columnas.

- [ ] **Step 1: Grid de 4 → 3 columnas**

Localizar (~línea 664):
```html
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px;">
```
Reemplazar `repeat(4,1fr)` por `repeat(3,1fr)`.

- [ ] **Step 2: Quitar la tarjeta y el cálculo de `avg`**

Localizar (~línea 2508):
```js
    const avg=enr.length?Math.round(enr.reduce((a,e)=>a+e.prog,0)/enr.length):0;
```
Eliminar la línea (solo se usa en mgrCards).

Localizar (~líneas 2546-2549):
```js
      mgrCards:[ {value:team.length,label:'Team learners',color:'var(--text)',flag:false},
        {value:avg+'%',label:'Avg completion',color:'var(--text)',flag:false},
        {value:approvalRows.length,label:'Pending approvals',color:approvalRows.length?'#dc2626':'var(--text)',flag:approvalRows.length>0},
        {value:atRisk.length,label:'At-risk learners',color:atRisk.length?'#b45309':'var(--text)',flag:false} ],
```
Reemplazar con:
```js
      mgrCards:[ {value:team.length,label:'Team learners',color:'var(--text)',flag:false},
        {value:approvalRows.length,label:'Pending approvals',color:approvalRows.length?'#dc2626':'var(--text)',flag:approvalRows.length>0},
        {value:atRisk.length,label:'At-risk learners',color:atRisk.length?'#b45309':'var(--text)',flag:false} ],
```

- [ ] **Step 3: Verificar en browser**

Abrir el archivo, switcher → Manager → Team Overview. Esperado: 3 tarjetas (Team learners, Pending approvals, At-risk learners), sin "Avg completion", sin errores de consola.

- [ ] **Step 4: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: drop avg completion card from manager team overview"
```

---

### Task 2: Manager Team Progress — columnas Primary / Secondary con progreso

**Files:**
- Modify: `Provana LMS.dc.html` — template Team Progress (~líneas 713-723) y `vManager()` `progressRows` (~líneas 2519-2527)

**Interfaces:**
- Consumes: `this.enrollments()` (primary prog/status/last), `this.courseById(id)`, `u.secondaryPaths` (`[{pathId,level}]`).
- Produces: cada row de `progressRows` expone `courseName, courseColor, level, prog, secondaries:[{name,color,level,prog}], noSecondaries, last, statusLabel, statusColor, statusBg`.

Team Progress ahora muestra TODO lo que cada learner tiene en progreso (primary + secondaries con su barra cada una), sin depender de la vista de Enrollments. Se elimina la columna "Course/Current Level/Progress" separada y se compacta en dos celdas ricas.

- [ ] **Step 1: Reescribir `progressRows` en `vManager()`**

Localizar (~líneas 2519-2527):
```js
    const stMap={ 'not-started':['Inactive','#94a3b8'], 'in-progress':['On Track','#2563eb'], 'awaiting':['Behind','#b45309'], 'completed':['Completed','#15803d'] };
    const progressRows=enr.map(e=>{
      const lvl=this.state.resources.filter(r=>r.courseId===e.primaryPathId).map(r=>r.level);
      const curLevel=lvl[0]||'—';
      const st= e.prog<10?['Inactive','#94a3b8']: (e.prog>=100?['Completed','#15803d']: (e.prog<40?['Behind','#b45309']:['On Track','#2563eb']));
      return { id:e.id, name:e.name, initials:this.initials(e.name), avatarBg:this.avatarBg(e.name), email:e.email,
        courseName:e.course?e.course.name:'—', courseColor:e.course?e.course.color:'#64748b', level:curLevel, prog:e.prog, last:e.last,
        statusLabel:st[0], statusColor:st[1], statusBg:this.mix(st[1],14) };
    });
```
Reemplazar con (nota: `stMap` era código muerto, se elimina; el nivel primary ahora sale de `e.primaryLevel`; progreso de secondaries con mapa fijo, mismo patrón que el resto del sample data):
```js
    const secProgMap={ u1:{dev:14}, u2:{qa:25}, u6:{bi:60} };
    const progressRows=enr.map(e=>{
      const st= e.prog<10?['Inactive','#94a3b8']: (e.prog>=100?['Completed','#15803d']: (e.prog<40?['Behind','#b45309']:['On Track','#2563eb']));
      const secondaries=(e.secondaryPaths||[]).map(sp=>{
        const c=this.courseById(sp.pathId);
        return { name:c?c.name:'—', color:c?c.color:'#94a3b8', level:sp.level, prog:(secProgMap[e.id]||{})[sp.pathId]||0 };
      });
      return { id:e.id, name:e.name, initials:this.initials(e.name), avatarBg:this.avatarBg(e.name), email:e.email,
        courseName:e.course?e.course.name:'—', courseColor:e.course?e.course.color:'#64748b', level:e.primaryLevel||'—', prog:e.prog, last:e.last,
        secondaries, noSecondaries:secondaries.length===0,
        statusLabel:st[0], statusColor:st[1], statusBg:this.mix(st[1],14) };
    });
```

- [ ] **Step 2: Reescribir el template de la tabla**

Localizar el bloque completo (~líneas 713-723), desde el header de la tabla hasta el cierre del `sc-for`:
```html
          <div style="display:grid;grid-template-columns:1.6fr 1.4fr 1.1fr 1.4fr 1fr 1fr;gap:14px;padding:13px 22px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--text-3);text-transform:uppercase;"><div>Learner</div><div>Course</div><div>Current Level</div><div>Progress</div><div>Last Active</div><div>Status</div></div>
          <sc-for list="{{ progressRows }}" as="p" hint-placeholder-count="6">
            <div style="display:grid;grid-template-columns:1.6fr 1.4fr 1.1fr 1.4fr 1fr 1fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--border);align-items:center;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;"><div style="width:34px;height:34px;border-radius:50%;background:{{ p.avatarBg }};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11.5px;flex-shrink:0;">{{ p.initials }}</div><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.name }}</div></div>
              <div style="display:flex;align-items:center;gap:7px;min-width:0;"><span style="width:8px;height:8px;border-radius:3px;background:{{ p.courseColor }};flex-shrink:0;"></span><span style="font-size:12.5px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.courseName }}</span></div>
              <div style="font-size:12.5px;color:var(--text-2);">{{ p.level }}</div>
              <div style="display:flex;align-items:center;gap:9px;"><div style="flex:1;height:7px;border-radius:6px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ p.prog }}%;background:var(--brand);border-radius:6px;"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-2);width:30px;text-align:right;">{{ p.prog }}%</span></div>
              <div style="font-size:12px;color:var(--text-3);">{{ p.last }}</div>
              <div><span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;background:{{ p.statusBg }};color:{{ p.statusColor }};">{{ p.statusLabel }}</span></div>
            </div>
          </sc-for>
```
Reemplazar con:
```html
          <div style="display:grid;grid-template-columns:1.4fr 1.8fr 1.8fr 0.9fr 0.9fr;gap:14px;padding:13px 22px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--text-3);text-transform:uppercase;"><div>Learner</div><div>Primary Path</div><div>Secondary Paths</div><div>Last Active</div><div>Status</div></div>
          <sc-for list="{{ progressRows }}" as="p" hint-placeholder-count="6">
            <div style="display:grid;grid-template-columns:1.4fr 1.8fr 1.8fr 0.9fr 0.9fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--border);align-items:center;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;"><div style="width:34px;height:34px;border-radius:50%;background:{{ p.avatarBg }};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11.5px;flex-shrink:0;">{{ p.initials }}</div><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.name }}</div></div>
              <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:7px;min-width:0;"><span style="width:8px;height:8px;border-radius:3px;background:{{ p.courseColor }};flex-shrink:0;"></span><span style="font-size:12.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.courseName }}</span><span style="font-size:11px;color:var(--text-3);flex-shrink:0;">{{ p.level }}</span></div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:6px;"><div style="flex:1;height:6px;border-radius:4px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ p.prog }}%;background:{{ p.courseColor }};border-radius:4px;"></div></div><span style="font-size:11.5px;font-weight:700;color:var(--text-2);width:32px;text-align:right;">{{ p.prog }}%</span></div>
              </div>
              <div style="display:flex;flex-direction:column;gap:7px;min-width:0;">
                <sc-for list="{{ p.secondaries }}" as="sp" hint-placeholder-count="1">
                  <div style="min-width:0;">
                    <div style="display:flex;align-items:center;gap:7px;min-width:0;"><span style="width:7px;height:7px;border-radius:3px;background:{{ sp.color }};flex-shrink:0;"></span><span style="font-size:12px;font-weight:600;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ sp.name }}</span><span style="font-size:10.5px;color:var(--text-3);flex-shrink:0;">{{ sp.level }}</span></div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:4px;"><div style="flex:1;height:5px;border-radius:4px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ sp.prog }}%;background:{{ sp.color }};border-radius:4px;"></div></div><span style="font-size:11px;font-weight:700;color:var(--text-3);width:32px;text-align:right;">{{ sp.prog }}%</span></div>
                  </div>
                </sc-for>
                <sc-if value="{{ p.noSecondaries }}" hint-placeholder-val="{{ false }}"><span style="font-size:12px;color:var(--text-3);">—</span></sc-if>
              </div>
              <div style="font-size:12px;color:var(--text-3);">{{ p.last }}</div>
              <div><span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;background:{{ p.statusBg }};color:{{ p.statusColor }};">{{ p.statusLabel }}</span></div>
            </div>
          </sc-for>
```

- [ ] **Step 3: Verificar en browser**

Manager → Team Progress. Esperado: Yolanda Ortega muestra QA (primary, con nivel y barra) + Developer 14% como secondary; Mateo Castro muestra QA 25% secondary; Lucia Fernandez muestra BI 60% secondary; el resto muestra "—" en Secondary Paths. Sin errores de consola.

- [ ] **Step 4: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: team progress shows primary and secondary paths with per-path progress"
```

---

### Task 3: Learner — renombrar History → Achievements

**Files:**
- Modify: `Provana LMS.dc.html` — `vChrome()` titles (~línea 2063) y `vNav()` learner (~línea 2167)

La key interna de screen sigue siendo `'history'` (no se renombra estado ni `showHistory`) — solo cambia el copy visible y el ícono (trofeo).

- [ ] **Step 1: Título de página**

Localizar (~línea 2063):
```js
      history:['History','Completed resources'],
```
Reemplazar con:
```js
      history:['Achievements','Everything you have completed in this path'],
```

- [ ] **Step 2: Item del sidebar con ícono de trofeo**

Localizar (~línea 2167):
```js
        item('history','History',[['path','M3 3v18h18'],['path','M18 17V9'],['path','M13 17V5'],['path','M8 17v-3']],0,'lcontent'),
```
Reemplazar con:
```js
        item('history','Achievements',[['path','M6 9H4.5a2.5 2.5 0 0 1 0-5H6'],['path','M18 9h1.5a2.5 2.5 0 0 0 0-5H18'],['path','M4 22h16'],['path','M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22'],['path','M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22'],['path','M18 2H6v7a6 6 0 0 0 12 0V2Z']],0,'lcontent'),
```

- [ ] **Step 3: Verificar en browser**

Learner → sidebar muestra "Achievements" con trofeo; al entrar, el título de página dice "Achievements". La tabla y el hero funcionan igual.

- [ ] **Step 4: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: rename learner history to achievements with trophy icon"
```

---

### Task 4: Active Learning — chip "In Progress" en vez de porcentajes

**Files:**
- Modify: `Provana LMS.dc.html` — template ACTIVE LEARNING (~líneas 899-908)

Las cards de Active Learning dejan de mostrar barra + `%` y muestran un chip "In Progress" (mismo estilo que el chip "Awaiting approval" existente, en azul). Se conservan "Last activity" y el botón Continue.

- [ ] **Step 1: Reemplazar el bloque de progreso**

Localizar (~líneas 899-908):
```html
              <sc-if value="{{ !c.isWaiting }}" hint-placeholder-val="{{ true }}">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                  <div style="flex:1;height:6px;border-radius:4px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ c.progressVal }}%;background:var(--brand);border-radius:4px;"></div></div>
                  <span style="font-size:12px;font-weight:700;color:var(--text-2);">{{ c.progressVal }}%</span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <span style="font-size:11.5px;color:var(--text-3);">Last activity · {{ c.lastActivity }}</span>
                  <a href="{{ c.continueLink }}" target="_blank" style="font-size:12.5px;font-weight:700;color:#fff;background:var(--brand);padding:7px 14px;border-radius:9px;text-decoration:none;">Continue →</a>
                </div>
              </sc-if>
```
Reemplazar con:
```html
              <sc-if value="{{ !c.isWaiting }}" hint-placeholder-val="{{ true }}">
                <span style="display:inline-block;font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px;background:color-mix(in srgb,#2563eb 12%,var(--surface));color:#2563eb;margin-bottom:10px;">In Progress</span>
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <span style="font-size:11.5px;color:var(--text-3);">Last activity · {{ c.lastActivity }}</span>
                  <a href="{{ c.continueLink }}" target="_blank" style="font-size:12.5px;font-weight:700;color:#fff;background:var(--brand);padding:7px 14px;border-radius:9px;text-decoration:none;">Continue →</a>
                </div>
              </sc-if>
```

- [ ] **Step 2: Verificar en browser**

Learner → Active Learning. Esperado: cards con chip azul "In Progress" (o "Awaiting approval" ámbar), sin barras ni `%`, con Last activity y Continue.

- [ ] **Step 3: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: active learning cards show in-progress chip instead of percentages"
```

---

### Task 5: Learner — vista de detalle de path (jerarquía completa)

**Files:**
- Modify: `Provana LMS.dc.html` — state (~línea 1475), `vChrome()` titles (~línea 2060), `vNav()` item factory (~línea 2124), template nuevo después del bloque `LEARNER: PATHS (landing)` (~línea 857), `vLearner()` (`pathLandingCards` pick ~2624 + props nuevas)

**Interfaces:**
- Consumes: `this.tree(pathId)` → `[{path, levels:[{level, modules:[{module, resources}]}]}]`; `this.decorate(r)` → `statusLabel/statusBg/statusColor/platColor/duration`; `this.learnerLevelForPath(pathId)`; `this.courseById(id)`; `this.iconEl(icon,size,color,sw)`; `this.dark(color,n)`.
- Produces: screen key `'pathdetail'`, state key `pathDetail` (courseId), props `showPathDetail, pd_name, pd_myLevel, pd_color, pd_colorDark, pd_icon, pd_isPrimary, pd_prog, pd_levelCount, pd_resCount, pd_inProgressCount, pd_doneCount, pd_skills, pd_hasSkills, pd_levels, pd_back`.

Al hacer click en un path del landing "Paths", en vez de saltar directo a Active Learning se abre una vista de detalle: hero con progreso total y stats, chips de skills, y la jerarquía levels → modules → resources con chip de estado por resource. Click en un resource navega según estado: in-progress/waiting → Active Learning, completed → Achievements, not-started → ToDo (siempre fijando `myPathActive` a ese path).

- [ ] **Step 1: Agregar `pathDetail` al state**

Localizar (~línea 1475):
```js
    myPathActive:null,
```
Reemplazar con:
```js
    myPathActive:null, pathDetail:null,
```

- [ ] **Step 2: Título de página**

Localizar (~línea 2060):
```js
      mypaths:['Paths','All your assigned paths'],
```
Reemplazar con:
```js
      mypaths:['Paths','All your assigned paths'],
      pathdetail:['Path Overview','Levels, modules and resources in this path'],
```

- [ ] **Step 3: Mantener "Paths" activo en el sidebar durante pathdetail**

Localizar en `vNav()` (~línea 2124):
```js
    const item=(key,label,paths,badge,grp)=>({ isItem:true, isHeading:false, label, icon:I(paths), go:()=>this.go(key), style:S.screen===key?on:off, hasBadge:!!badge&&badge>0, badge, visible:!coll[grp] });
```
Reemplazar con:
```js
    const item=(key,label,paths,badge,grp)=>({ isItem:true, isHeading:false, label, icon:I(paths), go:()=>this.go(key), style:(S.screen===key||(key==='mypaths'&&S.screen==='pathdetail'))?on:off, hasBadge:!!badge&&badge>0, badge, visible:!coll[grp] });
```

- [ ] **Step 4: El click de las path cards abre el detalle**

Localizar en `vLearner()` (~línea 2624):
```js
        pick:()=>this.setState({myPathActive:p.pathId,screen:'active'}) };
```
Reemplazar con:
```js
        pick:()=>this.setState({pathDetail:p.pathId,screen:'pathdetail'}) };
```

- [ ] **Step 5: Computar el view-model del detalle en `vLearner()`**

Localizar el comentario (~línea 2627):
```js
    // shared hero + path pills (used by todo/active/history/certificates)
```
Insertar justo antes:
```js
    // path detail (drill-down desde Paths landing)
    const pdId=S.pathDetail;
    const pdCourse=pdId?this.courseById(pdId):null;
    const pdAllRes=pdId?S.resources.filter(r=>r.courseId===pdId):[];
    const pdDone=pdAllRes.filter(r=>r.status==='completed').length;
    const pdMyLevel=pdId?this.learnerLevelForPath(pdId):'—';
    const pdGo=(r)=>{ const target=(r.status==='in-progress'||r.status==='waiting')?'active':(r.status==='completed'?'history':'todo'); this.setState({myPathActive:pdId,screen:target,detailRes:null}); };
    const pdLevels=pdId?this.tree(pdId).flatMap(p=>p.levels).map(l=>{
      const lres=l.modules.flatMap(m=>m.resources);
      const ldone=lres.filter(r=>r.status==='completed').length;
      return { level:l.level, isMyLevel:l.level===pdMyLevel, done:ldone, total:lres.length,
        prog:lres.length?Math.round(ldone/lres.length*100):0,
        modules:l.modules.map(m=>({ module:m.module, count:m.resources.length,
          resources:m.resources.map(r=>({ ...this.decorate(r), go:()=>pdGo(r) })) })) };
    }):[];
    const pdSkills=[...new Set(pdAllRes.flatMap(r=>r.skills||[]))].slice(0,8);
```

- [ ] **Step 6: Exponer las props en el return de `vLearner()`**

Localizar (~línea 2710):
```js
      pathLandingCards,
```
Reemplazar con:
```js
      pathLandingCards,
      showPathDetail:isLn&&S.screen==='pathdetail'&&!!pdCourse,
      pd_name:pdCourse?pdCourse.name:'', pd_myLevel:pdMyLevel,
      pd_color:(pdCourse&&pdCourse.color)||'#4A2E80', pd_colorDark:this.dark((pdCourse&&pdCourse.color)||'#4A2E80',30),
      pd_icon:pdCourse?this.iconEl(pdCourse.icon,22,'#fff',2):null,
      pd_isPrimary:!!pdId&&pdId===learnerUser.primaryPathId,
      pd_prog:pdAllRes.length?Math.round(pdDone/pdAllRes.length*100):0,
      pd_levelCount:pdLevels.length, pd_resCount:pdAllRes.length,
      pd_inProgressCount:pdAllRes.filter(r=>r.status==='in-progress'||r.status==='waiting').length,
      pd_doneCount:pdDone,
      pd_skills:pdSkills, pd_hasSkills:pdSkills.length>0,
      pd_levels:pdLevels,
      pd_back:()=>this.setState({screen:'mypaths',pathDetail:null}),
```

- [ ] **Step 7: Agregar el template de la pantalla**

Localizar el cierre del landing (~líneas 855-857):
```html
        </div>
      </div>
      </sc-if>

      <!-- LEARNER: CONTENT HERO (shared) -->
```
Insertar entre `</sc-if>` y `<!-- LEARNER: CONTENT HERO (shared) -->`:
```html

      <!-- LEARNER: PATH DETAIL -->
      <sc-if value="{{ showPathDetail }}" hint-placeholder-val="{{ false }}">
      <div style="max-width:1000px;margin:0 auto;">
        <button onClick="{{ pd_back }}" style="display:flex;align-items:center;gap:7px;background:none;border:none;color:var(--text-2);font-size:13px;font-weight:600;cursor:pointer;margin-bottom:14px;padding:0;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>All paths</button>

        <div style="border-radius:20px;background:linear-gradient(125deg,{{ pd_color }},{{ pd_colorDark }});padding:22px 26px;margin-bottom:16px;box-shadow:var(--shadow-lg);color:#fff;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;">
            <div style="display:flex;align-items:center;gap:14px;min-width:0;">
              <span style="width:48px;height:48px;border-radius:13px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ pd_icon }}</span>
              <div style="min-width:0;">
                <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.8;"><sc-if value="{{ pd_isPrimary }}" hint-placeholder-val="{{ true }}">🎯 Primary path</sc-if><sc-if value="{{ !pd_isPrimary }}" hint-placeholder-val="{{ false }}">📘 Secondary path</sc-if></div>
                <div style="font-size:20px;font-weight:800;">{{ pd_name }}</div>
                <div style="font-size:12.5px;opacity:.85;">Your level: {{ pd_myLevel }}</div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:26px;font-weight:800;">{{ pd_prog }}%</div>
              <div style="font-size:11.5px;opacity:.8;">total progress</div>
            </div>
          </div>
          <div style="display:flex;gap:24px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.25);">
            <div><div style="font-size:16px;font-weight:800;">{{ pd_levelCount }}</div><div style="font-size:11px;opacity:.8;">levels</div></div>
            <div><div style="font-size:16px;font-weight:800;">{{ pd_resCount }}</div><div style="font-size:11px;opacity:.8;">resources</div></div>
            <div><div style="font-size:16px;font-weight:800;">{{ pd_inProgressCount }}</div><div style="font-size:11px;opacity:.8;">in progress</div></div>
            <div><div style="font-size:16px;font-weight:800;">{{ pd_doneCount }}</div><div style="font-size:11px;opacity:.8;">completed</div></div>
          </div>
        </div>

        <sc-if value="{{ pd_hasSkills }}" hint-placeholder-val="{{ false }}">
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px;">
          <sc-for list="{{ pd_skills }}" as="s" hint-placeholder-count="4"><span style="font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;background:var(--brand-soft);color:var(--brand);">{{ s }}</span></sc-for>
        </div>
        </sc-if>

        <div style="display:flex;flex-direction:column;gap:14px;">
          <sc-for list="{{ pd_levels }}" as="lv" hint-placeholder-count="2">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px 22px;box-shadow:var(--shadow);">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                <span style="font-size:14.5px;font-weight:800;color:var(--text);">{{ lv.level }}</span>
                <sc-if value="{{ lv.isMyLevel }}" hint-placeholder-val="{{ false }}"><span style="font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:20px;background:var(--brand-soft);color:var(--brand);">Your level</span></sc-if>
                <span style="margin-left:auto;font-size:12px;font-weight:700;color:var(--text-2);">{{ lv.done }}/{{ lv.total }} completed</span>
              </div>
              <div style="height:6px;border-radius:4px;background:var(--border);overflow:hidden;margin-bottom:14px;"><div style="height:100%;width:{{ lv.prog }}%;background:{{ pd_color }};border-radius:4px;"></div></div>
              <sc-for list="{{ lv.modules }}" as="mod" hint-placeholder-count="2">
                <div style="margin-bottom:10px;">
                  <div style="font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);padding:5px 0;border-bottom:1px solid var(--border);margin-bottom:7px;">{{ mod.module }} · {{ mod.count }} resources</div>
                  <sc-for list="{{ mod.resources }}" as="r" hint-placeholder-count="3">
                    <button onClick="{{ r.go }}" style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:9px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);margin-bottom:6px;cursor:pointer;">
                      <span style="width:8px;height:8px;border-radius:50%;background:{{ r.platColor }};flex-shrink:0;"></span>
                      <span style="flex:1;min-width:0;"><span style="display:block;font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ r.title }}</span><span style="display:block;font-size:11px;color:var(--text-3);">{{ r.platform }} · {{ r.duration }}</span></span>
                      <span style="font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:20px;background:{{ r.statusBg }};color:{{ r.statusColor }};flex-shrink:0;">{{ r.statusLabel }}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2.2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </sc-for>
                </div>
              </sc-for>
            </div>
          </sc-for>
        </div>
      </div>
      </sc-if>
```

- [ ] **Step 8: Verificar en browser**

Learner → Paths → click en "QA Engineering" (primary). Esperado: hero con % total, stats (levels/resources/in progress/completed), chips de skills, y los levels con "Your level" en Senior QA; cada module lista sus resources con chip de estado. Click en un resource "In Progress" → lleva a Active Learning con ese path activo; click en uno "Completed" → Achievements; click en "Not started" → ToDo. Botón "All paths" vuelve al landing. Repetir con el path secondary (Developer): hero muestra "📘 Secondary path".

- [ ] **Step 9: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner path detail view with full level/module/resource hierarchy"
```

---

## Self-Review

- **Cobertura del pedido:** (1) quitar Avg Completion del manager → Task 1; (2) columnas primary/secondary con progreso en Team Progress → Task 2; (3) ver todo lo in-progress desde Team Progress sin ir a Enrollments → Task 2; (4) History → Achievements → Task 3; (5) jerarquía del path con levels/modules/resources/skills + progreso total + click navega según estado → Task 5; (6) Active Learning sin porcentajes, solo "In Progress" → Task 4. ✓
- **Placeholders:** ninguno — todo el código está inline. ✓
- **Consistencia de tipos:** `pd_*` props definidas en Step 6 coinciden con el template del Step 7; `secondaries`/`noSecondaries` del Task 2 Step 1 coinciden con el template del Step 2. ✓
