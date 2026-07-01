# Learner — Rediseño de navegación "Content" (Mis Paths)

**Fecha:** 2026-07-01
**Archivo base:** `Provana LMS.dc.html`
**Scope:** Solo la vista del Learner (Home, sidebar, y todo lo que hoy es la pantalla "Mis Paths"). No se toca Admin ni Manager.

---

## Problema

La pantalla actual "Mis Paths" (`screen:'mypaths'`) muestra un único bloque plano: tabs de path arriba, y debajo todos los resources de un módulo mezclados sin distinguir completados, en progreso, pendientes o esperando aprobación. Además existe una segunda pantalla de navegación de resources ("course page", `screen:'course'`) que solo se alcanza desde el botón "Continuar" del Home y no está en el sidebar — dos formas distintas e inconsistentes de ver el mismo contenido.

No existen pantallas dedicadas a Certificados ni a Historial de cursos completados; todo vive amontonado en la misma vista.

---

## Resumen del cambio

1. El ítem del sidebar "Mis Paths" se reemplaza por **"Content"**, un dropdown (acordeón) con 5 sub-items.
2. La pantalla "course" huérfana se elimina — su función (detalle + evidencia de un resource) se absorbe dentro de Active Learning / ToDo List.
3. Se agregan 4 pantallas nuevas con datos ya existentes en el modelo (`resources`, `homologRequests`), sin necesidad de nuevos campos de datos.

---

## 1. Sidebar: "Content"

```
Content  ⌄            ← clic en "Content" expande/colapsa (acordeón inline)
  ├─ Paths            ← landing: cards de todos los paths asignados
  ├─ ToDo List      4
  ├─ Active Learning 3
  ├─ History
  └─ Certificates    4
Explorar
Homologar
```

- "Content" reemplaza a "Mis Paths" como ítem padre del nav learner. Es un simple toggle expand/collapse — no navega por sí mismo.
- Los 5 sub-items son entradas de navegación reales (`screen: 'paths' | 'todo' | 'active' | 'history' | 'certificates'`).
- Badges numéricos (ToDo List, Active Learning, Certificates) muestran conteo de items en esa categoría para el path activo, mismo patrón visual que los badges de Approvals/Enrollments del Manager.
- Nuevo state: `myPathActive` (pathId actualmente seleccionado, default = `primaryPathId` del learner) y `contentExpanded` (bool, si el acordeón está abierto). Los badges numéricos del sidebar siempre reflejan `myPathActive`, incluso antes de visitar la pantalla "Paths".

---

## 2. Pantalla "Paths" (landing)

Cards de todos los paths asignados al learner (primario + secundarios), cada uno con: nombre, nivel, badge "🎯 Principal" o "📘 Secundario", barra de progreso.

```
┌───────────────────┐  ┌───────────────────┐
│ 🎯 Principal        │  │ 📘 Secundario       │
│ Quality Assurance   │  │ Business Intelligence│
│ Senior QA            │  │ BI Analyst           │
│ ▓▓▓▓▓░░░░░ 42%       │  │ ▓▓░░░░░░░░ 20%        │
└───────────────────┘  └───────────────────┘
```

Clic en un card → `myPathActive = path.id`, navega a **Active Learning** (pantalla por defecto al entrar a un path).

---

## 3. Hero compartido

Aparece arriba de ToDo List, Active Learning, History y Certificates — mismo componente en las 4, solo cambia el contenido debajo.

```
┌─────────────────────────────────────────────────────────┐
│  🧪  TU PATH ASIGNADO              42%                    │
│      Senior QA                     completado              │
│      Testing, automation...        ▓▓▓▓░░░░░               │
│  ───────────────────────────────────────────────────      │
│   5/12          400            2                          │
│   homologados   puntos         awaiting homologation       │
└─────────────────────────────────────────────────────────┘
[ Quality Assurance 🎯 ]  [ Business Intelligence ]   ← pills, cambian myPathActive
```

**Cálculo de stats** (sobre `resources` filtrados por `courseId === myPathActive` y `level` asignado a ese path):
- `X/Y homologados` = count(`status==='completed'`) / count(total resources del path+level).
- `puntos` = suma de `points` de los resources completados.
- `awaiting homologation` = count(`status==='waiting'`) + count(`homologRequests` pendientes de ese `pathId`).
- `% completado` = igual al cálculo que ya usa `courseProgress()`, ahora aplicado a `myPathActive` en vez de fijo a `'qa'`.

Sin tabs horizontales encima del hero (a diferencia de las referencias) — esa navegación ya vive en el sidebar bajo "Content", evitando duplicarla.

---

## 4. Las 4 sub-pantallas

Todas filtran sobre los mismos `resources` (`courseId === myPathActive`, `level` asignado a ese path).

### ToDo List
Tabla agrupada por módulo (mismo agrupamiento visual que la pantalla actual):
```
PLAYWRIGHT
  ○  Playwright Advanced Patterns   Udemy · 7h        [ Empezar → ]
CYPRESS
  ○  Cypress Advanced               Coursera · 8h     [ Empezar → ]
```
Filtro: `status === 'not-started'`. "Empezar" abre el link del recurso en una pestaña nueva y marca el resource `in-progress` (misma acción que hoy dispara ese cambio de estado); el resource aparece luego en Active Learning.

### Active Learning
Cards en grid de 3 columnas:
- `status === 'in-progress'` → card con barra de %, "Last activity", botón "Continue" (abre el link del recurso).
- `status === 'waiting'` → misma card con badge **"Awaiting approval"** en vez de barra/botón — evidencia ya enviada, pendiente del manager.

### History
Tabla: `Course | Completed | Score | Homologation`.
Filtro: `status === 'completed'`. Columna Homologation: "Homologated" si tuvo aprobación de evidencia, "Auto-validated" si la plataforma es de auto-completado (`isAuto(platform)`).

### Certificates
Cards en grid de 3 columnas: banner con ícono de medalla, título, plataforma + fecha de completado, botón **Download** (decorativo — el prototipo no maneja archivos reales, consistente con el resto del sistema).
Filtro: `status === 'completed' && hasCert === true`.

---

## 5. Qué se elimina

- Pantalla `screen:'course'` (`showCoursePage`, HTML `<!-- LEARNER: COURSE PAGE -->`, computeds `cp_*` y `tree` en `vLearner()`).
- El botón "Continuar" del Home (`cl_continue`) deja de navegar a `screen:'course'` y en su lugar setea `myPathActive` al path del resource en progreso y navega a `screen:'active'`.

## 6. Qué NO cambia

- Home, Explorar, Homologar quedan como están hoy (ya cubiertos por el plan anterior).
- No se agregan campos nuevos a `resources`, `users` ni `homologRequests` — todo el cálculo se deriva de los campos existentes (`status`, `level`, `courseId`, `points`, `hasCert`, `platform`).

---

## Fuera de alcance

- Descarga real de certificados (requiere almacenamiento de archivos, no existe en el prototipo).
- Vista de niveles distintos al asignado dentro de un mismo path (ej. previsualizar Junior QA estando en Senior QA) — se descartó explícitamente durante el brainstorming.
