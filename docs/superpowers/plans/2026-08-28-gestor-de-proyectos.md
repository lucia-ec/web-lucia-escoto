# Gestor de proyectos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el formulario único de "añadir proyecto" del panel de administración por un flujo de tres pantallas a pantalla completa (lista de proyectos, añadir, editar) con borrado, con colores semánticos por acción (azul=añadir, verde=editar, rojo=eliminar, ámbar=destacado).

**Architecture:** Todo el trabajo es cliente (HTML/CSS/JS ES modules, sin build). La lectura de proyectos para pintar la tabla usa `import()` dinámico de `js/data/projects.js` (ya es un módulo ES real). La escritura (añadir/editar/eliminar/destacar) sigue pasando por el mismo endpoint que ya existe (`/__admin/save-projects`, servido por `scripts/admin-server.py`, que no se toca), construyendo el nuevo contenido del archivo mediante manipulación del **texto fuente** (no del array parseado) para no perder comentarios ni reformatear entradas que no se tocan.

**Tech Stack:** HTML, CSS, JavaScript (ES modules), Python 3 (`http.server`, sin cambios), `node --test` para las pruebas.

## Global Constraints

- Sin librerías externas ni build step — todo JS es ES modules cargados directamente por el navegador, todo icono es SVG en línea.
- Comentarios y textos de interfaz en español; nomenclatura BEM en las clases nuevas.
- Este proyecto **no tiene repositorio git** (`git status` falla con "not a git repository"). Sustituye cada paso "Commit" por "Guardar el archivo" — no hay comandos `git` que ejecutar en este plan.
- No se define ningún color nuevo: se reutilizan los tokens ya existentes en `css/tokens.css` (`--color-accent`, `--color-success`, `--color-danger`, `--color-warning`, `--color-ink-3`).
- `scripts/admin-server.py` no se toca en ningún task de este plan.
- Spec completa: `docs/superpowers/specs/2026-08-28-gestor-de-proyectos-design.md`.

---

## Task 1: Localizar, reemplazar y quitar un proyecto por id en el texto fuente

**Files:**
- Modify: `js/admin/buildProjectEntry.js`
- Test: `js/admin/buildProjectEntry.test.js`

**Interfaces:**
- Consumes: nada nuevo — usa solo JS estándar.
- Produces: `findProjectRange(sourceText, id) => {start: number, end: number}` (lanza `Error` si no encuentra el id), `replaceProjectInSource(sourceText, id, projectObjectSource) => string`, `removeProjectFromSource(sourceText, id) => string`. Los tasks 6 y 7 llaman a `replaceProjectInSource` y `removeProjectFromSource`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Añade al final de `js/admin/buildProjectEntry.test.js` (después del último `test(...)` que ya existe, antes de que se cierre el archivo):

```js
const RANGE_FIXTURE = `export const projects = [
  /* ▲ ANCLA-ADMIN: no borrar esta línea. */
  {
    id: 'proyecto-uno',
    title: 'Uno',
    description: 'Contiene llaves { y } dentro del texto sin romper nada.',
  },
  {
    id: 'proyecto-dos',
    /* REEMPLAZAR con la fecha real de publicación */
    title: 'Dos',
  },
  {
    id: 'proyecto-tres',
    title: 'Tres',
  },
];
`;

test('findProjectRange encuentra el primer proyecto', () => {
  const range = findProjectRange(RANGE_FIXTURE, 'proyecto-uno');
  const block = RANGE_FIXTURE.slice(range.start, range.end);
  assert.match(block, /id: 'proyecto-uno'/);
  assert.doesNotMatch(block, /proyecto-dos/);
});

test('findProjectRange encuentra el proyecto del medio, con llaves en la descripción', () => {
  const range = findProjectRange(RANGE_FIXTURE, 'proyecto-uno');
  const block = RANGE_FIXTURE.slice(range.start, range.end);
  assert.match(block, /Contiene llaves \{ y \} dentro/);
});

test('findProjectRange encuentra el último proyecto', () => {
  const range = findProjectRange(RANGE_FIXTURE, 'proyecto-tres');
  const block = RANGE_FIXTURE.slice(range.start, range.end);
  assert.match(block, /id: 'proyecto-tres'/);
});

test('findProjectRange no se descuadra con un comentario de bloque dentro del objeto', () => {
  const range = findProjectRange(RANGE_FIXTURE, 'proyecto-dos');
  const block = RANGE_FIXTURE.slice(range.start, range.end);
  assert.match(block, /id: 'proyecto-dos'/);
  assert.match(block, /REEMPLAZAR con la fecha real/);
  assert.doesNotMatch(block, /proyecto-tres/);
});

test('findProjectRange lanza un error claro si el id no existe', () => {
  assert.throws(
    () => findProjectRange(RANGE_FIXTURE, 'no-existe'),
    /No se encontró el proyecto con id "no-existe"/
  );
});

test('replaceProjectInSource sustituye solo el bloque del proyecto indicado', () => {
  const nuevo = `  {\n    id: 'proyecto-dos',\n    title: 'Dos (editado)',\n  },\n`;
  const result = replaceProjectInSource(RANGE_FIXTURE, 'proyecto-dos', nuevo);
  assert.match(result, /title: 'Dos \(editado\)'/);
  assert.doesNotMatch(result, /REEMPLAZAR con la fecha real/);
  assert.match(result, /id: 'proyecto-uno'/);
  assert.match(result, /id: 'proyecto-tres'/);
  assert.match(result, /ANCLA-ADMIN/);
});

test('removeProjectFromSource quita el proyecto del medio y deja los demás intactos', () => {
  const result = removeProjectFromSource(RANGE_FIXTURE, 'proyecto-dos');
  assert.doesNotMatch(result, /proyecto-dos/);
  assert.match(result, /id: 'proyecto-uno'/);
  assert.match(result, /id: 'proyecto-tres'/);
  assert.doesNotMatch(result, /\n\n\n/);
});

test('removeProjectFromSource quita el primer proyecto sin dejar una coma suelta', () => {
  const result = removeProjectFromSource(RANGE_FIXTURE, 'proyecto-uno');
  assert.doesNotMatch(result, /proyecto-uno/);
  assert.match(result, /ANCLA-ADMIN/);
  assert.match(result, /id: 'proyecto-dos'/);
});

test('removeProjectFromSource quita el último proyecto', () => {
  const result = removeProjectFromSource(RANGE_FIXTURE, 'proyecto-tres');
  assert.doesNotMatch(result, /proyecto-tres/);
  assert.match(result, /id: 'proyecto-dos'/);
});
```

Y añade `findProjectRange, replaceProjectInSource, removeProjectFromSource,` al `import { ... } from './buildProjectEntry.js';` que ya existe arriba del archivo de test.

- [ ] **Step 2: Ejecutar las pruebas y comprobar que fallan**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --test js/admin/buildProjectEntry.test.js`
Expected: FAIL — `findProjectRange is not a function` (o similar, porque todavía no existe).

- [ ] **Step 3: Implementar `findProjectRange`, `replaceProjectInSource` y `removeProjectFromSource`**

Añade al final de `js/admin/buildProjectEntry.js`:

```js
/**
 * Recorre el texto fuente una vez y devuelve el rango [start, end] (índices
 * de carácter, `end` inclusive) de cada bloque `{ ... }` que aparece al
 * nivel más externo de anidamiento de llaves — que es exactamente el nivel
 * en el que viven los objetos de proyecto dentro del array `projects`.
 * Ignora las llaves que aparezcan dentro de literales de cadena (comillas
 * simples, dobles o backticks, respetando el escape) y dentro de
 * comentarios (`// ...` y `/* ... *&#47;`), para que un `{` o `}` que
 * aparezca en la descripción de un proyecto no descuadre el conteo.
 * @param {string} sourceText
 * @returns {{start: number, end: number}[]}
 */
