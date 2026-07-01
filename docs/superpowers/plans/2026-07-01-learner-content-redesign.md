# Learner "Content" Navigation Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la pantalla plana "Mis Paths" del Learner por un dropdown de sidebar "Content" con 5 sub-pantallas (Paths, ToDo List, Active Learning, History, Certificates), cada una scoped al path activo, y eliminar la pantalla "course" huérfana consolidando el detalle de un resource en un modal reusable.

**Architecture:** Todo el trabajo ocurre en `Provana LMS.dc.html`. La lógica vive en la clase `Component extends DCLogic`. El sidebar ya soporta grupos colapsables (patrón `head()`/`item()` con `grp`, usado hoy por Admin bajo la key `'content'`) — se reutiliza ese mismo mecanismo para el learner con la key `'lcontent'`, sin tocar el template HTML del sidebar. Los datos de cada pantalla se derivan de `state.resources` filtrados por `courseId` + `level` del path activo (`state.myPathActive`), usando helpers nuevos en el Component.

**Tech Stack:** HTML + CSS variables (design system existente) + DCLogic, sin dependencias nuevas.

## Global Constraints

- Solo modificar `Provana LMS.dc.html` — ningún otro archivo.
- Mantener el design system existente: variables CSS `--brand`, `--surface`, `--border`, `--text`, etc.
- No agregar dependencias externas.
- Solo se toca la vista del Learner (Home, sidebar learner, y todo lo que hoy es "Mis Paths"). Admin y Manager no se tocan.
- Cada tarea termina con un commit funcional (el archivo abre en browser sin errores).
- Verificación: abrir `Provana LMS.dc.html` en browser, cambiar a "Learner" (botón "View as" en el sidebar) y revisar visualmente la pantalla afectada.
- Spec de referencia: `docs/superpowers/specs/2026-07-01-learner-content-redesign-design.md`.

---

### Task 1: State + helpers + sidebar "Content" dropdown

**Files:**
- Modify: `Provana LMS.dc.html` — `state = {...}` (~línea 1396), zona de helpers cerca de `courseProgress()` (~línea 1592), `vNav()` sección learner (~línea 1984), `vChrome()` `titles` (~línea 1891)

**Qué cambia:** Se agrega el estado y los helpers de "path activo", y el ítem de sidebar "Mis Paths" se reemplaza por el dropdown "Content" con 5 sub-items (Paths, ToDo List, Active Learning, History, Certificates), usando el mismo mecanismo de acordeón que ya usa Admin (`head()`/`item()` con `grp`).

- [ ] **Step 1: Agregar `myPathActive` al state**

Localizar la línea (~1396):
```js
detailCourse:'qa', detailRes:null, learnerTab:'overview', learnerOpenPath:{}, evidenceFile:'',
```
Reemplazar con:
```js
detailCourse:'qa', detailRes:null, learnerTab:'overview', learnerOpenPath:{}, evidenceFile:'',
myPathActive:null,
```

- [ ] **Step 2: Agregar helpers de path activo cerca de `courseProgress()`**

Localizar (~línea 1591):
```js
  // ----- enrollment-style aggregation -----
  courseProgress(courseId){
```
Insertar justo antes:
```js
  // ----- learner content helpers -----
  learnerActiveUser(){ return this.state.users.find(u=>u.id==='u1')||this.state.users.find(u=>u.role==='Learner')||{}; }
  learnerActivePath(){ return this.state.myPathActive||this.learnerActiveUser().primaryPathId; }
  learnerLevelForPath(pathId){
    const u=this.learnerActiveUser();
    if(pathId===u.primaryPathId) return u.primaryLevel;
    const sp=(u.secondaryPaths||[]).find(s=>s.pathId===pathId);
    return sp?sp.level:u.primaryLevel;
  }
  learnerPathResources(pathId){
    const level=this.learnerLevelForPath(pathId);
    return this.state.resources.filter(r=>r.courseId===pathId&&r.level===level);
  }

  // ----- enrollment-style aggregation -----
  courseProgress(courseId){
```

- [ ] **Step 3: Reemplazar el nav del Learner en `vNav()`**

Localizar el bloque `} else {` del learner nav (~línea 1984):
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
Reemplazar con:
```js
    } else {
      const lActivePath=this.learnerActivePath();
      const lPathRes=this.learnerPathResources(lActivePath);
      const lTodoCount=lPathRes.filter(r=>r.status==='not-started').length;
      const lActiveCount=lPathRes.filter(r=>r.status==='in-progress'||r.status==='waiting').length;
      const lCertCount=lPathRes.filter(r=>r.status==='completed'&&r.hasCert).length;
      navItems=[
        item('home','Home',[['rect',{x:3,y:3,width:7,height:9}],['rect',{x:14,y:3,width:7,height:5}],['rect',{x:14,y:12,width:7,height:9}],['rect',{x:3,y:16,width:7,height:5}]],0,''),
        head('Content','lcontent'),
        item('mypaths','Paths',[['path','M4 19.5A2.5 2.5 0 0 1 6.5 17H20'],['path','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z']],0,'lcontent'),
        item('todo','ToDo List',[['line',{x1:8,y1:6,x2:21,y2:6}],['line',{x1:8,y1:12,x2:21,y2:12}],['line',{x1:8,y1:18,x2:21,y2:18}],['line',{x1:3,y1:6,x2:3.01,y2:6}],['line',{x1:3,y1:12,x2:3.01,y2:12}],['line',{x1:3,y1:18,x2:3.01,y2:18}]],lTodoCount,'lcontent'),
        item('active','Active Learning',[['circle',{cx:12,cy:12,r:10}],['polygon',{points:'10 8 16 12 10 16'}]],lActiveCount,'lcontent'),
        item('history','History',[['path','M3 3v18h18'],['path','M18 17V9'],['path','M13 17V5'],['path','M8 17v-3']],0,'lcontent'),
        item('certificates','Certificates',[['circle',{cx:12,cy:8,r:6}],['path','M15.5 13.5 17 22l-5-3-5 3 1.5-8.5']],lCertCount,'lcontent'),
        item('explore','Explorar',[['circle',{cx:12,cy:12,r:10}],['polygon',{points:'16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76'}]],0,''),
        item('homologar','Homologar',[['path','M9 11l3 3L22 4'],['path','M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']],0,'')
      ];
    }
```

