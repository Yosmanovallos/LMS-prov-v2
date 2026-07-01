# LMS Provana — Diseño de Mejoras v2
**Fecha:** 2026-06-30  
**Archivo base:** `Provana LMS.dc.html`  
**Scope:** Solo HTML (mismo design system, sin backend, sin cambios de estilos)

---

## Resumen

Se agregan seis grupos de cambios al prototipo HTML existente:

1. Paths por rol (10 roles definidos)
2. Levels por seniority dentro de cada path
3. Skills solo en Resources (eliminar de Modules)
4. Enrollments gestionados por el Manager con opción Primary/Secondary
5. Learner view rediseñado (4 pantallas simples)
6. Flujo de homologación iniciado por el Learner

---

## 1. Admin: Paths (roles)

### Qué cambia
La pantalla **Paths** deja de mostrar "cursos" (Junior QA, Senior QA, etc.) y pasa a mostrar los **10 roles organizacionales** como cards.

### Los 10 paths/roles
| Path | Ícono sugerido |
|---|---|
| Quality Assurance | flask |
| Business Analyst | chart |
| Business Intelligence | database |
| RPA Developer | rocket |
| Developer | code |
| Architect | blueprint (globe) |
| IT | cpu |
| Case Manager | clipboard |
| Legal System | shield |
| Project Manager | briefcase |

### Comportamiento
- Cada card muestra: nombre del rol, cantidad de levels, cantidad de learners asignados, estado (published/draft), botones **Edit** y **View Levels →**
- El botón "New Path" del admin crea un nuevo rol organizacional
- Filtros: búsqueda por nombre, filtro por status (published/draft/archived)
- Al hacer **View Levels →**, la pantalla Levels se abre prefiltrada por ese path

---

## 2. Admin: Levels (seniority)

### Qué cambia
Los levels dejan de ser "Foundational / Intermediate / Advanced" y pasan a representar **grados de seniority** dentro de cada path.

### Ejemplos de levels por path
| Path | Levels |
|---|---|
| Quality Assurance | Junior QA, Mid-Level QA, Senior QA, QA Lead |
| Business Analyst | Junior BA, Senior BA, BA Lead |
| Developer | Junior Dev, Mid-Level Dev, Senior Dev, Tech Lead |
| RPA Developer | Junior RPA, Senior RPA, RPA Lead |
| Business Intelligence | BI Analyst, Senior BI Analyst, BI Lead |
| Architect | Solution Architect, Enterprise Architect |
| IT | IT Support, IT Specialist, IT Lead |
| Case Manager | Case Manager I, Case Manager II, Senior Case Manager |
| Legal System | Legal Analyst, Senior Legal Analyst |
| Project Manager | Junior PM, Senior PM, Program Manager |

### Comportamiento
- La tabla de Levels tiene columnas: `Level | Path | Completion Rule | Modules | Resources | Actions`
- Se puede filtrar por Path
- El admin puede crear/editar levels y asignarlos a un path
- Completion rule: "All modules required" o "Pass 80% of modules"

---

## 3. Admin: Modules

### Qué cambia
Se elimina la columna **Skills** de la tabla de módulos. Los módulos no tienen skills — solo los resources los tienen.

### Columnas nuevas
`Module | Level | Path | Resources | Actions`

### Sin otros cambios
La funcionalidad de crear/editar módulos permanece igual. El modal de edición de módulo no incluye campo de skills.

---

## 4. Admin: Resources

### Sin cambios
Las skills permanecen en resources. La tabla y el modal de edición de resources no se modifican.

---

## 5. Admin: Users

### Qué cambia
La columna "Course" se renombra a **"Primary Path"** y muestra el path asignado al learner (ej. "Quality Assurance › Senior QA").

### Columnas
`User | Role | Primary Path | Status | Manager | Actions`

### Restricción
El admin puede **ver** el path asignado pero **no puede cambiarlo** desde esta pantalla. Los enrollments los gestiona el Manager.

---

## 6. Manager: Enrollments (Primary + Secondary)

### Pantalla nueva en el sidebar del Manager
El Manager tiene una nueva pantalla **"Enrollments"** que reemplaza la vista de enrollments del Admin.

### Vista principal
Tabla con el equipo del manager:
`Learner | Primary Path | Level | Secondary Paths | Status | Actions`

- Columna "Secondary Paths": muestra badges con los paths secundarios asignados (máx 3 visible, "+N más" si hay más)
- Botón **"Manage"** en cada fila abre el panel de gestión

### Panel de gestión por learner (modal)
Al hacer clic en "Manage" se abre un modal con dos secciones:

**PRIMARY PATH** (solo uno)
- Muestra el path y level actuales
- Botón "Cambiar" abre dropdowns: `[Path] › [Level]`
- Al guardar, se actualiza el primary path del learner

**SECONDARY PATHS** (múltiples)
- Lista de paths secundarios asignados con botón "×" para remover cada uno
- Botón "+ Agregar secondary path" abre dropdowns: `[Path] › [Level]`
- Nota: si el learner solicita un secondary desde Explorar, aparece aquí como pendiente de aprobación con botones Aprobar/Rechazar