function scanTopLevelObjectRanges(sourceText) {
  const ranges = [];
  let depth = 0;
  let start = -1;
  let i = 0;
  const len = sourceText.length;

  while (i < len) {
    const ch = sourceText[i];
    const next = sourceText[i + 1];

    if (ch === '/' && next === '/') {
      i += 2;
      while (i < len && sourceText[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(sourceText[i] === '*' && sourceText[i + 1] === '/')) {
        i += 1;
      }
      i += 2;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < len && sourceText[i] !== quote) {
        if (sourceText[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
      i += 1;
      continue;
    }

    if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        ranges.push({ start, end: i });
        start = -1;
      }
      i += 1;
      continue;
    }

    i += 1;
  }

  return ranges;
}

/**
 * Encuentra el rango de texto que ocupa el objeto de un proyecto por su
 * `id`, incluyendo la coma final y el salto de línea que le sigue si los
 * hay (para poder quitar o sustituir el bloque entero de una vez, sin dejar
 * una coma suelta ni una línea en blanco de más).
 * @param {string} sourceText
 * @param {string} id
 * @returns {{start: number, end: number}}
 * @throws {Error} si no encuentra un proyecto con ese id.
 */
export function findProjectRange(sourceText, id) {
  const idPattern = new RegExp(`(?:id:\\s*'${id}'|"id":\\s*"${id}")`);
  const idMatch = idPattern.exec(sourceText);
  if (!idMatch) {
    throw new Error(
      `No se encontró el proyecto con id "${id}". Puede que se haya modificado desde otro sitio; recarga la lista.`
    );
  }

  const ranges = scanTopLevelObjectRanges(sourceText);
  const range = ranges.find(
    (r) => r.start <= idMatch.index && idMatch.index <= r.end
  );
  if (!range) {
    throw new Error(`No se pudo delimitar el bloque del proyecto con id "${id}".`);
  }

  let end = range.end + 1;
  if (sourceText[end] === ',') end += 1;
  if (sourceText[end] === '\n') end += 1;

  return { start: range.start, end };
}

/**
 * Sustituye el bloque de un proyecto existente por un objeto serializado
 * nuevo (normalmente el resultado de `formatProjectObjectSource`).
 * @param {string} sourceText
 * @param {string} id
 * @param {string} projectObjectSource
 * @returns {string}
 */
export function replaceProjectInSource(sourceText, id, projectObjectSource) {
  const { start, end } = findProjectRange(sourceText, id);
  return sourceText.slice(0, start) + projectObjectSource + sourceText.slice(end);
}

/**
 * Quita por completo el bloque de un proyecto del texto fuente.
 * @param {string} sourceText
 * @param {string} id
 * @returns {string}
 */
export function removeProjectFromSource(sourceText, id) {
  const { start, end } = findProjectRange(sourceText, id);
  return sourceText.slice(0, start) + sourceText.slice(end);
}
```

- [ ] **Step 4: Ejecutar las pruebas y comprobar que pasan**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --test js/admin/buildProjectEntry.test.js`
Expected: PASS, todas las pruebas en verde (las que ya existían más las nuevas).

- [ ] **Step 5: Guardar el archivo**

(Sin git en este proyecto — el archivo ya queda guardado en disco al terminar la edición.)

---

## Task 2: Precargar y fusionar los datos de un proyecto al editarlo

**Files:**
- Modify: `js/admin/buildProjectEntry.js`
- Test: `js/admin/buildProjectEntry.test.js`

**Interfaces:**
- Consumes: `buildProjectFromForm` (ya existe en este mismo archivo, task 7 no la toca).
- Produces: `projectToFormValues(project) => object` (mismo shape que devuelve `readFormValues()` en `main-admin.js`), `mergeEditedProject(existingProject, values, coverPath, galleryPaths) => object`. El task 7 (`main-admin.js`) usa las dos.

- [ ] **Step 1: Escribir las pruebas que fallan**

Añade a `js/admin/buildProjectEntry.test.js` (y añade `projectToFormValues, mergeEditedProject,` al import de arriba):

```js
test('projectToFormValues convierte arrays en texto separado por comas', () => {
  const project = {
    id: 'demo',
    title: 'Demo',
    tags: ['Java', 'Kotlin'],
    categories: ['movil'],
    highlights: ['Uno', 'Dos'],
    links: { demo: '', repo: 'https://github.com/x/y', caseStudy: '' },
    year: 2026,
    featured: true,
  };
  const values = projectToFormValues(project);
  assert.equal(values.tags, 'Java, Kotlin');
  assert.equal(values.categories, 'movil');
  assert.equal(values.highlights, 'Uno\nDos');
  assert.equal(values.links.repo, 'https://github.com/x/y');
  assert.equal(values.year, '2026');
  assert.equal(values.featured, true);
});

test('projectToFormValues es el inverso de buildProjectFromForm para los campos de tipo lista', () => {
  const values = {
    id: 'demo', title: 'Demo', tagline: '', description: '', role: '', year: '2026',
    status: '', featured: false, tags: 'Java, Kotlin', categories: 'movil',
    highlights: 'Uno\nDos', links: { demo: '', repo: '', caseStudy: '' },
  };
  const project = buildProjectFromForm(values, '', []);
  const roundTrip = projectToFormValues(project);
  assert.equal(roundTrip.tags, 'Java, Kotlin');
  assert.equal(roundTrip.categories, 'movil');
  assert.equal(roundTrip.highlights, 'Uno\nDos');
});

test('mergeEditedProject conserva campos que el formulario no gestiona, como date', () => {
  const existing = {
    id: 'demo', title: 'Demo', date: '2026-05-20', cover: 'assets/img/demo.png',
    gallery: [], tags: [], categories: [], highlights: [], links: {},
  };
  const values = {
    id: 'demo', title: 'Demo editado', tagline: '', description: '', role: '',
    year: '2026', status: '', featured: false, tags: '', categories: '',
    highlights: '', links: { demo: '', repo: '', caseStudy: '' },
  };
  const merged = mergeEditedProject(existing, values, 'assets/img/demo.png', []);
  assert.equal(merged.date, '2026-05-20');
  assert.equal(merged.title, 'Demo editado');
});

test('mergeEditedProject borra el año si se deja vacío en el formulario', () => {
  const existing = { id: 'demo', title: 'Demo', year: 2026, tags: [], categories: [], highlights: [], links: {} };
  const values = {
    id: 'demo', title: 'Demo', tagline: '', description: '', role: '',
    year: '', status: '', featured: false, tags: '', categories: '',
    highlights: '', links: { demo: '', repo: '', caseStudy: '' },
  };
  const merged = mergeEditedProject(existing, values, '', []);
  assert.equal('year' in merged, false);
});
```

- [ ] **Step 2: Ejecutar las pruebas y comprobar que fallan**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --test js/admin/buildProjectEntry.test.js`
Expected: FAIL — `projectToFormValues is not a function`.

- [ ] **Step 3: Implementar `projectToFormValues` y `mergeEditedProject`**

Añade al final de `js/admin/buildProjectEntry.js`:

```js
/**
 * Convierte un objeto Project (tal como sale de importar projects.js) en
 * los valores de formulario que espera el panel — inverso de
 * `buildProjectFromForm` para los campos de tipo lista.
 * @param {object} project
 * @returns {object}
 */
export function projectToFormValues(project) {
  const links = project.links && typeof project.links === 'object' ? project.links : {};
  return {
    id: project.id || '',
    title: project.title || '',
    tagline: project.tagline || '',
    description: project.description || '',
    role: project.role || '',
    year: project.year ? String(project.year) : '',
    status: project.status || '',
    featured: Boolean(project.featured),
    tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
    categories: Array.isArray(project.categories) ? project.categories.join(', ') : '',
    highlights: Array.isArray(project.highlights) ? project.highlights.join('\n') : '',
    links: {
      demo: links.demo || '',
      repo: links.repo || '',
      caseStudy: links.caseStudy || '',
    },
  };
}

/**
 * Construye el objeto Project actualizado para un proyecto que ya existía,
 * conservando cualquier campo que el formulario no gestiona (por ejemplo
 * `date`) y permitiendo borrar el año si se deja vacío en el formulario.
 * @param {object} existingProject
 * @param {object} values
 * @param {string} coverPath
 * @param {string[]} galleryPaths
 * @returns {object}
 */
export function mergeEditedProject(existingProject, values, coverPath, galleryPaths) {
  const built = buildProjectFromForm(values, coverPath, galleryPaths);
  const merged = { ...existingProject, ...built };
  if (!(values.year && String(values.year).trim())) {
    delete merged.year;
  }
  return merged;
}
```

- [ ] **Step 4: Ejecutar las pruebas y comprobar que pasan**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --test js/admin/buildProjectEntry.test.js`
Expected: PASS.

- [ ] **Step 5: Guardar el archivo**

---

## Task 3: Ordenar los proyectos por fecha para la tabla

**Files:**
- Modify: `js/admin/buildProjectEntry.js`
- Test: `js/admin/buildProjectEntry.test.js`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `sortProjectsByDate(projects) => object[]` (copia nueva, no muta el array recibido). El task 6 (`js/admin/projectList.js`) la usa para pintar la tabla.

- [ ] **Step 1: Escribir las pruebas que fallan**

Añade a `js/admin/buildProjectEntry.test.js` (y añade `sortProjectsByDate,` al import):

```js
test('sortProjectsByDate pone primero la fecha más reciente', () => {
  const projects = [
    { id: 'a', date: '2026-02-10' },
    { id: 'b', date: '2026-07-01' },
    { id: 'c', date: '2026-05-20' },
  ];
  const sorted = sortProjectsByDate(projects);
  assert.deepEqual(sorted.map((p) => p.id), ['b', 'c', 'a']);
});

test('sortProjectsByDate manda al final, en su orden original, los proyectos sin date', () => {
  const projects = [
    { id: 'sin-fecha-1' },
    { id: 'con-fecha', date: '2026-01-01' },
    { id: 'sin-fecha-2' },
  ];
  const sorted = sortProjectsByDate(projects);
  assert.deepEqual(sorted.map((p) => p.id), ['con-fecha', 'sin-fecha-1', 'sin-fecha-2']);
});

test('sortProjectsByDate no modifica el array original', () => {
  const projects = [{ id: 'a', date: '2026-01-01' }, { id: 'b', date: '2026-02-01' }];
  const copy = [...projects];
  sortProjectsByDate(projects);
  assert.deepEqual(projects, copy);
});
```

- [ ] **Step 2: Ejecutar las pruebas y comprobar que fallan**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --test js/admin/buildProjectEntry.test.js`
Expected: FAIL — `sortProjectsByDate is not a function`.

- [ ] **Step 3: Implementar `sortProjectsByDate`**

Añade al final de `js/admin/buildProjectEntry.js`:

```js
/**
 * Ordena una lista de proyectos por `date`, la más reciente primero. Los
 * proyectos sin `date` van al final, conservando entre ellos el orden en
 * que aparecían en el array original.
 * @param {object[]} projects
 * @returns {object[]} una copia nueva; no modifica el array recibido.
 */
export function sortProjectsByDate(projects) {
  const withDate = [];
  const withoutDate = [];
  projects.forEach((project, index) => {
    if (project.date) {
      withDate.push({ project, index });
    } else {
      withoutDate.push({ project, index });
    }
  });
  withDate.sort((a, b) => {
    if (a.project.date === b.project.date) return a.index - b.index;
    return a.project.date < b.project.date ? 1 : -1;
  });
  withoutDate.sort((a, b) => a.index - b.index);
  return [...withDate, ...withoutDate].map((entry) => entry.project);
}
```

- [ ] **Step 4: Ejecutar las pruebas y comprobar que pasan**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --test js/admin/buildProjectEntry.test.js`
Expected: PASS — deberían verse en torno a 27 pruebas en verde en total (las originales + tasks 1, 2 y 3).

- [ ] **Step 5: Guardar el archivo**

---

## Task 4: Estilos — pantalla completa, tabla, colores semánticos y diálogo de confirmación

**Files:**
- Modify: `css/components.css`
- Modify: `css/admin.css`

**Interfaces:**
- Consumes: tokens ya existentes en `css/tokens.css` (`--color-accent`, `--color-success`, `--color-danger`, `--color-warning`, `--color-ink-3`, `--radius-lg`, `--shadow-2`, `--shadow-3`, `--space-*`).
- Produces: clases `.admin-screen`, `.admin-screen__header`, `.project-table` (y sus descendientes), `.icon-btn--star`/`--edit`/`--delete`, `.confirm-dialog` (y sus descendientes), `.admin-current-image`, `.btn--danger`, `.btn--success`. Los tasks 5, 6 y 7 usan estas clases en el HTML/JS.

No hay pruebas automáticas para CSS en este proyecto (no las hay hoy tampoco para `layout.css`/`sections.css`); la verificación es visual y se hace en el Task 8.

- [ ] **Step 1: Añadir `.btn--danger` y `.btn--success` en `components.css`**

Justo después del bloque `.btn--ghost` (busca `.btn--ghost:hover .btn__icon {` y el `}` que lo cierra, sobre la línea 82 del archivo actual) e inmediatamente antes de `/* Terciario: solo texto... */`, inserta:

```css
/* Peligro: acciones destructivas (confirmar borrado) */
.btn--danger {
  background-color: var(--color-danger);
  color: var(--color-accent-contrast);
}

.btn--danger:hover {
  background-color: color-mix(in srgb, var(--color-danger) 85%, black);
  transform: translateY(-2px);
}

.btn--danger:active {
  transform: translateY(0);
}

/* Éxito: guardar cambios de un proyecto que ya existía */
.btn--success {
  background-color: var(--color-success);
  color: var(--color-accent-contrast);
}

.btn--success:hover {
  background-color: color-mix(in srgb, var(--color-success) 85%, black);
  transform: translateY(-2px);
}

.btn--success:active {
  transform: translateY(0);
}
```

- [ ] **Step 2: Reescribir `css/admin.css` completo**

Sustituye **todo el contenido** de `css/admin.css` por:

```css
/* ============================================================================
   admin.css — Estilos propios del panel de administración (admin.html).
   QUÉ HACE: da forma a las pantallas del panel (frase de paso, lista de
   proyectos, formulario de añadir/editar) y al diálogo de confirmación de
   borrado.
   QUÉ NO HACE: no redefine botones, campos ni chips — esos ya vienen de
   components.css y se reutilizan tal cual para que el panel no desentone
   del resto de la web.
   ============================================================================ */

.admin-page {
  min-height: 100svh;
}

/* --------------------------------------------------------------------------
   Pantalla de la frase de paso: sigue siendo una tarjeta centrada.
   -------------------------------------------------------------------------- */
.admin-card {
  width: 100%;
  max-width: 34rem;
  margin: var(--space-2xl) auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-xl);
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
}

/* .admin-card fija su propio display: flex, lo que por cascada normal
   ganaría al display: none que aplica el atributo [hidden] del navegador.
   Esta regla, más específica, evita que las pantallas ocultas se vean. */
.admin-card[hidden] {
  display: none;
}

/* --------------------------------------------------------------------------
   Pantallas a pantalla completa: lista de proyectos y formulario.
   -------------------------------------------------------------------------- */
.admin-screen {
  width: 100%;
  max-width: 64rem;
  margin-inline: auto;
  padding: var(--space-2xl) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Mismo motivo que .admin-card[hidden] más arriba: display: flex vs [hidden]. */
.admin-screen[hidden] {
  display: none;
}

.admin-screen__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.admin-title {
  font-size: var(--step-2);
  margin: 0;
}

.admin-hint {
  font-size: var(--step--1);
  color: var(--color-ink-2);
  margin: 0;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin-form-row {
  display: grid;
  gap: var(--space-sm);
  grid-template-columns: 1fr;
}

.admin-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: var(--step--1);
  color: var(--color-ink);
}

.admin-checkbox input {
  width: 1.15rem;
  height: 1.15rem;
}

.admin-current-image {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-block-end: var(--space-2xs);
}

.admin-current-image[hidden] {
  display: none;
}

.admin-current-image img {
  width: 4rem;
  height: 4rem;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-line);
}

.admin-actions {
  display: flex;
  gap: var(--space-2xs);
  flex-wrap: wrap;
}

.admin-log {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
  max-height: 12rem;
  overflow-y: auto;
  padding: var(--space-sm);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-2);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--color-ink-2);
}

.admin-log:empty {
  display: none;
}

.admin-log p {
  margin: 0;
}

/* --------------------------------------------------------------------------
   Tabla de proyectos
   -------------------------------------------------------------------------- */
.project-table {
  width: 100%;
  border-collapse: collapse;
}

.project-table tbody tr {
  border-bottom: 1px solid var(--color-line);
}

.project-table__add-row td {
  padding-block: var(--space-sm);
}

.project-table__row td {
  padding-block: var(--space-sm);
  vertical-align: middle;
}

.project-table__title-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: var(--weight-medium);
  color: var(--color-ink);
}

.project-table__actions-cell {
  text-align: right;
  white-space: nowrap;
}

.project-table__actions-cell .icon-btn {
  margin-inline-start: var(--space-2xs);
}

.icon-btn--star {
  color: var(--color-ink-3);
}

.icon-btn--star.is-featured {
  color: var(--color-warning);
}

.icon-btn--edit {
  color: var(--color-success);
}

.icon-btn--delete {
  color: var(--color-danger);
}

.project-table-empty {
  text-align: center;
  padding: var(--space-2xl) var(--space-md);
  color: var(--color-ink-2);
}

.project-table-empty[hidden] {
  display: none;
}

/* --------------------------------------------------------------------------
   Diálogo de confirmación (eliminar proyecto)
   -------------------------------------------------------------------------- */
.confirm-dialog {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  padding: var(--space-md);
  visibility: hidden;
}

.confirm-dialog.is-open {
  visibility: visible;
}

.confirm-dialog__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgb(8 13 23 / 0.6);
  opacity: 0;
  transition: opacity var(--dur-2) var(--ease-out);
}

.confirm-dialog.is-open .confirm-dialog__backdrop {
  opacity: 1;
}

.confirm-dialog__card {
  position: relative;
  width: min(28rem, 100%);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-3);
  transform: translateY(1rem);
  opacity: 0;
  transition: transform var(--dur-2) var(--ease-out),
    opacity var(--dur-2) var(--ease-out);
}

.confirm-dialog.is-open .confirm-dialog__card {
  transform: translateY(0);
  opacity: 1;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2xs);
}

@media (min-width: 30em) {
  .admin-form-row {
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 3: Guardar los archivos**

(Sin pruebas automáticas para este task — se verifica visualmente en el Task 8.)

---

## Task 5: Marcado HTML — lista de proyectos, formulario a pantalla completa, diálogo de confirmación

**Files:**
- Modify: `admin.html`

**Interfaces:**
- Consumes: clases CSS del Task 4 (`.admin-screen`, `.project-table`, `.confirm-dialog`, `.btn--danger`, `.btn--success`, `.admin-current-image`).
- Produces: ids/elementos que el Task 6 (`projectList.js`) y el Task 7 (`main-admin.js`) usan: `#project-list-section`, `#project-table-body`, `#project-table-empty`, `#add-project-button`, `#confirm-dialog` (con `#confirm-dialog-message`, `#confirm-dialog-cancel`, `#confirm-dialog-confirm`), `#project-form-section` (ahora sin recuadro), `#cancel-form-link`, `#admin-editing-id`, `#admin-cover-current` / `#admin-cover-current-img`, `#admin-gallery-current`.

- [ ] **Step 1: Sustituir la sección `#project-form-section` y añadir `#project-list-section` antes de ella**

En `admin.html`, reemplaza desde la línea `<!-- Paso 2: formulario del proyecto. ... -->` hasta el `</section>` que cierra `#project-form-section` (líneas 50–182 del archivo actual) por:

```html
      <!-- Pantalla de la lista: aparece justo después de entrar con la frase
           de paso. js/admin/projectList.js la rellena con los proyectos
           importando js/data/projects.js como módulo. -->
      <section class="admin-screen" id="project-list-section" hidden aria-labelledby="project-list-title">
        <header class="admin-screen__header">
          <h1 class="admin-title" id="project-list-title">Gestor de proyectos</h1>
          <a class="btn btn--ghost" href="index.html">Volver a la web</a>
        </header>

        <table class="project-table" id="project-table">
          <caption class="visually-hidden">Proyectos del portafolio</caption>
          <tbody id="project-table-body">
            <tr class="project-table__add-row">
              <td colspan="2">
                <button class="btn btn--primary btn--block" type="button" id="add-project-button">
                  <svg class="btn__icon" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"></path>
                  </svg>
                  Añadir proyecto
                </button>
              </td>
            </tr>
            <!-- js/admin/projectList.js añade aquí una fila .project-table__row por proyecto -->
          </tbody>
        </table>

        <p class="project-table-empty" id="project-table-empty" hidden>
          Aún no hay proyectos.
        </p>
      </section>

      <!-- Pantalla de añadir/editar: un único formulario para los dos modos.
           Se guarda directamente en disco a través del servidor local
           (scripts/admin-server.py), que exige el hash de la frase de paso
           en cada petición de escritura. -->
      <section class="admin-screen" id="project-form-section" hidden aria-labelledby="project-form-title">
        <header class="admin-screen__header">
          <h1 class="admin-title" id="project-form-title">Añadir proyecto</h1>
          <a class="btn btn--ghost" href="#" id="cancel-form-link">Cancelar</a>
        </header>

        <form class="admin-form" id="project-form" novalidate>
          <input type="hidden" id="admin-editing-id" value="" />

          <div class="field">
            <label class="field__label" for="admin-title">Título</label>
            <input class="field__control" id="admin-title" required />
            <p class="field__error"></p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-id">Identificador (id)</label>
            <input class="field__control" id="admin-id" required />
            <p class="admin-hint">Se rellena solo a partir del título; puedes editarlo.</p>
            <p class="field__error"></p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-tagline">Tagline</label>
            <input class="field__control" id="admin-tagline" />
            <p class="field__error"></p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-description">Descripción larga</label>
            <textarea class="field__control" id="admin-description" rows="5"></textarea>
            <p class="field__error"></p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-role">Tu papel en el proyecto</label>
            <input class="field__control" id="admin-role" />
            <p class="field__error"></p>
          </div>

          <div class="admin-form-row">
            <div class="field">
              <label class="field__label" for="admin-year">Año</label>
              <input class="field__control" id="admin-year" inputmode="numeric" placeholder="2026" />
              <p class="field__error"></p>
            </div>
            <div class="field">
              <label class="field__label" for="admin-status">Estado</label>
              <select class="field__control" id="admin-status">
                <option value="">Sin especificar</option>
                <option value="finalizado">Finalizado</option>
                <option value="en curso">En curso</option>
                <option value="prototipo">Prototipo</option>
              </select>
              <p class="field__error"></p>
            </div>
          </div>

          <label class="admin-checkbox">
            <input type="checkbox" id="admin-featured" />
            Destacar (tarjeta a doble ancho en escritorio)
          </label>

          <div class="field">
            <label class="field__label" for="admin-tags">Tecnologías</label>
            <input class="field__control" id="admin-tags" placeholder="Java, Kotlin, SQL" />
            <p class="admin-hint">Separadas por comas.</p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-categories">Categorías</label>
            <input class="field__control" id="admin-categories" placeholder="web, api" />
            <p class="admin-hint">Separadas por comas (web, movil, api, escritorio, u otra nueva).</p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-highlights">Puntos destacados</label>
            <textarea
              class="field__control"
              id="admin-highlights"
              rows="4"
              placeholder="Un logro por línea"
            ></textarea>
            <p class="admin-hint">Uno por línea.</p>
          </div>

          <h2 class="modal__section-title">Fotos del proyecto</h2>

          <div class="field">
            <label class="field__label" for="admin-cover">Imagen de portada</label>
            <div class="admin-current-image" id="admin-cover-current" hidden>
              <img id="admin-cover-current-img" alt="Portada actual" />
              <span class="admin-hint">Imagen actual. Sube una nueva para reemplazarla.</span>
            </div>
            <input class="field__control" id="admin-cover" type="file" accept="image/*" />
            <p class="admin-hint">Máximo 1 MB. Se sube junto con el proyecto.</p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-gallery">Más fotos (galería)</label>
            <div class="admin-current-image" id="admin-gallery-current" hidden>
              <span class="admin-hint">Fotos actuales. Sube nuevas para reemplazarlas todas.</span>
            </div>
            <input class="field__control" id="admin-gallery" type="file" accept="image/*" multiple />
            <p class="admin-hint">Opcional, puedes elegir varias a la vez. Máximo 1 MB cada una.</p>
          </div>

          <h2 class="modal__section-title">Enlaces</h2>

          <div class="admin-form-row">
            <div class="field">
              <label class="field__label" for="admin-repo">Enlace a GitHub</label>
              <input class="field__control" id="admin-repo" type="url" placeholder="https://github.com/…" />
              <p class="admin-hint">El repositorio con el código del proyecto.</p>
              <p class="field__error"></p>
            </div>
            <div class="field">
              <label class="field__label" for="admin-demo">Enlace a demo</label>
              <input class="field__control" id="admin-demo" type="url" placeholder="https://…" />
              <p class="admin-hint">Opcional, si el proyecto tiene una versión en vivo.</p>
              <p class="field__error"></p>
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="admin-case-study">Enlace al caso de estudio</label>
            <input class="field__control" id="admin-case-study" type="url" placeholder="https://…" />
            <p class="admin-hint">Opcional.</p>
            <p class="field__error"></p>
          </div>

          <button class="btn btn--primary btn--block" type="submit" id="project-submit">
            Publicar proyecto
          </button>
        </form>

        <div class="admin-log" id="admin-log" role="status" aria-live="polite"></div>
      </section>
```

- [ ] **Step 2: Añadir el diálogo de confirmación, fuera de `<main>`**

Justo antes de `<script type="module" src="js/admin/main-admin.js"></script>` (que ahora está después de `</main>`), añade:

```html
    <!-- Diálogo de confirmación de borrado. js/admin/projectList.js lo
         controla (mostrar/ocultar, foco, Escape, clic en el fondo). -->
    <div class="confirm-dialog" id="confirm-dialog" aria-hidden="true">
      <div class="confirm-dialog__backdrop" id="confirm-dialog-backdrop"></div>
      <div class="confirm-dialog__card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h2 class="admin-title" id="confirm-dialog-title">Eliminar proyecto</h2>
        <p id="confirm-dialog-message"></p>
        <div class="confirm-dialog__actions">
          <button class="btn btn--ghost" type="button" id="confirm-dialog-cancel">Cancelar</button>
          <button class="btn btn--danger" type="button" id="confirm-dialog-confirm">Eliminar</button>
        </div>
      </div>
    </div>
```

- [ ] **Step 3: Comprobar que el HTML es válido**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && python3 -c "import xml.dom.minidom, re; s=open('admin.html').read(); print('abre/cierra section:', s.count('<section'), s.count('</section>'))"`
Expected: el número de `<section` y `</section>` coincide (debería ser 3: frase de paso, lista, formulario).

- [ ] **Step 4: Guardar el archivo**

---

## Task 6: `js/admin/projectList.js` — pintar la tabla y el diálogo de confirmación

**Files:**
- Create: `js/admin/projectList.js`

**Interfaces:**
- Consumes: `sortProjectsByDate`, `formatProjectObjectSource`, `replaceProjectInSource`, `removeProjectFromSource` de `js/admin/buildProjectEntry.js` (Tasks 1 y 3); `fetchProjectsFile`, `saveProjectsFile` de `js/admin/localAdmin.js` (ya existen, sin cambios); elementos del DOM creados en el Task 5 (`#project-table-body`, `#project-table-empty`, `#confirm-dialog` y sus hijos).
- Produces: `renderProjectList({ tableBody, emptyMessage, projects, onEdit, onDelete, onToggleFeatured })`, `confirmDialog(dialog, message) => Promise<boolean>`, `toggleFeatured(project, passphraseHash) => Promise<void>`, `deleteProject(project, passphraseHash) => Promise<void>`. El Task 7 (`main-admin.js`) importa y usa las cuatro.

No hay pruebas automáticas de node para este archivo (manipula el DOM directamente; el resto de módulos del panel que tocan el DOM, como `main-admin.js`, tampoco las tienen hoy — la verificación es manual, Task 8).

- [ ] **Step 1: Crear el archivo**

```js
/* ============================================================================
   js/admin/projectList.js — Tabla del panel "Gestor de proyectos".
   QUÉ HACE: pinta la tabla de proyectos (ordenados por fecha), conecta los
   clics de editar/eliminar/destacar de cada fila, y controla el diálogo de
   confirmación de borrado.
   QUÉ NO HACE: no valida ni construye el objeto Project (eso es
   buildProjectEntry.js) y no sabe hablar con el servidor local más allá de
   leer/guardar el archivo entero (eso es localAdmin.js). No conoce la
   pantalla de formulario — main-admin.js decide qué hacer con los clics de
   editar (`onEdit`) y con el resto de la navegación.
   ============================================================================ */

import {
  sortProjectsByDate,
  formatProjectObjectSource,
  replaceProjectInSource,
  removeProjectFromSource,
} from './buildProjectEntry.js';
import { fetchProjectsFile, saveProjectsFile } from './localAdmin.js';

const STAR_OUTLINE_PATH =
  'm354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z';
const STAR_FILLED_PATH =
  'm233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z';
const EDIT_PATH =
  'M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z';
const DELETE_PATH =
  'M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z';

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function iconSvg(pathData) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);
  return svg;
}

/**
 * Muestra el diálogo de confirmación y resuelve con true/false según lo que
 * elija la usuaria (botón Eliminar, botón Cancelar, clic en el fondo o
 * tecla Escape).
 * @param {HTMLElement} dialog El nodo raíz #confirm-dialog
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function confirmDialog(dialog, message) {
  const backdrop = dialog.querySelector('.confirm-dialog__backdrop');
  const messageNode = dialog.querySelector('#confirm-dialog-message');
  const cancelButton = dialog.querySelector('#confirm-dialog-cancel');
  const confirmButton = dialog.querySelector('#confirm-dialog-confirm');

  messageNode.textContent = message;

  return new Promise((resolve) => {
    function close(result) {
      dialog.classList.remove('is-open');
      dialog.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKeydown, true);
      backdrop.removeEventListener('click', onCancel);
      cancelButton.removeEventListener('click', onCancel);
      confirmButton.removeEventListener('click', onConfirm);
      resolve(result);
    }
    function onCancel() {
      close(false);
    }
    function onConfirm() {
      close(true);
    }
    function onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }

    backdrop.addEventListener('click', onCancel);
    cancelButton.addEventListener('click', onCancel);
    confirmButton.addEventListener('click', onConfirm);
    document.addEventListener('keydown', onKeydown, true);

    dialog.classList.add('is-open');
    dialog.removeAttribute('aria-hidden');
    confirmButton.focus();
  });
}

/**
 * Pinta la tabla de proyectos (ordenados por fecha) y conecta los botones
 * de cada fila. Sustituye por completo las filas de proyecto anteriores;
 * la fila de "Añadir proyecto" (fija en el HTML) no se toca.
 * @param {object} options
 * @param {HTMLElement} options.tableBody
 * @param {HTMLElement} options.emptyMessage
 * @param {object[]} options.projects
 * @param {(project: object) => void} options.onEdit
 * @param {(project: object) => (Promise<void>|void)} options.onDelete
 * @param {(project: object) => (Promise<void>|void)} options.onToggleFeatured
 */
export function renderProjectList({
  tableBody,
  emptyMessage,
  projects,
  onEdit,
  onDelete,
  onToggleFeatured,
}) {
  [...tableBody.querySelectorAll('.project-table__row')].forEach((row) => row.remove());

  const sorted = sortProjectsByDate(projects);
  emptyMessage.hidden = sorted.length > 0;

  sorted.forEach((project) => {
    const row = el('tr', 'project-table__row');

    const titleCell = el('td', 'project-table__title-cell');
    const starButton = el('button', 'icon-btn icon-btn--star');
    starButton.type = 'button';
    starButton.classList.toggle('is-featured', Boolean(project.featured));
    starButton.setAttribute(
      'aria-label',
      project.featured
        ? `Quitar "${project.title}" de destacados`
        : `Destacar "${project.title}"`
    );
    starButton.appendChild(iconSvg(project.featured ? STAR_FILLED_PATH : STAR_OUTLINE_PATH));
    starButton.addEventListener('click', async () => {
      starButton.disabled = true;
      try {
        await onToggleFeatured(project);
      } finally {
        starButton.disabled = false;
      }
    });
    titleCell.appendChild(starButton);
    titleCell.appendChild(document.createTextNode(project.title));
    row.appendChild(titleCell);

    const actionsCell = el('td', 'project-table__actions-cell');

    const editButton = el('button', 'icon-btn icon-btn--edit');
    editButton.type = 'button';
    editButton.setAttribute('aria-label', `Editar "${project.title}"`);
    editButton.appendChild(iconSvg(EDIT_PATH));
    editButton.addEventListener('click', () => onEdit(project));
    actionsCell.appendChild(editButton);

    const deleteButton = el('button', 'icon-btn icon-btn--delete');
    deleteButton.type = 'button';
    deleteButton.setAttribute('aria-label', `Eliminar "${project.title}"`);
    deleteButton.appendChild(iconSvg(DELETE_PATH));
    deleteButton.addEventListener('click', () => onDelete(project));
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);
    tableBody.appendChild(row);
  });
}

/**
 * Invierte el campo `featured` de un proyecto y guarda el archivo.
 * @param {object} project
 * @param {string} passphraseHash
 */
export async function toggleFeatured(project, passphraseHash) {
  const { content: currentSource } = await fetchProjectsFile();
  const updated = { ...project, featured: !project.featured };
  const objectSource = formatProjectObjectSource(updated);
  const newSource = replaceProjectInSource(currentSource, project.id, objectSource);
  await saveProjectsFile(newSource, passphraseHash);
}

/**
 * Quita un proyecto de js/data/projects.js.
 * @param {object} project
 * @param {string} passphraseHash
 */
export async function deleteProject(project, passphraseHash) {
  const { content: currentSource } = await fetchProjectsFile();
  const newSource = removeProjectFromSource(currentSource, project.id);
  await saveProjectsFile(newSource, passphraseHash);
}
```

- [ ] **Step 2: Comprobar que el archivo es JS válido**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --check js/admin/projectList.js`
Expected: sin salida (sin errores de sintaxis).

- [ ] **Step 3: Guardar el archivo**

---

## Task 7: `js/admin/main-admin.js` — navegación entre pantallas y modo añadir/editar

**Files:**
- Modify: `js/admin/main-admin.js` (reescritura completa)

**Interfaces:**
- Consumes: `checkPassphrase`, `sha256Hex` de `auth.js`; `fetchProjectsFile`, `saveProjectsFile`, `uploadImageFile` de `localAdmin.js`; `slugify`, `extractExistingIds`, `validateProjectForm`, `buildProjectFromForm`, `formatProjectObjectSource`, `insertProjectIntoSource`, `replaceProjectInSource` (Task 1), `projectToFormValues` (Task 2), `mergeEditedProject` (Task 2) de `buildProjectEntry.js`; `renderProjectList`, `confirmDialog`, `toggleFeatured`, `deleteProject` de `projectList.js` (Task 6); elementos del DOM del Task 5.
- Produces: nada que otro módulo consuma — es el punto de entrada (`admin.html` lo carga con `<script type="module">`).

- [ ] **Step 1: Sustituir todo el contenido de `js/admin/main-admin.js`**

```js
/* ============================================================================
   js/admin/main-admin.js — Punto de entrada del panel de administración.
   QUÉ HACE: conecta las tres pantallas (frase de paso, lista de proyectos,
   formulario de añadir/editar) y llama a projectList.js, localAdmin.js y
   buildProjectEntry.js para leer y guardar los proyectos en disco a través
   del servidor local (scripts/admin-server.py).
   QUÉ NO HACE: no valida el formulario ni construye el objeto Project (eso
   es buildProjectEntry.js), no pinta la tabla ni el diálogo de confirmación
   (eso es projectList.js) y no escribe en disco directamente (eso es
   localAdmin.js, que habla con el servidor local). Este archivo solo
   orquesta.
   ============================================================================ */

import { checkPassphrase, sha256Hex } from './auth.js';
import { fetchProjectsFile, saveProjectsFile, uploadImageFile } from './localAdmin.js';
import {
  slugify,
  extractExistingIds,
  validateProjectForm,
  buildProjectFromForm,
  formatProjectObjectSource,
  insertProjectIntoSource,
  replaceProjectInSource,
  projectToFormValues,
  mergeEditedProject,
} from './buildProjectEntry.js';
import { renderProjectList, confirmDialog, toggleFeatured, deleteProject } from './projectList.js';

const $ = (selector) => document.querySelector(selector);
const MAX_IMAGE_BYTES = 1_000_000;

/* Hash de la frase de paso ya verificada en esta sesión. Solo vive en esta
   variable de módulo (memoria de la pestaña) — nunca se guarda en disco ni
   en localStorage/sessionStorage. Se manda en cada petición al servidor
   local para que él también compruebe que quien escribe tiene permiso. */
let passphraseHash = '';

/* null = modo "añadir"; objeto Project = modo "editar" (guarda los datos
   originales, incluidas las rutas de portada/galería, para conservarlas si
   no se sube una imagen nueva). */
let editingProject = null;

/* Si se ha tocado el campo id a mano, dejar de regenerarlo a partir del
   título. En modo edición se marca como "tocado" desde el principio, para
   no reescribir el id existente solo por rellenar el título. */
let idEditedByHand = false;

const screens = {
  gate: $('#gate-passphrase'),
  list: $('#project-list-section'),
  form: $('#project-form-section'),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => {
    node.hidden = key !== name;
  });
}