- [ ] **Step 4: Agregar títulos de las 4 pantallas nuevas en `vChrome()`**

Localizar (~línea 1892):
```js
      mypaths:['Mis Paths','Todos tus paths asignados'],
      homologar:['Homologar','Solicita crédito por cursos previos'],
```
Reemplazar con:
```js
      mypaths:['Mis Paths','Todos tus paths asignados'],
      todo:['ToDo List','Recursos pendientes por empezar'],
      active:['Active Learning','Lo que estás cursando ahora'],
      history:['History','Recursos completados'],
      certificates:['Certificates','Certificados obtenidos'],
      homologar:['Homologar','Solicita crédito por cursos previos'],
```

- [ ] **Step 5: Verificar en browser**

Cambiar a "Learner". En el sidebar debe verse "Content" con chevron; clic en el chevron despliega Paths/ToDo List/Active Learning/History/Certificates, con badges numéricos junto a ToDo List, Active Learning y Certificates. Clic en cualquiera de los 4 nuevos (todo/active/history/certificates) navega (el área principal quedará en blanco hasta las próximas tareas — esperado). "Paths" sigue mostrando la pantalla actual de Mis Paths sin cambios visuales todavía.

- [ ] **Step 6: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner sidebar Content dropdown with Paths/ToDo/Active/History/Certificates"
```

---

### Task 2: Pantalla "Paths" (landing)

**Files:**
- Modify: `Provana LMS.dc.html` — `vLearner()` (~línea 2496), HTML `<!-- LEARNER: MIS PATHS -->` (~línea 837)

**Qué cambia:** La pantalla `mypaths` deja de mostrar el árbol de módulos/resources y pasa a ser el landing con cards de todos los paths asignados. Clic en un card fija `myPathActive` y navega a Active Learning.

- [ ] **Step 1: Reemplazar el cálculo de `myPathTabs`/`myPathModules` por `pathLandingCards` en `vLearner()`**

Localizar (~línea 2444):
```js
    // my paths (path detail tree)
    const activeMyPath=S.detailCourse||learnerUser.primaryPathId||'qa';
    const allPaths=[
      {pathId:learnerUser.primaryPathId,level:learnerUser.primaryLevel,isPrimary:true},
      ...(learnerUser.secondaryPaths||[]).map(sp=>({...sp,isPrimary:false}))
    ].filter(p=>p.pathId);
    const activeMyLevel=(allPaths.find(p=>p.pathId===activeMyPath)||{}).level||learnerUser.primaryLevel||'Senior QA';
    const myPathResources=S.resources.filter(r=>r.courseId===activeMyPath&&r.level===activeMyLevel);
    const myPathModuleMap={};
    myPathResources.forEach(r=>{ (myPathModuleMap[r.module]=myPathModuleMap[r.module]||[]).push(r); });
    const STATUS_ICON={'completed':'✅','in-progress':'🔵','waiting':'⏳','not-started':'○'};
    const myPathModules=Object.keys(myPathModuleMap).map(mod=>({
      name:mod,
      resources:myPathModuleMap[mod].map(r=>({...this.decorate(r),statusIcon:STATUS_ICON[r.status]||'○',open:()=>this.setState({detailRes:r.id,detailCourse:activeMyPath,evidenceFile:'',screen:'mypaths'})}))
    }));
    const myPathProg=myPathResources.length?Math.round(myPathResources.filter(r=>r.status==='completed').length/myPathResources.length*100):0;
    const activeMyPathObj=this.courseById(activeMyPath)||{};
```
Reemplazar con:
```js
    // paths landing: cards for every assigned path (primary + secondary)
    const allPaths=[
      {pathId:learnerUser.primaryPathId,level:learnerUser.primaryLevel,isPrimary:true},
      ...(learnerUser.secondaryPaths||[]).map(sp=>({...sp,isPrimary:false}))
    ].filter(p=>p.pathId);
    const pathLandingCards=allPaths.map(p=>{
      const c=this.courseById(p.pathId)||{};
      const res=this.learnerPathResources(p.pathId);
      const prog=res.length?Math.round(res.filter(r=>r.status==='completed').length/res.length*100):0;
      return { pathId:p.pathId, name:c.name||p.pathId, level:p.level, isPrimary:p.isPrimary, prog,
        color:c.color||'#4A2E80', iconWhite:this.iconEl(c.icon,22,'#fff',2), colorDark:this.dark(c.color||'#4A2E80',28),
        pick:()=>this.setState({myPathActive:p.pathId,screen:'active'}) };
    });
```

- [ ] **Step 2: Exponer `pathLandingCards` y limpiar referencias viejas en el `return` de `vLearner()`**

Localizar (~línea 2496):
```js
      showMyPaths:isLn&&S.screen==='mypaths',
      showHomologar:isLn&&S.screen==='homologar',
      goMyPaths:()=>this.setState({screen:'mypaths'}),
      goHomologar:()=>this.setState({screen:'homologar'}),
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
Reemplazar con:
```js
      showMyPaths:isLn&&S.screen==='mypaths',
      showHomologar:isLn&&S.screen==='homologar',
      goMyPaths:()=>this.setState({screen:'mypaths'}),
      goHomologar:()=>this.setState({screen:'homologar'}),
      pathLandingCards,
```

- [ ] **Step 3: Reemplazar HTML `<!-- LEARNER: MIS PATHS -->`**