### Flujo de solicitud del learner
Cuando el learner hace "Solicitar acceso" en Explorar, el manager recibe una notificación y la solicitud aparece en el panel de ese learner con badge "Pending" y botones Aprobar / Rechazar.

---

## 7. Manager: Approvals (expandido)

### Qué cambia
La cola de aprobaciones incluye ahora **dos tipos** de solicitudes, diferenciadas con un badge:

**Tipo `Evidence`** (flujo existente)
El learner subió evidencia para validar un recurso requerido. Manager aprueba → recurso marcado como completado.

**Tipo `Homologation`** (nuevo)
El learner declaró que ya completó un recurso externamente y subió evidencia. Manager ve:
- Nombre del recurso
- Path › Level › Module al que pertenece
- Evidencia adjunta
- Al **Aprobar** → el recurso queda marcado como `completed` en el perfil del learner
- Al **Rechazar** → se requiere nota que llega al learner

### Layout de cada card en la cola
```
[Avatar] Nombre del learner
         Título del recurso                    [badge: Evidence | Homologation]
         Path › Level › Module · Plataforma · Enviado [fecha]
         [📎 Evidencia adjunta]
                                        [Aprobar] [Rechazar]
```

---

## 8. Learner: Home (rediseñado)

### Qué es
Pantalla principal del learner. Simple, sin tabs, sin secciones múltiples.

### Contenido
1. **Hero "Continuar"**: el recurso en progreso más reciente con barra de progreso y botón Continue. Solo se muestra si hay algo en progreso.

2. **Primary Path card**: nombre del path, level actual, porcentaje de completado, barra de progreso, botón "Ver path →"

3. **Secondary Paths**: lista compacta con nombre, level y progreso de cada secondary path asignado. Botón "Ver →" en cada uno.

4. **Alertas** (si las hay): recursos vencidos, evidencias en espera de validación — como chips/banners pequeños, no intrusivos.

5. **Acciones rápidas** al fondo: `[Ver mis paths]` `[Homologar curso previo]`

---

## 9. Learner: Mi Path (detalle)

### Cómo se accede
Desde Home → "Ver path →" en Primary o Secondary path.

### Layout
- Breadcrumb: `Path › Level`
- Selector de level (tabs o dropdown si tiene múltiples levels asignados en ese path)
- Árbol de contenido: `Module → Resources` con íconos de estado:
  - ✅ Completado
  - 🔵 En progreso (con %)
  - ⏳ Esperando validación
  - ○ No iniciado
- Al hacer clic en un resource, se abre el panel de detalle a la derecha (igual al diseño actual)

### Sin cambios en el panel de detalle de recurso
El panel derecho mantiene: título, plataforma, status, skills, descripción, link, y el flujo de evidencia existente.

---

## 10. Learner: Explorar

### Qué muestra
Cards de paths que el learner **no tiene asignados** (ni primary ni secondary).

### Card de path
- Nombre del path, descripción, levels disponibles (badges), cantidad de resources
- Botón **"Solicitar acceso"** → envía notificación al manager para aprobar como secondary path
- Si ya solicitó, el botón muestra **"Solicitud enviada"** (deshabilitado)

---

## 11. Learner: Homologar

### Qué es
Pantalla dedicada para que el learner declare que ya completó un recurso de sus paths asignados, fuera de la plataforma.

### Flujo en 3 pasos (dentro de la misma pantalla)

**Paso 1 — Seleccionar recurso**
- Dropdown 1: `[Seleccionar path]` (primary + secondaries del learner)
- Dropdown 2: `[Seleccionar recurso]` — filtra recursos del path elegido que no estén completados

**Paso 2 — Subir evidencia**
- Campo de upload: certificado, captura de pantalla, o link
- Campo de notas opcional

**Paso 3 — Enviar**
- Botón "Enviar solicitud al manager"
- Toast de confirmación

### Historial de solicitudes
Debajo del formulario, tabla con solicitudes previas:
`Recurso | Path | Enviado | Estado (Pendiente / Aprobado / Rechazado) | Nota del manager`

---

## Datos de ejemplo a actualizar

Los `courses` del state se renombran conceptualmente a `paths` con los 10 roles. Los `resources` mantienen su estructura pero su `courseId` referencia el nuevo path. Los levels en los resources pasan de "Foundational/Intermediate/Advanced" a los grados de seniority correspondientes.

Los `users` ganan un campo `secondaryPaths: []` para almacenar paths secundarios.

Las `homologs` (solicitudes de homologación) ganan un campo `type: 'evidence' | 'homologation'` para diferenciar en la cola del manager.

---

## Restricciones

- Solo HTML — mismo archivo `Provana LMS.dc.html`
- Mismo design system: variables CSS, tipografía Inter, border-radius, colores de marca
- No se agregan dependencias externas
- No se modifica el layout del sidebar ni el header chrome
- Dark mode funciona sin cambios adicionales (usa variables CSS existentes)