function log(message) {
  const node = $('#admin-log');
  if (!node) return;
  const line = document.createElement('p');
  line.textContent = message;
  node.appendChild(line);
  node.scrollTop = node.scrollHeight;
}

function clearLog() {
  const node = $('#admin-log');
  if (node) node.replaceChildren();
}

function clearFieldErrors() {
  document.querySelectorAll('#project-form .field').forEach((field) => {
    field.classList.remove('has-error');
    const errorNode = field.querySelector('.field__error');
    if (errorNode) errorNode.textContent = '';
  });
}

function showFieldErrors(errors) {
  clearFieldErrors();
  const idMap = { demo: 'admin-demo', repo: 'admin-repo', caseStudy: 'admin-case-study' };
  for (const [key, message] of Object.entries(errors)) {
    const fieldName = key.startsWith('links.') ? key.split('.')[1] : key;
    const controlId = idMap[fieldName] || `admin-${fieldName}`;
    const control = document.getElementById(controlId);
    const field = control ? control.closest('.field') : null;
    if (field) {
      field.classList.add('has-error');
      const errorNode = field.querySelector('.field__error');
      if (errorNode) errorNode.textContent = message;
    }
  }
}

function readFormValues() {
  return {
    id: $('#admin-id').value,
    title: $('#admin-title').value,
    tagline: $('#admin-tagline').value,
    description: $('#admin-description').value,
    role: $('#admin-role').value,
    year: $('#admin-year').value,
    status: $('#admin-status').value,
    featured: $('#admin-featured').checked,
    tags: $('#admin-tags').value,
    categories: $('#admin-categories').value,
    highlights: $('#admin-highlights').value,
    links: {
      demo: $('#admin-demo').value,
      repo: $('#admin-repo').value,
      caseStudy: $('#admin-case-study').value,
    },
  };
}