Localizar el bloque completo (~líneas 837–881):
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
Reemplazar con:
```html
      <!-- LEARNER: PATHS (landing) -->
      <sc-if value="{{ showMyPaths }}" hint-placeholder-val="{{ false }}">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">
          <sc-for list="{{ pathLandingCards }}" as="p" hint-placeholder-count="2">
            <button onClick="{{ p.pick }}" style="text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px 20px;box-shadow:var(--shadow);cursor:pointer;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <span style="width:38px;height:38px;border-radius:10px;background:linear-gradient(125deg,{{ p.color }},{{ p.colorDark }});display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ p.iconWhite }}</span>
                <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:var(--brand-soft);color:var(--brand);"><sc-if value="{{ p.isPrimary }}" hint-placeholder-val="{{ true }}">🎯 Principal</sc-if><sc-if value="{{ !p.isPrimary }}" hint-placeholder-val="{{ false }}">📘 Secundario</sc-if></span>
              </div>
              <div style="font-size:16px;font-weight:800;color:var(--text);">{{ p.name }}</div>
              <div style="font-size:13px;color:var(--text-2);margin-top:2px;">{{ p.level }}</div>
              <div style="display:flex;align-items:center;gap:10px;margin-top:12px;">
                <div style="flex:1;height:7px;border-radius:6px;background:var(--border);overflow:hidden;"><div style="height:100%;width:{{ p.prog }}%;background:{{ p.color }};border-radius:6px;"></div></div>
                <span style="font-size:12px;font-weight:700;color:var(--text-2);">{{ p.prog }}%</span>
              </div>
            </button>
          </sc-for>
        </div>
      </div>
      </sc-if>
```

- [ ] **Step 4: Verificar en browser**