function fileExtension(file) {
  const parts = file.name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'webp';
}

function assertFileSize(file, label) {
  if (file && file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `${label} pesa demasiado (${(file.size / 1_000_000).toFixed(1)} MB). Recomprímela por debajo de 1 MB antes de subirla.`
    );
  }
}

/* ---------------------------------------------------------------------
   Lista de proyectos
   --------------------------------------------------------------------- */
async function refreshList() {
  const module = await import(`/js/data/projects.js?t=${Date.now()}`);
  renderProjectList({
    tableBody: $('#project-table-body'),
    emptyMessage: $('#project-table-empty'),
    projects: module.projects,
    onEdit: openEditForm,
    onDelete: handleDelete,
    onToggleFeatured: handleToggleFeatured,
  });
}

async function handleDelete(project) {
  const ok = await confirmDialog(
    $('#confirm-dialog'),
    `¿Seguro que quieres eliminar "${project.title}"? Esta acción no se puede deshacer.`
  );
  if (!ok) return;
  await deleteProject(project, passphraseHash);
  await refreshList();
}

async function handleToggleFeatured(project) {
  await toggleFeatured(project, passphraseHash);
  await refreshList();
}

/* ---------------------------------------------------------------------
   Formulario: modo añadir / modo editar
   --------------------------------------------------------------------- */
function resetFormToAddMode() {
  editingProject = null;
  idEditedByHand = false;
  $('#project-form').reset();
  $('#admin-editing-id').value = '';
  $('#project-form-title').textContent = 'Añadir proyecto';
  const submitButton = $('#project-submit');
  submitButton.textContent = 'Publicar proyecto';
  submitButton.classList.remove('btn--success');
  submitButton.classList.add('btn--primary');
  $('#admin-cover-current').hidden = true;
  const galleryCurrent = $('#admin-gallery-current');
  galleryCurrent.querySelectorAll('img').forEach((img) => img.remove());
  galleryCurrent.hidden = true;
}

function openAddForm() {
  resetFormToAddMode();
  clearLog();
  clearFieldErrors();
  showScreen('form');
  $('#admin-title').focus();
}

function openEditForm(project) {
  editingProject = project;
  idEditedByHand = true;
  clearLog();
  clearFieldErrors();

  const values = projectToFormValues(project);
  $('#admin-editing-id').value = project.id;
  $('#admin-title').value = values.title;
  $('#admin-id').value = values.id;
  $('#admin-tagline').value = values.tagline;
  $('#admin-description').value = values.description;
  $('#admin-role').value = values.role;
  $('#admin-year').value = values.year;
  $('#admin-status').value = values.status;
  $('#admin-featured').checked = values.featured;
  $('#admin-tags').value = values.tags;
  $('#admin-categories').value = values.categories;
  $('#admin-highlights').value = values.highlights;
  $('#admin-demo').value = values.links.demo;
  $('#admin-repo').value = values.links.repo;
  $('#admin-case-study').value = values.links.caseStudy;

  const coverCurrent = $('#admin-cover-current');
  if (project.cover) {
    $('#admin-cover-current-img').src = project.cover;
    coverCurrent.hidden = false;
  } else {
    coverCurrent.hidden = true;
  }

  const galleryCurrent = $('#admin-gallery-current');
  galleryCurrent.querySelectorAll('img').forEach((img) => img.remove());
  if (Array.isArray(project.gallery) && project.gallery.length > 0) {
    project.gallery.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      galleryCurrent.insertBefore(img, galleryCurrent.firstChild);
    });
    galleryCurrent.hidden = false;
  } else {
    galleryCurrent.hidden = true;
  }

  $('#project-form-title').textContent = 'Editar proyecto';
  const submitButton = $('#project-submit');
  submitButton.textContent = 'Guardar cambios';
  submitButton.classList.remove('btn--primary');
  submitButton.classList.add('btn--success');

  showScreen('form');
  $('#admin-title').focus();
}