Learner → Content → Paths: deben verse cards para Quality Assurance (Principal) y, si aplica, paths secundarios, cada uno con % de progreso. Clic en un card navega a "Active Learning" (pantalla en blanco hasta la Task 3 — esperado).

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner Paths landing shows assigned path cards"
```

---

### Task 3: Hero compartido + pantalla Active Learning

**Files:**
- Modify: `Provana LMS.dc.html` — `vLearner()` (~línea 2496 en adelante), HTML (insertar después del bloque de Task 2)

**Qué cambia:** Se agrega el hero compartido (path asignado, % completado, stats, pills de path) y la primera de las 4 pantallas que lo consumen: Active Learning.

- [ ] **Step 1: Agregar cómputo del hero + Active Learning en `vLearner()`**

Localizar el final del bloque agregado en Task 2 (justo después de `pathLandingCards` computation, antes del `return {`). Insertar:
```js
    // shared hero + path pills (used by todo/active/history/certificates)
    const heroPathId=this.learnerActivePath();
    const heroPath=this.courseById(heroPathId)||{};
    const heroLevel=this.learnerLevelForPath(heroPathId);
    const heroRes=this.learnerPathResources(heroPathId);
    const heroCompleted=heroRes.filter(r=>r.status==='completed');
    const heroTotal=heroRes.length;
    const heroProg=heroTotal?Math.round(heroCompleted.length/heroTotal*100):0;
    const heroPoints=heroCompleted.reduce((a,r)=>a+(r.points||0),0);
    const heroWaiting=heroRes.filter(r=>r.status==='waiting').length;
    const heroPendingHomolog=(S.homologRequests||[]).filter(h=>h.userId==='u1'&&h.pathId===heroPathId&&h.status==='pending').length;
    const heroAwaiting=heroWaiting+heroPendingHomolog;
    const heroPills=allPaths.map(p=>{
      const c=this.courseById(p.pathId)||{}; const isActive=p.pathId===heroPathId;
      return { label:c.name||p.pathId, isPrimary:p.isPrimary, pick:()=>this.setState({myPathActive:p.pathId}),
        style:isActive?'padding:8px 16px;border-radius:20px;border:none;background:var(--brand);color:#fff;font-size:13px;font-weight:700;cursor:pointer;':'padding:8px 16px;border-radius:20px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);font-size:13px;font-weight:500;cursor:pointer;' };
    });

    // active learning
    const activeLearningCards=heroRes.filter(r=>r.status==='in-progress'||r.status==='waiting').map(r=>{
      const d=this.decorate(r);
      return { ...d, isWaiting:r.status==='waiting',
        open:()=>this.setState({detailRes:r.id}),
        continueLink:r.link };
    });
```

- [ ] **Step 2: Exponer los datos del hero y de Active Learning en el `return` de `vLearner()`**

Localizar (~después de `goHomologar:()=>this.setState({screen:'homologar'}),` y `pathLandingCards,` agregados en Task 2). Insertar justo después:
```js
      showTodo:isLn&&S.screen==='todo', showActive:isLn&&S.screen==='active',
      showHistory:isLn&&S.screen==='history', showCertificates:isLn&&S.screen==='certificates',
      showContentHero: isLn&&['todo','active','history','certificates'].includes(S.screen),
      heroIcon:this.iconEl(heroPath.icon,22,'#fff',2), heroColor:heroPath.color||'#4A2E80', heroColorDark:this.dark(heroPath.color||'#4A2E80',30),
      heroName:heroPath.name||'—', heroLevel:heroLevel||'—', heroDesc:heroPath.desc||'',
      heroProg, heroCompletedCount:heroCompleted.length, heroTotal, heroPoints, heroAwaiting,
      heroPills,
      activeLearningCards, activeLearningEmpty:activeLearningCards.length===0,
```

- [ ] **Step 3: Agregar HTML del hero + Active Learning**

Localizar el cierre `</sc-if>` de la pantalla "LEARNER: PATHS (landing)" agregada en Task 2 (~línea 863 aprox., justo después de `</div>` que cierra el grid de cards). Insertar justo después de ese `</sc-if>`:
```html

      <!-- LEARNER: CONTENT HERO (shared) -->
      <sc-if value="{{ showContentHero }}" hint-placeholder-val="{{ false }}">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="border-radius:20px;overflow:hidden;background:linear-gradient(125deg,{{ heroColor }},{{ heroColorDark }});padding:22px 26px;margin-bottom:16px;box-shadow:var(--shadow-lg);color:#fff;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;">
            <div style="display:flex;align-items:center;gap:14px;min-width:0;">
              <span style="width:48px;height:48px;border-radius:13px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ heroIcon }}</span>
              <div style="min-width:0;">
                <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.8;">Tu path asignado</div>
                <div style="font-size:20px;font-weight:800;">{{ heroName }}</div>
                <div style="font-size:12.5px;opacity:.85;">{{ heroLevel }}</div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:26px;font-weight:800;">{{ heroProg }}%</div>
              <div style="font-size:11.5px;opacity:.8;">completado</div>
            </div>
          </div>
          <div style="display:flex;gap:24px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.25);">
            <div><div style="font-size:16px;font-weight:800;">{{ heroCompletedCount }}/{{ heroTotal }}</div><div style="font-size:11px;opacity:.8;">homologados</div></div>
            <div><div style="font-size:16px;font-weight:800;">{{ heroPoints }}</div><div style="font-size:11px;opacity:.8;">puntos</div></div>
            <div><div style="font-size:16px;font-weight:800;">{{ heroAwaiting }}</div><div style="font-size:11px;opacity:.8;">awaiting homologation</div></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
          <sc-for list="{{ heroPills }}" as="hp" hint-placeholder-count="2">
            <button onClick="{{ hp.pick }}" style="{{ hp.style }}">{{ hp.label }}<sc-if value="{{ hp.isPrimary }}" hint-placeholder-val="{{ false }}"> 🎯</sc-if></button>
          </sc-for>
        </div>

        <!-- ACTIVE LEARNING -->
        <sc-if value="{{ showActive }}" hint-placeholder-val="{{ false }}">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
          <sc-for list="{{ activeLearningCards }}" as="c" hint-placeholder-count="3">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px 20px;box-shadow:var(--shadow);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <button onClick="{{ c.open }}" style="text-align:left;background:none;border:none;padding:0;cursor:pointer;font-size:14.5px;font-weight:700;color:var(--text);">{{ c.title }}</button>
                <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:{{ c.platColor }}1a;color:{{ c.platColor }};flex-shrink:0;">{{ c.platform }}</span>
              </div>
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
              <sc-if value="{{ c.isWaiting }}" hint-placeholder-val="{{ false }}">
                <span style="font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px;background:color-mix(in srgb,#b45309 12%,var(--surface));color:#b45309;">Awaiting approval</span>
              </sc-if>
            </div>
          </sc-for>
        </div>
        <sc-if value="{{ activeLearningEmpty }}" hint-placeholder-val="{{ false }}">
          <div style="padding:32px;text-align:center;font-size:13px;color:var(--text-3);">No tienes recursos en progreso en este path.</div>
        </sc-if>
        </sc-if>

      </div>
      </sc-if>
```

- [ ] **Step 4: Verificar en browser**

Learner → Content → Active Learning: hero morado/azul (según color del path) con % completado, stats, pills. Debajo, cards de Playwright Advanced Patterns y Cypress Advanced (in-progress) con barra de %, "Last activity" y botón "Continue →". Cambiar de pill de path (si el learner tiene secundarios) actualiza el hero y las cards.

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner shared hero + Active Learning screen"
```

---

### Task 4: Pantalla ToDo List

**Files:**
- Modify: `Provana LMS.dc.html` — método `startResource` nuevo (~cerca de `submitEvidence`, línea 1654), `vLearner()`, HTML (dentro del hero compartido de Task 3)

**Qué cambia:** Se agrega la tabla de ToDo List agrupada por módulo, con acción "Empezar" que abre el link y marca el resource `in-progress`.

- [ ] **Step 1: Agregar método `startResource` al Component**

Localizar (~línea 1654):
```js
  submitEvidence(){
```
Insertar justo antes:
```js
  startResource(id){
    const r=this.state.resources.find(x=>x.id===id); if(!r) return;
    const resources=this.state.resources.map(x=>x.id===id?{...x,status:'in-progress',progress:x.progress||0,lastActivity:'Hoy'}:x);
    this.setState({resources});
    this.flash('"'+r.title+'" en progreso','ok');
    if(r.link) window.open(r.link,'_blank');
  }
  submitEvidence(){
```

- [ ] **Step 2: Agregar cómputo de ToDo List en `vLearner()`**

Localizar el bloque agregado en Task 3 (justo después de `activeLearningCards` computation, antes del `return {`). Insertar:
```js
    // todo list — grouped by module
    const todoModuleMap={};
    heroRes.filter(r=>r.status==='not-started').forEach(r=>{ (todoModuleMap[r.module]=todoModuleMap[r.module]||[]).push(r); });
    const todoModules=Object.keys(todoModuleMap).map(mod=>({
      name:mod,
      resources:todoModuleMap[mod].map(r=>({...this.decorate(r), start:()=>this.startResource(r.id), open:()=>this.setState({detailRes:r.id})}))
    }));
```

- [ ] **Step 3: Exponer `todoModules` en el `return` de `vLearner()`**

Localizar `activeLearningCards, activeLearningEmpty:activeLearningCards.length===0,` (agregado en Task 3) e insertar justo después:
```js
      todoModules, todoEmpty:todoModules.length===0,
```

- [ ] **Step 4: Agregar HTML de ToDo List**

Localizar, dentro del bloque `<!-- LEARNER: CONTENT HERO (shared) -->` agregado en Task 3, el cierre `</sc-if>` de la sección `<!-- ACTIVE LEARNING -->` (justo antes del `</div></sc-if>` final del hero). Insertar justo después de ese `</sc-if>` (el que cierra Active Learning):
```html

        <!-- TODO LIST -->
        <sc-if value="{{ showTodo }}" hint-placeholder-val="{{ false }}">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px 24px;box-shadow:var(--shadow);">
          <sc-for list="{{ todoModules }}" as="mod" hint-placeholder-count="3">
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);padding:6px 0;border-bottom:1px solid var(--border);margin-bottom:8px;">{{ mod.name }}</div>
              <sc-for list="{{ mod.resources }}" as="r" hint-placeholder-count="3">
                <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);margin-bottom:6px;">
                  <span style="width:8px;height:8px;border-radius:50%;background:#cbd5e1;flex-shrink:0;"></span>
                  <button onClick="{{ r.open }}" style="flex:1;min-width:0;text-align:left;background:none;border:none;padding:0;cursor:pointer;">
                    <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ r.title }}</div>
                    <div style="font-size:11.5px;color:var(--text-3);">{{ r.platform }} · {{ r.duration }}</div>
                  </button>
                  <button onClick="{{ r.start }}" style="font-size:12.5px;font-weight:700;color:#fff;background:var(--brand);border:none;padding:8px 15px;border-radius:9px;cursor:pointer;flex-shrink:0;">Empezar →</button>
                </div>
              </sc-for>
            </div>
          </sc-for>
          <sc-if value="{{ todoEmpty }}" hint-placeholder-val="{{ false }}">
            <div style="padding:32px;text-align:center;font-size:13px;color:var(--text-3);">No tienes recursos pendientes en este path.</div>
          </sc-if>
        </div>
        </sc-if>
```

- [ ] **Step 5: Verificar en browser**

Learner → Content → ToDo List: hero arriba (igual a Active Learning), debajo tabla agrupada por módulo (Playwright, Cypress, etc.) con resources `not-started` y botón "Empezar →". Clic en "Empezar" abre el link en pestaña nueva y el resource desaparece de ToDo List (ahora aparece en Active Learning, verificar cambiando de pantalla).

- [ ] **Step 6: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner ToDo List screen grouped by module"
```

---

### Task 5: Pantalla History

**Files:**
- Modify: `Provana LMS.dc.html` — `vLearner()`, HTML (dentro del hero compartido)

**Qué cambia:** Tabla de resources completados del path activo, con fecha, score y estado de homologación.

- [ ] **Step 1: Agregar cómputo de History en `vLearner()`**

Localizar el bloque agregado en Task 4 (justo después de `todoModules` computation, antes del `return {`). Insertar:
```js
    // history
    const historyRows=heroCompleted.map(r=>{
      const d=this.decorate(r);
      const isAutoVal=this.isAuto(r.platform)||r.homolog==='auto';
      return { ...d, dotColor:this.platColor(r.platform),
        homogLabel:isAutoVal?'Auto-validated':'Homologated',
        open:()=>this.setState({detailRes:r.id}) };
    });
```

- [ ] **Step 2: Exponer `historyRows` en el `return` de `vLearner()`**

Localizar `todoModules, todoEmpty:todoModules.length===0,` (agregado en Task 4) e insertar justo después:
```js
      historyRows, historyEmpty:historyRows.length===0,
```

- [ ] **Step 3: Agregar HTML de History**

Localizar el cierre `</sc-if>` de la sección `<!-- TODO LIST -->` (agregada en Task 4). Insertar justo después:
```html

        <!-- HISTORY -->
        <sc-if value="{{ showHistory }}" hint-placeholder-val="{{ false }}">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);">
          <div style="display:grid;grid-template-columns:2fr 1fr 0.8fr 1.1fr;gap:14px;padding:13px 22px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--text-3);text-transform:uppercase;"><div>Course</div><div>Completed</div><div>Score</div><div>Homologation</div></div>
          <sc-for list="{{ historyRows }}" as="r" hint-placeholder-count="4">
            <button onClick="{{ r.open }}" style="display:grid;grid-template-columns:2fr 1fr 0.8fr 1.1fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--border);align-items:center;width:100%;text-align:left;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;"><span style="width:7px;height:7px;border-radius:50%;background:{{ r.dotColor }};flex-shrink:0;"></span><div style="min-width:0;"><div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ r.title }}</div><div style="font-size:11px;color:var(--text-3);">{{ r.platform }}</div></div></div>
              <div style="font-size:12.5px;color:var(--text-2);">{{ r.completedLabel }}</div>
              <div style="font-size:13px;font-weight:700;color:var(--text);">{{ r.score }}%</div>
              <div><span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:color-mix(in srgb,#15803d 12%,var(--surface));color:#15803d;">{{ r.homogLabel }}</span></div>
            </button>
          </sc-for>
          <sc-if value="{{ historyEmpty }}" hint-placeholder-val="{{ false }}">
            <div style="padding:32px;text-align:center;font-size:13px;color:var(--text-3);">Aún no completas recursos en este path.</div>
          </sc-if>
        </div>
        </sc-if>
```

- [ ] **Step 4: Verificar en browser**

Learner → Content → History: tabla con "Playwright Fundamentals" (completado) — fecha, score 94%, badge "Homologated". Cambiar de path con las pills muestra el historial de ese otro path.

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner History screen"
```

---

### Task 6: Pantalla Certificates

**Files:**
- Modify: `Provana LMS.dc.html` — `vLearner()`, `vModals()` (~línea 2574), HTML (dentro del hero compartido)

**Qué cambia:** Grid de certificados del path activo. Clic en un card abre el modal "CERTIFICATE MODAL" ya existente (hoy huérfano, sin trigger). El botón "Download" de la card es decorativo.

- [ ] **Step 1: Agregar cómputo de Certificates en `vLearner()`**

Localizar el bloque agregado en Task 5 (justo después de `historyRows` computation, antes del `return {`). Insertar:
```js
    // certificates
    const certificateCards=heroCompleted.filter(r=>r.hasCert).map(r=>{
      const d=this.decorate(r);
      return { ...d, view:()=>this.setState({certView:r.id}) };
    });
```

- [ ] **Step 2: Exponer `certificateCards` en el `return` de `vLearner()`**

Localizar `historyRows, historyEmpty:historyRows.length===0,` (agregado en Task 5) e insertar justo después:
```js
      certificateCards, certificatesEmpty:certificateCards.length===0,
```

- [ ] **Step 3: Agregar HTML de Certificates**

Localizar el cierre `</sc-if>` de la sección `<!-- HISTORY -->` (agregada en Task 5). Insertar justo después:
```html

        <!-- CERTIFICATES -->
        <sc-if value="{{ showCertificates }}" hint-placeholder-val="{{ false }}">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">
          <sc-for list="{{ certificateCards }}" as="c" hint-placeholder-count="3">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);">
              <button onClick="{{ c.view }}" style="width:100%;display:block;height:110px;background:linear-gradient(125deg,{{ heroColor }},{{ heroColorDark }});border:none;cursor:pointer;padding:0;position:relative;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;top:14px;left:16px;"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg>
                <span style="position:absolute;bottom:12px;left:16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fff;opacity:.85;">Certificate of Completion</span>
              </button>
              <div style="padding:14px 16px 16px;">
                <div style="font-size:13.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ c.title }}</div>
                <div style="font-size:11.5px;color:var(--text-3);margin-top:2px;">{{ c.platform }} · {{ c.completedLabel }}</div>
                <button onClick="{{ c.view }}" style="width:100%;margin-top:12px;padding:9px;border-radius:9px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:12.5px;font-weight:700;cursor:pointer;">↓ Download</button>
              </div>
            </div>
          </sc-for>
        </div>
        <sc-if value="{{ certificatesEmpty }}" hint-placeholder-val="{{ false }}">
          <div style="padding:32px;text-align:center;font-size:13px;color:var(--text-3);">Aún no tienes certificados en este path.</div>
        </sc-if>
        </sc-if>
```

- [ ] **Step 4: Verificar en browser**

Learner → Content → Certificates: card "Playwright Fundamentals" con banner de medalla. Clic en el card o en "Download" abre el modal "Certificate of Completion" ya existente en la app (con nombre del learner, título del curso, fecha).

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: learner Certificates screen wired to existing certificate modal"
```

---

### Task 7: Modal de detalle de resource (reemplaza la funcionalidad de la course page)

**Files:**
- Modify: `Provana LMS.dc.html` — `vLearner()` (~línea 2432, cómputo de `selRes`/`canSubmit`), HTML (nuevo modal antes del cierre `</div>` raíz, cerca de las otras modales ~línea 1120)

**Qué cambia:** Clic en un resource (desde ToDo List, Active Learning o History) abre un modal de detalle — reemplaza lo que hoy solo existía en la pantalla "course" (descripción, skills, submit de evidencia, auto-validación). Esto es necesario porque la Task 8 elimina esa pantalla; sin este modal se perdería la única forma de enviar evidencia de homologación.

- [ ] **Step 1: Ajustar el cómputo de `selRes`/`canSubmit` en `vLearner()` para que no dependa de la course page**

Localizar (~línea 2432):
```js
    const selRes=S.detailRes?this.decorate(this.state.resources.find(r=>r.id===S.detailRes)):(all[0]);
    const canSubmit=selRes&&(selRes.status==='not-started'||selRes.status==='in-progress')&&selRes.homolog==='required'&&!this.isAuto(selRes.platform);
```
Reemplazar con:
```js
    const selRes=S.detailRes?this.decorate(this.state.resources.find(r=>r.id===S.detailRes)):null;
    const canSubmit=!!selRes&&(selRes.status==='not-started'||selRes.status==='in-progress')&&selRes.homolog==='required'&&!this.isAuto(selRes.platform);
```

- [ ] **Step 2: Agregar los campos `rd_*` del modal en el `return` de `vLearner()`**

Localizar `certificateCards, certificatesEmpty:certificateCards.length===0,` (agregado en Task 6) e insertar justo después:
```js
      rd_open:!!selRes,
      rd_title:selRes?selRes.title:'', rd_platform:selRes?selRes.platform:'', rd_platColor:selRes?this.platColor(selRes.platform):'#000',
      rd_desc:selRes?selRes.description:'', rd_hasDesc:selRes?selRes.hasDesc:false,
      rd_duration:selRes?selRes.duration:'', rd_points:selRes?selRes.points:0, rd_link:selRes?selRes.link:'#',
      rd_statusLabel:selRes?selRes.statusLabel:'', rd_statusBg:selRes?selRes.statusBg:'', rd_statusColor:selRes?selRes.statusColor:'',
      rd_skills:selRes?(selRes.skills||[]):[],
      rd_homLabel:selRes?selRes.homLabel:'', rd_homColor:selRes?selRes.homColor:'', rd_homBg:selRes?selRes.homBg:'',
      rd_canSubmit:canSubmit, rd_isAuto:selRes?(this.isAuto(selRes.platform)||selRes.homolog==='auto'):false,
      rd_isWaiting:selRes?selRes.status==='waiting':false,
      rd_fileLabel:S.evidenceFile||'Choose evidence file (PDF, PNG, DOCX…)', rd_fileColor:S.evidenceFile?'var(--text)':'var(--text-3)',
      rd_pickEvidence:()=>{ const n=['certificate.pdf','completion-screenshot.png','badge.png','transcript.pdf'][Math.floor(Math.random()*4)]; this.setState({evidenceFile:n}); },
      rd_submitEvidence:()=>this.submitEvidence(), rd_markDone:()=>{ if(selRes) this.markResourceDone(selRes.id); },
      rd_close:()=>this.setState({detailRes:null,evidenceFile:''}),
```

- [ ] **Step 3: Agregar HTML del modal**

Localizar `<!-- CERTIFICATE MODAL -->` (~línea 1122). Insertar justo antes:
```html
  <!-- RESOURCE DETAIL MODAL -->
  <sc-if value="{{ rd_open }}" hint-placeholder-val="{{ false }}">
  <div onClick="{{ rd_close }}" style="position:fixed;inset:0;background:rgba(23,17,48,.5);z-index:60;display:flex;align-items:center;justify-content:center;padding:30px;animation:ovIn .15s ease;">
    <div onClick="{{ stop }}" style="width:560px;max-height:88vh;overflow-y:auto;background:var(--surface);border-radius:18px;box-shadow:var(--shadow-lg);animation:shIn .2s ease;">
      <div style="padding:24px 26px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#fff;background:{{ rd_platColor }};padding:4px 11px;border-radius:20px;">{{ rd_platform }}</span><span style="font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px;background:{{ rd_statusBg }};color:{{ rd_statusColor }};">{{ rd_statusLabel }}</span><span style="font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px;background:{{ rd_homBg }};color:{{ rd_homColor }};">{{ rd_homLabel }}</span></div>
        <div style="font-size:20px;font-weight:800;letter-spacing:-.01em;margin-bottom:8px;">{{ rd_title }}</div>
        <sc-if value="{{ rd_hasDesc }}" hint-placeholder-val="{{ true }}"><div style="font-size:13.5px;color:var(--text-2);line-height:1.6;margin-bottom:16px;">{{ rd_desc }}</div></sc-if>
        <div style="display:flex;gap:24px;padding:14px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:16px;"><div><div style="font-size:11px;color:var(--text-3);">Duration</div><div style="font-size:14px;font-weight:700;">{{ rd_duration }}</div></div><div><div style="font-size:11px;color:var(--text-3);">Points</div><div style="font-size:14px;font-weight:700;">{{ rd_points }}</div></div></div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px;">Skills you'll develop</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px;"><sc-for list="{{ rd_skills }}" as="s" hint-placeholder-count="2"><span style="font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px;background:var(--brand-soft);color:var(--brand);">{{ s }}</span></sc-for></div>
        <a href="{{ rd_link }}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:11px;background:var(--brand);color:#fff;font-size:13.5px;font-weight:700;text-decoration:none;">Open on Platform<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg></a>
        <sc-if value="{{ rd_canSubmit }}" hint-placeholder-val="{{ false }}">
        <div style="border-top:1px solid var(--border);margin-top:18px;padding-top:16px;">
          <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Submit evidence for homologation</div>
          <div style="font-size:12.5px;color:var(--text-3);margin-bottom:14px;">This resource requires manager validation. Upload your certificate or proof of completion.</div>
          <div style="display:flex;gap:10px;"><button onClick="{{ rd_pickEvidence }}" style="flex:1;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:11px;border:1.5px dashed var(--border);background:var(--surface-2);color:{{ rd_fileColor }};font-size:13px;font-weight:600;text-align:left;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8 12 3 7 8"/><path d="M12 3v12"/></svg>{{ rd_fileLabel }}</button><button onClick="{{ rd_submitEvidence }}" style="padding:12px 22px;border-radius:11px;border:none;background:var(--brand);color:#fff;font-size:13px;font-weight:700;">Submit</button></div>
        </div>
        </sc-if>
        <sc-if value="{{ rd_isAuto }}" hint-placeholder-val="{{ false }}">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:14px;background:color-mix(in srgb,#15803d 9%,var(--surface));border:1px solid color-mix(in srgb,#15803d 22%,var(--surface));margin-top:16px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg><span style="font-size:13px;color:var(--text-2);font-weight:600;">Auto-validated — no evidence needed. Marking this complete validates it instantly.</span><button onClick="{{ rd_markDone }}" style="margin-left:auto;padding:8px 16px;border-radius:9px;border:none;background:#15803d;color:#fff;font-size:12.5px;font-weight:700;">Mark complete</button></div>
        </sc-if>
        <sc-if value="{{ rd_isWaiting }}" hint-placeholder-val="{{ false }}">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:14px;background:color-mix(in srgb,#b45309 9%,var(--surface));border:1px solid color-mix(in srgb,#b45309 22%,var(--surface));margin-top:16px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span style="font-size:13px;color:var(--text-2);font-weight:600;">Evidence submitted — awaiting your manager's validation.</span></div>
        </sc-if>
      </div>
      <div style="display:flex;justify-content:flex-end;padding:16px 26px;border-top:1px solid var(--border);"><button onClick="{{ rd_close }}" style="padding:10px 18px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:13px;font-weight:700;">Close</button></div>
    </div>
  </div>
  </sc-if>

  <!-- CERTIFICATE MODAL -->
```

- [ ] **Step 4: Verificar en browser**

Learner → Content → ToDo List: clic en el título de un resource (ej. "Building a QA Strategy") abre el modal de detalle con descripción, skills, botón "Open on Platform" y, si aplica, el bloque de submit evidence. Learner → Content → Active Learning: clic en el título de una card también abre el mismo modal. El botón "Close" y el fondo cierran el modal.

- [ ] **Step 5: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "feat: resource detail modal reusable across ToDo/Active Learning/History"
```

---

### Task 8: Eliminar la pantalla "course" huérfana y redirigir sus puntos de entrada

**Files:**
- Modify: `Provana LMS.dc.html` — `vLearner()` (computo `tree`/`lcid`/`lcourse`, return `cp_*`), HTML `<!-- LEARNER: COURSE PAGE -->` (~línea 973), `cl_continue` (Home), `pv_open` (preview modal), state cleanup

**Qué cambia:** Se elimina por completo la pantalla `screen:'course'`, ya reemplazada por el modal de detalle (Task 7) y las 4 pantallas de Content. Los dos únicos puntos que navegaban ahí ("Continuar" en Home, "Open course" en el preview modal de Explorar) se redirigen a Active Learning con el path correspondiente activo.

- [ ] **Step 1: Eliminar el cómputo de `tree`/`lcid`/`lcourse` en `vLearner()`**

Localizar (~línea 2420):
```js
    // course page tree (learner)
    const lcid=S.detailCourse||cid;
    const lcourse=this.courseById(lcid);
    const tree=this.tree(lcid).map(p=>({
      path:p.path, open:S.learnerOpenPath[p.path]!==false, toggle:()=>this.setState({learnerOpenPath:Object.assign({},S.learnerOpenPath,{[p.path]:S.learnerOpenPath[p.path]===false})}),
      chev:S.learnerOpenPath[p.path]!==false?'transform:rotate(90deg);transition:.15s;':'transition:.15s;',
      levels:p.levels.map(l=>({ level:l.level, modules:l.modules.map(m=>({ module:m.module, resources:m.resources.map(r=>{
        const d=this.decorate(r); const dot={ 'completed':'#15803d','in-progress':'#2563eb','waiting':'#b45309','not-started':'#cbd5e1' }[r.status];
        return { id:r.id, title:r.title, dot, sel:S.detailRes===r.id, pick:()=>this.setState({detailRes:r.id,evidenceFile:''}),
          style:S.detailRes===r.id?'display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:7px 10px;border:none;border-radius:8px;background:var(--brand-soft);color:var(--brand);font-size:12.5px;font-weight:600;':'display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:7px 10px;border:none;border-radius:8px;background:transparent;color:var(--text-2);font-size:12.5px;font-weight:500;' };
      }) })) }))
    }));
```
Eliminar el bloque completo (no dejar reemplazo).

- [ ] **Step 2: Eliminar los campos `cp_*` y `showCoursePage` del `return` de `vLearner()`**

Localizar (~línea 2491):
```js
      showHome:isLn&&S.screen==='home', showExplore:isLn&&S.screen==='explore', showCoursePage:isLn&&S.screen==='course',
      showMyPaths:isLn&&S.screen==='mypaths',
```
Reemplazar con:
```js
      showHome:isLn&&S.screen==='home', showExplore:isLn&&S.screen==='explore',
      showMyPaths:isLn&&S.screen==='mypaths',
```

Localizar (~línea 2517):
```js
      ln_courseName:course.name,
      // course page
      cp_courseName:lcourse.name, cp_tree:tree,
      cp_hasSel:!!selRes,
      cp_title:selRes?selRes.title:'', cp_platform:selRes?selRes.platform:'', cp_platColor:selRes?this.platColor(selRes.platform):'#000',
      cp_desc:selRes?selRes.description:'', cp_hasDesc:selRes?selRes.hasDesc:false,
      cp_duration:selRes?selRes.duration:'', cp_points:selRes?selRes.points:0, cp_link:selRes?selRes.link:'#',
      cp_statusLabel:selRes?selRes.statusLabel:'', cp_statusBg:selRes?selRes.statusBg:'', cp_statusColor:selRes?selRes.statusColor:'',
      cp_skills:selRes?(selRes.skills||[]):[],
      cp_homLabel:selRes?selRes.homLabel:'', cp_homColor:selRes?selRes.homColor:'', cp_homBg:selRes?selRes.homBg:'',
      cp_canSubmit:canSubmit, cp_isAuto:selRes?(this.isAuto(selRes.platform)||selRes.homolog==='auto'):false,
      cp_isWaiting:selRes?selRes.status==='waiting':false, cp_isDone:selRes?selRes.status==='completed':false,
      cp_fileLabel:S.evidenceFile||'Choose evidence file (PDF, PNG, DOCX…)', cp_fileColor:S.evidenceFile?'var(--text)':'var(--text-3)',
      pickEvidence:()=>{ const n=['certificate.pdf','completion-screenshot.png','badge.png','transcript.pdf'][Math.floor(Math.random()*4)]; this.setState({evidenceFile:n}); },
      submitEvidence:()=>this.submitEvidence(), markDone:()=>{ if(selRes) this.markResourceDone(selRes.id); },
      cp_back:()=>this.go('explore'),
      exploreCards, exploreEmpty:exploreCards.length===0,
```
Reemplazar con:
```js
      ln_courseName:course.name,
      exploreCards, exploreEmpty:exploreCards.length===0,
```

- [ ] **Step 3: Eliminar el HTML `<!-- LEARNER: COURSE PAGE -->`**

Localizar el bloque completo (~líneas 973–1027, desde el comentario hasta el `</sc-if>` que lo cierra, justo antes de `</div></main>`):
```html
      <!-- LEARNER: COURSE PAGE -->
      <sc-if value="{{ showCoursePage }}" hint-placeholder-val="{{ false }}">
      ... (todo el contenido) ...
      </div>
      </sc-if>
```
Eliminar el bloque completo (no dejar reemplazo). Verificar que justo después quede directamente:
```html

    </div>
  </main>
```

- [ ] **Step 4: Redirigir `cl_continue` (botón "Continuar" del Home)**

Localizar (~línea 2515):
```js
      cl_continue:()=>{ if(contD) this.setState({detailCourse:cid,screen:'course',detailRes:contD.id}); },
```
Reemplazar con:
```js
      cl_continue:()=>{ if(contD) this.setState({myPathActive:cid,screen:'active',detailRes:contD.id}); },
```

- [ ] **Step 5: Redirigir `pv_open` (botón "Open course" del preview modal de Explorar)**

Localizar (~línea 2573):
```js
      pv_open:()=>{ if(pc){ this.setState({detailCourse:pc.id,screen:'course',previewCourse:null,detailRes:null}); } },
```
Reemplazar con:
```js
      pv_open:()=>{ if(pc){ this.setState({myPathActive:pc.id,screen:'active',previewCourse:null,detailRes:null}); } },
```

- [ ] **Step 6: Limpiar `learnerOpenPath` del state (dead state, solo lo usaba la course page)**

Localizar (~línea 1396):
```js
    detailCourse:'qa', detailRes:null, learnerTab:'overview', learnerOpenPath:{}, evidenceFile:'',
    myPathActive:null,
```
Reemplazar con:
```js
    detailCourse:'qa', detailRes:null, learnerTab:'overview', evidenceFile:'',
    myPathActive:null,
```

- [ ] **Step 7: Eliminar el título `course` de `vChrome()` (ya no se usa)**

Localizar (~línea 1895):
```js
      explore:['Explore Courses','Discover courses and grow your skills'],
      course:['Course', S.detailCourse?(this.courseById(S.detailCourse)||{}).name:'']
    };
```
Reemplazar con:
```js
      explore:['Explore Courses','Discover courses and grow your skills']
    };
```

- [ ] **Step 8: Verificar en browser**

Learner → Home → clic "Continuar" en el hero: navega directo a Active Learning con el resource correspondiente ya abierto en el modal de detalle (Task 7). Learner → Explorar → clic en un course card → "Preview" → si el path ya está asignado, "Open course" navega a Active Learning (no debe haber pantalla en blanco ni error de consola). No debe quedar ninguna referencia a `screen==='course'` en la app.

- [ ] **Step 9: Commit**

```bash
git add "Provana LMS.dc.html"
git commit -m "fix: remove orphaned course page, redirect Continue/Open course into Content"
```

---

## Resumen de tareas

| # | Tarea | Screen afectado |
|---|---|---|
| 1 | State + helpers + sidebar Content dropdown | Learner sidebar |
| 2 | Pantalla Paths (landing con cards) | Learner → Content → Paths |
| 3 | Hero compartido + Active Learning | Learner → Content → Active Learning |
| 4 | ToDo List | Learner → Content → ToDo List |
| 5 | History | Learner → Content → History |
| 6 | Certificates | Learner → Content → Certificates |
| 7 | Modal de detalle de resource | Modal (usado por ToDo/Active/History) |
| 8 | Eliminar course page huérfana | Home, Explorar (preview modal) |

**Orden recomendado:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Cada tarea hace commit independiente. Las tareas 3–6 comparten el bloque HTML "CONTENT HERO", por eso deben ejecutarse en orden (cada una inserta su sección `<sc-if>` dentro del mismo contenedor).