/* --- Paso 1: frase de paso --------------------------------------------- */
$('#passphrase-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('#passphrase-input');
  const error = $('#passphrase-error');
  const ok = await checkPassphrase(input.value);
  if (!ok) {
    error.textContent = 'Frase de paso incorrecta.';
    input.value = '';
    input.focus();
    return;
  }
  passphraseHash = await sha256Hex(input.value.trim());
  error.textContent = '';
  showScreen('list');
  await refreshList();
});

/* --- Navegación entre la lista y el formulario -------------------------- */
$('#add-project-button').addEventListener('click', openAddForm);
$('#cancel-form-link').addEventListener('click', (event) => {
  event.preventDefault();
  showScreen('list');
});

/* --- Autogenerar el id a partir del título, salvo que se edite a mano --- */
$('#admin-id').addEventListener('input', () => {
  idEditedByHand = true;
});
$('#admin-title').addEventListener('input', (event) => {
  if (idEditedByHand) return;
  $('#admin-id').value = slugify(event.target.value);
});

/* --- Paso 2: publicar (añadir) o guardar cambios (editar) --------------- */
$('#project-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearLog();
  clearFieldErrors();

  const submitButton = $('#project-submit');
  const values = readFormValues();

  if (!passphraseHash) {
    log('No se ha verificado la frase de paso. Recarga la página y vuelve a intentarlo.');
    return;
  }

  submitButton.disabled = true;
  try {
    log('Leyendo proyectos existentes…');
    const { content: currentSource } = await fetchProjectsFile();
    const existingIds = extractExistingIds(currentSource);
    if (editingProject) existingIds.delete(editingProject.id);

    const errors = validateProjectForm(values, existingIds);
    if (Object.keys(errors).length > 0) {
      showFieldErrors(errors);
      log('Revisa los campos marcados en rojo antes de guardar.');
      return;
    }

    const coverFile = $('#admin-cover').files[0] || null;
    const galleryFiles = [...$('#admin-gallery').files];
    assertFileSize(coverFile, 'La imagen de portada');
    galleryFiles.forEach((file, index) =>
      assertFileSize(file, `La imagen de galería nº ${index + 1}`)
    );

    const id = values.id.trim();
    let coverPath = editingProject ? editingProject.cover || '' : '';
    if (coverFile) {
      const filename = `${id}-cover.${fileExtension(coverFile)}`;
      log(`Guardando imagen de portada (assets/img/${filename})…`);
      coverPath = await uploadImageFile(filename, coverFile, passphraseHash);
    }

    let galleryPaths = editingProject ? editingProject.gallery || [] : [];
    if (galleryFiles.length > 0) {
      galleryPaths = [];
      for (let i = 0; i < galleryFiles.length; i += 1) {
        const file = galleryFiles[i];
        const filename = `${id}-${i + 1}.${fileExtension(file)}`;
        log(`Guardando imagen de galería ${i + 1} de ${galleryFiles.length}…`);
        const path = await uploadImageFile(filename, file, passphraseHash);
        galleryPaths.push(path);
      }
    }

    const project = editingProject
      ? mergeEditedProject(editingProject, values, coverPath, galleryPaths)
      : buildProjectFromForm(values, coverPath, galleryPaths);
    const objectSource = formatProjectObjectSource(project);

    let newSource;
    if (editingProject) {
      log('Actualizando js/data/projects.js…');
      newSource = replaceProjectInSource(currentSource, editingProject.id, objectSource);
    } else {
      log('Guardando js/data/projects.js…');
      newSource = insertProjectIntoSource(currentSource, objectSource);
    }
    await saveProjectsFile(newSource, passphraseHash);

    log(editingProject ? '¡Cambios guardados!' : '¡Proyecto guardado!');
    await refreshList();
    showScreen('list');
  } catch (error) {
    log(`Error: ${error.message}`);
  } finally {
    submitButton.disabled = false;
  }
});
```

- [ ] **Step 2: Comprobar que el archivo es JS válido**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --check js/admin/main-admin.js`
Expected: sin salida (sin errores de sintaxis).

- [ ] **Step 3: Guardar el archivo**

---

## Task 8: Verificación manual de extremo a extremo

**Files:** ninguno (solo verificación)

**Interfaces:** ninguna — este task no lo consume nadie, cierra el plan.

- [ ] **Step 1: Arrancar el servidor del panel**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && python3 scripts/admin-server.py`

Si el puerto 4180 ya está ocupado por otro proceso (ha pasado antes en este proyecto — otra aplicación distinta lo usa), para ese otro proceso o usa temporalmente `python3 -m http.server <puerto-libre>` solo para verificar visualmente el HTML/CSS (sin poder guardar cambios, ya que ese servidor no tiene las rutas `/__admin/...`).

- [ ] **Step 2: Entrar con la frase de paso**

Abre `http://localhost:4180/admin.html`, escribe `cuaderno-azul-93`. Debe verse directamente la pantalla "Gestor de proyectos" a pantalla completa (sin recuadro), con los 3 proyectos de ejemplo listados, ordenados por fecha (Ruta Abierta 2026-07-01 primero, Panel de inventario 2026-02-10 al final, AulaViva 2026-05-20 en medio).

- [ ] **Step 3: Añadir un proyecto**

Pulsa "+ Añadir proyecto" (primera fila de la tabla). Rellena título "Proyecto de prueba" y deja el resto por defecto. Pulsa "Publicar proyecto". Debe volver a la lista y verse la nueva fila. Abre `js/data/projects.js` y confirma que el objeto nuevo está justo después de `ANCLA-ADMIN` y que los tres proyectos originales siguen intactos, con sus comentarios `REEMPLAZAR con la fecha real de publicación`.

- [ ] **Step 4: Destacar desde la estrella**

En la fila de "Proyecto de prueba", pulsa la estrella. Debe rellenarse en ámbar al instante, sin recargar la página ni abrir el formulario. Recarga `admin.html` y vuelve a entrar: la estrella debe seguir rellena (el cambio se guardó de verdad en `projects.js`).

- [ ] **Step 5: Editar un proyecto**

Pulsa el lápiz verde de "Proyecto de prueba". Debe abrirse el formulario con el título "Editar proyecto", el botón "Guardar cambios" en verde, y el campo Título ya relleno con "Proyecto de prueba". Cambia el título a "Proyecto editado" y pulsa "Guardar cambios". Debe volver a la lista mostrando "Proyecto editado". Abre `js/data/projects.js` y confirma que el resto de campos de ese proyecto (el `featured: true` de destacado) se conservó.

- [ ] **Step 6: Cancelar sin guardar**

Pulsa el lápiz de cualquier proyecto, cambia el título, y pulsa "Cancelar" en vez de guardar. Debe volver a la lista sin que el cambio se haya guardado (compruébalo recargando y volviendo a entrar).

- [ ] **Step 7: Eliminar con confirmación**

Pulsa la papelera roja de "Proyecto editado". Debe aparecer la tarjeta de confirmación centrada (no el cuadro nativo del navegador) con el texto "¿Seguro que quieres eliminar "Proyecto editado"?". Pulsa "Cancelar": el proyecto debe seguir en la lista. Vuelve a pulsar la papelera y esta vez pulsa "Eliminar": el proyecto debe desaparecer de la lista y de `js/data/projects.js`, dejando los 3 proyectos originales intactos.

- [ ] **Step 8: Comprobar el estado vacío (opcional, destructivo)**

Solo si quieres verlo: elimina también los 3 proyectos originales (puedes deshacerlo después restaurando `js/data/projects.js` desde este mismo repositorio). Con la tabla vacía debe verse el mensaje "Aún no hay proyectos" y el botón "+ Añadir proyecto" seguir arriba del todo, bien visible.

- [ ] **Step 9: Comprobar "Volver a la web"**

Desde la pantalla de "Gestor de proyectos", pulsa "Volver a la web". Debe llevar a `index.html`, la portada del portafolio.

- [ ] **Step 10: Ejecutar toda la batería de pruebas automáticas una última vez**

Run: `cd /Users/luciaescoto/Desktop/web-lucia-escoto && node --test js/admin/*.test.js`
Expected: PASS, todas en verde.
