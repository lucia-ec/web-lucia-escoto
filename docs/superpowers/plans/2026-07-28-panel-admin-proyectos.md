# Panel de administración para añadir proyectos — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un panel (`admin.html`) protegido por una frase de paso y un token personal de GitHub, desde el que Lucía puede rellenar un formulario y publicar un proyecto nuevo directamente en `js/data/projects.js` (y sus imágenes) mediante un commit real a través de la API de GitHub, sin abrir el editor de código.

**Architecture:** Módulos JS puros y testables (`auth.js`, `buildProjectEntry.js`, los helpers de `github.js`) separados de la orquestación con el DOM (`main-admin.js`). El HTML del panel vive aparte de `index.html`, reutiliza los componentes visuales ya existentes (`.btn`, `.field`, `.chip`) y añade solo lo específico de sus pantallas en `css/admin.css`.

**Tech Stack:** JavaScript vanilla (ES modules), Web Crypto API (`crypto.subtle`) para el hash de la frase de paso, `fetch` contra la API REST de GitHub (Contents API), `node --test` + `node:assert/strict` para las pruebas de la lógica pura (sin dependencias nuevas: todo viene incluido en Node).

## Global Constraints

- Cero dependencias externas nuevas de JavaScript. Sin build step. Todo debe seguir funcionando abriendo `admin.html` con un servidor estático simple.
- Todo el texto que se inserta en el DOM se hace con `textContent`, nunca `innerHTML` (mismo criterio que el resto del sitio).
- La frase de paso real **nunca** se escribe en ningún archivo del repositorio — solo su hash SHA-256.
- El token de GitHub **nunca** se escribe en ningún archivo ni se envía a nada que no sea `https://api.github.com` — solo vive en `sessionStorage` del navegador.
- Comentarios de cabecera en cada archivo nuevo, en español, explicando qué hace y qué no hace (mismo estilo que el resto del proyecto).
- `js/data/projects.js` no se reescribe por completo: se le inserta el proyecto nuevo preservando el resto del archivo tal cual.
- Este proyecto **no tiene todavía repositorio git** (`git init` no se ha ejecutado). Los pasos de este plan no incluyen comandos `git commit`; en su lugar, cada tarea termina con "guardar el archivo". El primer commit real ocurrirá cuando Lucía publique el proyecto siguiendo el README.

---

### Task 1: Línea ancla en `projects.js`

**Files:**
- Modify: `js/data/projects.js`

**Interfaces:**
- Produces: el texto literal `ANCLA-ADMIN` en una línea propia, inmediatamente después de `export const projects = [`. Las tareas 4 y 9 dependen de que esta cadena exista tal cual.

- [ ] **Step 1: Añadir el comentario ancla**

Justo después de la línea `export const projects = [`, añade:

```js
export const projects = [
  /* ▲ ANCLA-ADMIN: no borrar esta línea. El panel de administración (admin.html)
     inserta aquí los proyectos nuevos. Si la borras o la editas, el panel dejará
     de saber dónde insertar y mostrará un error explicándolo. */
```

- [ ] **Step 2: Comprobar que el archivo sigue siendo JavaScript válido**

Run: `node --check js/data/projects.js`
Expected: sin salida (significa que no hay errores de sintaxis).

- [ ] **Step 3: Guardar**

---

### Task 2: `js/admin/auth.js` — verificación de la frase de paso

**Files:**
- Create: `js/admin/auth.js`
- Test: `js/admin/auth.test.js`

**Interfaces:**
- Produces: `export async function sha256Hex(text: string): Promise<string>`, `export async function checkPassphrase(input: string): Promise<boolean>`, `export const PASSPHRASE_HASH: string` (placeholder hasta la Tarea 9).
- Consumes: nada (módulo puro, sin dependencias de otros archivos del proyecto).

- [ ] **Step 1: Escribir el test que falla**

Crea `js/admin/auth.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, checkPassphrase } from './auth.js';

test('sha256Hex produces the known SHA-256 test vector for "abc"', async () => {
  const hash = await sha256Hex('abc');
  assert.equal(
    hash,
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
});

test('checkPassphrase rejects an incorrect passphrase', async () => {
  const result = await checkPassphrase('esto-seguro-que-no-es-la-frase-correcta');
  assert.equal(result, false);
});

test('checkPassphrase trims surrounding whitespace before hashing', async () => {
  const hashWithSpaces = await sha256Hex('  abc  '.trim());
  const hashDirect = await sha256Hex('abc');
  assert.equal(hashWithSpaces, hashDirect);
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

Run: `node --test js/admin/auth.test.js`
Expected: FAIL — `Cannot find module './auth.js'`

- [ ] **Step 3: Escribir `js/admin/auth.js`**

```js
/* ============================================================================
   js/admin/auth.js — Verificación de la frase de paso del panel de administración.
   QUÉ HACE: calcula el hash SHA-256 de lo que escribe la usuaria y lo compara
   con el hash guardado en PASSPHRASE_HASH. El texto en claro de la frase de
   paso no aparece en este archivo ni en ningún otro del repositorio.
   QUÉ NO HACE: no es una protección criptográfica robusta por sí sola — no hay
   límite de intentos ni salado, porque no hay servidor que los haga cumplir.
   La protección real es el token personal de GitHub (ver github.js): esta
   frase de paso es solo un filtro contra la ojeada casual.
   ============================================================================ */

// Hash SHA-256 en hexadecimal de la frase de paso real. Se sustituye por el
// valor definitivo en la Tarea 9 del plan de implementación; hasta entonces
// ninguna frase de paso lo verificará correctamente.
export const PASSPHRASE_HASH = 'PENDIENTE-DE-GENERAR';

/**
 * Calcula el hash SHA-256 en hexadecimal de un texto.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Comprueba si el texto introducido coincide con la frase de paso configurada.
 * @param {string} input
 * @returns {Promise<boolean>}
 */
export async function checkPassphrase(input) {
  const hash = await sha256Hex((input || '').trim());
  return hash === PASSPHRASE_HASH;
}
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

Run: `node --test js/admin/auth.test.js`
Expected: PASS (3 pruebas)

- [ ] **Step 5: Guardar**

---

### Task 3: `js/admin/github.js` — cliente mínimo de la API de GitHub

**Files:**
- Create: `js/admin/github.js`
- Test: `js/admin/github.test.js`

**Interfaces:**
- Consumes: nada de otros módulos del proyecto.
- Produces:
  - `export function utf8ToBase64(text: string): string`
  - `export function base64ToUtf8(base64: string): string`
  - `export function base64FromFile(file: File): Promise<string>`
  - `export async function fetchProjectsFile(config, token: string): Promise<{content: string, sha: string}>`
  - `export async function updateProjectsFile(config, token, content, sha, commitMessage): Promise<{commitUrl: string|undefined}>`
  - `export async function uploadImageFile(config, token, path, file): Promise<void>`
  - `config` es `{ owner: string, repo: string, branch: string }` (ver Tarea 5).
  - Estas cuatro últimas lanzan (`throw`) un `Error` con mensaje en español legible si la respuesta de GitHub no es correcta.

- [ ] **Step 1: Escribir el test que falla (solo los helpers puros — las funciones de red se verifican a mano en la Tarea 11, porque necesitan un repositorio de GitHub real)**

Crea `js/admin/github.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { utf8ToBase64, base64ToUtf8 } from './github.js';

test('utf8ToBase64 and base64ToUtf8 round-trip plain ASCII text', () => {
  const original = 'AulaViva';
  assert.equal(base64ToUtf8(utf8ToBase64(original)), original);
});

test('utf8ToBase64 and base64ToUtf8 round-trip Spanish accented text', () => {
  const original = 'Descripción con tildes: áéíóú, ñ y el símbolo €.';
  assert.equal(base64ToUtf8(utf8ToBase64(original)), original);
});

test('utf8ToBase64 produces valid standard base64 output', () => {
  const encoded = utf8ToBase64('abc');
  assert.equal(encoded, 'YWJj');
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

Run: `node --test js/admin/github.test.js`
Expected: FAIL — `Cannot find module './github.js'`

- [ ] **Step 3: Escribir `js/admin/github.js`**

```js
/* ============================================================================
   js/admin/github.js — Cliente mínimo de la API de GitHub (Contents API).
   QUÉ HACE: lee y escribe archivos del repositorio configurado en config.js
   usando fetch y un token personal que se le pasa como parámetro en cada
   llamada — este módulo nunca guarda el token en ningún sitio.
   QUÉ NO HACE: no gestiona el token (eso es cosa de main-admin.js), no valida
   el formulario (buildProjectEntry.js) y no construye la interfaz.
   ============================================================================ */

/**
 * Codifica un texto UTF-8 (puede llevar tildes, ñ, etc.) en base64, tal como
 * lo exige la API de GitHub para el contenido de los archivos.
 * @param {string} text
 * @returns {string}
 */
export function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Decodifica el base64 que devuelve GitHub en un texto UTF-8 legible.
 * @param {string} base64
 * @returns {string}
 */
export function base64ToUtf8(base64) {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Lee un archivo de imagen del disco de la usuaria y lo convierte a base64,
 * listo para subirlo tal cual a la API de GitHub.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function base64FromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

function contentsUrl(config, path) {
  return `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
}

async function githubRequest(token, url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });
}

async function githubError(response, prefix) {
  let detail = '';
  try {
    const body = await response.json();
    detail = body.message || '';
  } catch {
    /* la respuesta no traía JSON legible */
  }
  const hint =
    response.status === 401
      ? 'El token no es válido o ha caducado.'
      : response.status === 403
        ? 'El token no tiene permisos suficientes sobre este repositorio.'
        : '';
  return new Error(`${prefix} (HTTP ${response.status}). ${hint} ${detail}`.trim());
}

/**
 * Descarga js/data/projects.js del repositorio configurado.
 * @param {{owner: string, repo: string, branch: string}} config
 * @param {string} token
 * @returns {Promise<{content: string, sha: string}>}
 */
export async function fetchProjectsFile(config, token) {
  const url = `${contentsUrl(config, 'js/data/projects.js')}?ref=${encodeURIComponent(config.branch)}`;
  const response = await githubRequest(token, url);
  if (response.status === 404) {
    throw new Error(
      'No se encontró js/data/projects.js en el repositorio. Revisa owner, repo y branch en js/admin/config.js.'
    );
  }
  if (!response.ok) {
    throw await githubError(response, 'No se pudo descargar projects.js');
  }
  const data = await response.json();
  return { content: base64ToUtf8(data.content), sha: data.sha };
}

/**
 * Sube la nueva versión de js/data/projects.js como un commit.
 * @param {{owner: string, repo: string, branch: string}} config
 * @param {string} token
 * @param {string} content
 * @param {string} sha
 * @param {string} commitMessage
 * @returns {Promise<{commitUrl: string|undefined}>}
 */
export async function updateProjectsFile(config, token, content, sha, commitMessage) {
  const response = await githubRequest(token, contentsUrl(config, 'js/data/projects.js'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: commitMessage,
      content: utf8ToBase64(content),
      sha,
      branch: config.branch,
    }),
  });
  if (!response.ok) {
    throw await githubError(response, 'No se pudo publicar projects.js');
  }
  const data = await response.json();
  return { commitUrl: data.commit && data.commit.html_url };
}

/**
 * Sube un archivo de imagen a la ruta indicada. Si ya existe un archivo ahí,
 * lo sobrescribe (comprueba primero su sha, como exige la API de GitHub).
 * @param {{owner: string, repo: string, branch: string}} config
 * @param {string} token
 * @param {string} path
 * @param {File} file
 * @returns {Promise<void>}
 */
export async function uploadImageFile(config, token, path, file) {
  const base64Content = await base64FromFile(file);
  const url = contentsUrl(config, path);

  let sha;
  const existing = await githubRequest(token, `${url}?ref=${encodeURIComponent(config.branch)}`);
  if (existing.status === 200) {
    sha = (await existing.json()).sha;
  } else if (existing.status !== 404) {
    throw await githubError(existing, `No se pudo comprobar si ${path} ya existía`);
  }

  const response = await githubRequest(token, url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Sube imagen: ${path}`,
      content: base64Content,
      sha,
      branch: config.branch,
    }),
  });
  if (!response.ok) {
    throw await githubError(response, `No se pudo subir la imagen ${path}`);
  }
}
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

Run: `node --test js/admin/github.test.js`
Expected: PASS (3 pruebas)

- [ ] **Step 5: Guardar**

---

### Task 4: `js/admin/buildProjectEntry.js` — validación y formateo del proyecto

**Files:**
- Create: `js/admin/buildProjectEntry.js`
- Test: `js/admin/buildProjectEntry.test.js`

**Interfaces:**
- Consumes: nada de otros módulos del proyecto (módulo puro).
- Produces:
  - `export function slugify(text: string): string`
  - `export function extractExistingIds(sourceText: string): Set<string>`
  - `export function validateProjectForm(values, existingIds: Set<string>): Record<string, string>` (mapa vacío si no hay errores)
  - `export function buildProjectFromForm(values, coverPath: string, galleryPaths: string[]): object` (con la forma del `Project` de `projects.js`)
  - `export function formatProjectObjectSource(project: object): string`
  - `export function insertProjectIntoSource(sourceText: string, projectObjectSource: string): string` (lanza `Error` si no encuentra `ANCLA-ADMIN`)
- La Tarea 3 (`github.js`) y la Tarea 1 (línea ancla en `projects.js`) son prerrequisitos conceptuales pero no importaciones directas: este módulo no importa nada de ellas.

- [ ] **Step 1: Escribir el test que falla**

Crea `js/admin/buildProjectEntry.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  extractExistingIds,
  validateProjectForm,
  buildProjectFromForm,
  formatProjectObjectSource,
  insertProjectIntoSource,
} from './buildProjectEntry.js';

test('slugify converts a title into a clean kebab-case id', () => {
  assert.equal(slugify('Gestor de Turnos Médicos'), 'gestor-de-turnos-medicos');
});

test('slugify collapses repeated separators and trims dashes at the edges', () => {
  assert.equal(slugify('  ¡Hola,   Mundo!  '), 'hola-mundo');
});

test('validateProjectForm requires id and title', () => {
  const errors = validateProjectForm({ id: '', title: '' }, new Set());
  assert.equal(errors.id, 'El identificador es obligatorio.');
  assert.equal(errors.title, 'El título es obligatorio.');
});

test('validateProjectForm rejects a duplicate id', () => {
  const errors = validateProjectForm(
    { id: 'ya-existe', title: 'Algo' },
    new Set(['ya-existe'])
  );
  assert.equal(errors.id, 'Ya existe un proyecto con este identificador.');
});

test('validateProjectForm accepts a valid, unique id', () => {
  const errors = validateProjectForm(
    { id: 'proyecto-nuevo', title: 'Proyecto nuevo' },
    new Set(['otro-proyecto'])
  );
  assert.equal(errors.id, undefined);
  assert.equal(errors.title, undefined);
});

test('validateProjectForm rejects an id with spaces or uppercase letters', () => {
  const errors = validateProjectForm({ id: 'Proyecto Nuevo', title: 'X' }, new Set());
  assert.match(errors.id, /minúsculas/);
});

test('validateProjectForm rejects a link that is not http(s)', () => {
  const errors = validateProjectForm(
    { id: 'x', title: 'X', links: { repo: 'javascript:alert(1)' } },
    new Set()
  );
  assert.match(errors['links.repo'], /http/);
});

test('validateProjectForm rejects a non-numeric year', () => {
  const errors = validateProjectForm({ id: 'x', title: 'X', year: 'pronto' }, new Set());
  assert.match(errors.year, /año/);
});

test('buildProjectFromForm splits comma and newline separated lists', () => {
  const project = buildProjectFromForm(
    { id: 'p', title: 'P', tags: 'Java, Kotlin\nSQL', highlights: 'Uno\nDos' },
    'assets/img/p-cover.webp',
    []
  );
  assert.deepEqual(project.tags, ['Java', 'Kotlin', 'SQL']);
  assert.deepEqual(project.highlights, ['Uno', 'Dos']);
  assert.equal(project.cover, 'assets/img/p-cover.webp');
});

test('buildProjectFromForm omits year when not provided', () => {
  const project = buildProjectFromForm({ id: 'p', title: 'P' }, '', []);
  assert.equal('year' in project, false);
});

test('extractExistingIds finds ids in both hand-written and generated styles', () => {
  const source = `export const projects = [\n  { id: 'a-mano' },\n  { "id": "generado" },\n];`;
  const ids = extractExistingIds(source);
  assert.ok(ids.has('a-mano'));
  assert.ok(ids.has('generado'));
});

test('insertProjectIntoSource inserts right after the marker line and keeps the rest intact', () => {
  const source = [
    'export const projects = [',
    '  /* ANCLA-ADMIN */',
    '  { id: "viejo" },',
    '];',
  ].join('\n');
  const objectSource = formatProjectObjectSource({ id: 'nuevo', title: 'Nuevo' });
  const result = insertProjectIntoSource(source, objectSource);
  const lines = result.split('\n');
  assert.match(lines[2], /"id": "nuevo"/);
  assert.match(result, /viejo/);
});

test('insertProjectIntoSource throws a clear error if the marker is missing', () => {
  assert.throws(
    () => insertProjectIntoSource('export const projects = [];', 'x'),
    /ANCLA-ADMIN/
  );
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

Run: `node --test js/admin/buildProjectEntry.test.js`
Expected: FAIL — `Cannot find module './buildProjectEntry.js'`

- [ ] **Step 3: Escribir `js/admin/buildProjectEntry.js`**

```js
/* ============================================================================
   js/admin/buildProjectEntry.js — Convierte los datos del formulario del
   panel en un objeto Project válido y en el texto JavaScript que se inserta
   en js/data/projects.js.
   QUÉ HACE: valida los campos, genera un id a partir del título, arma el
   objeto final y lo serializa con el formato correcto para insertarlo justo
   después de la línea ANCLA-ADMIN.
   QUÉ NO HACE: no habla con la red ni con el DOM — es un módulo puro, fácil
   de probar con node --test sin necesidad de navegador.
   ============================================================================ */

const MARKER = 'ANCLA-ADMIN';
const VALID_STATUSES = ['finalizado', 'en curso', 'prototipo'];

/**
 * Convierte un texto libre en un id en formato slug (minúsculas, sin tildes,
 * separado por guiones). Se usa para rellenar el campo id automáticamente
 * a partir del título, aunque la usuaria puede editarlo a mano después.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extrae los ids ya usados en el projects.js actual, tanto si están escritos
 * a mano (comillas simples) como si los generó este mismo panel (comillas
 * dobles, estilo JSON).
 * @param {string} sourceText
 * @returns {Set<string>}
 */
export function extractExistingIds(sourceText) {
  const ids = new Set();
  const patterns = [/id:\s*'([^']*)'/g, /"id":\s*"([^"]*)"/g];
  for (const pattern of patterns) {
    for (const match of sourceText.matchAll(pattern)) {
      if (match[1]) ids.add(match[1]);
    }
  }
  return ids;
}

/**
 * Valida los valores del formulario. Devuelve un objeto vacío si todo es
 * correcto, o un mapa `campo -> mensaje de error` en caso contrario.
 * @param {object} values
 * @param {Set<string>} existingIds
 * @returns {Record<string, string>}
 */
export function validateProjectForm(values, existingIds) {
  const errors = {};
  const id = (values.id || '').trim();
  const title = (values.title || '').trim();

  if (!id) {
    errors.id = 'El identificador es obligatorio.';
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    errors.id = 'Usa solo minúsculas, números y guiones (ej: mi-proyecto).';
  } else if (existingIds && existingIds.has(id)) {
    errors.id = 'Ya existe un proyecto con este identificador.';
  }

  if (!title) {
    errors.title = 'El título es obligatorio.';
  }

  if (values.year && !/^\d{4}$/.test(String(values.year).trim())) {
    errors.year = 'Escribe un año de cuatro cifras, ej: 2026.';
  }

  if (values.status && !VALID_STATUSES.includes(values.status)) {
    errors.status = 'El estado debe ser finalizado, en curso o prototipo.';
  }

  const linkLabels = { demo: 'demo', repo: 'repositorio', caseStudy: 'caso de estudio' };
  for (const [field, label] of Object.entries(linkLabels)) {
    const url = values.links && values.links[field];
    if (url && url.trim() && !/^https?:\/\//.test(url.trim())) {
      errors[`links.${field}`] = `El enlace de ${label} debe empezar por http:// o https://.`;
    }
  }

  return errors;
}

function splitList(text) {
  return (text || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Construye el objeto Project final a partir de los valores del formulario
 * ya validados y de las rutas de imagen ya subidas.
 * @param {object} values
 * @param {string} coverPath
 * @param {string[]} galleryPaths
 * @returns {object}
 */
export function buildProjectFromForm(values, coverPath, galleryPaths) {
  const project = {
    id: values.id.trim(),
    title: values.title.trim(),
    tagline: (values.tagline || '').trim(),
    description: (values.description || '').trim(),
    role: (values.role || '').trim(),
    status: values.status || '',
    featured: Boolean(values.featured),
    tags: splitList(values.tags),
    categories: splitList(values.categories),
    cover: coverPath || '',
    gallery: galleryPaths || [],
    highlights: splitList(values.highlights),
    links: {
      demo: ((values.links && values.links.demo) || '').trim(),
      repo: ((values.links && values.links.repo) || '').trim(),
      caseStudy: ((values.links && values.links.caseStudy) || '').trim(),
    },
  };
  if (values.year && String(values.year).trim()) {
    project.year = Number(values.year);
  }
  return project;
}

/**
 * Serializa el objeto Project como texto JavaScript válido, indentado para
 * insertarse dentro del array `projects`. Usa comillas dobles al estilo
 * JSON (JSON.stringify garantiza el escapado correcto de comillas, tildes y
 * símbolos); es una sintaxis tan válida como las comillas simples que usan
 * las entradas escritas a mano — la única diferencia es cosmética.
 * @param {object} project
 * @returns {string}
 */
export function formatProjectObjectSource(project) {
  const json = JSON.stringify(project, null, 2);
  const indented = json
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n');
  return indented + ',\n';
}

/**
 * Inserta el texto del proyecto nuevo justo después de la línea ANCLA-ADMIN,
 * conservando el resto del archivo tal cual.
 * @param {string} sourceText
 * @param {string} projectObjectSource
 * @returns {string}
 * @throws {Error} si no encuentra la línea ancla.
 */
export function insertProjectIntoSource(sourceText, projectObjectSource) {
  const lines = sourceText.split('\n');
  const markerIndex = lines.findIndex((line) => line.includes(MARKER));
  if (markerIndex === -1) {
    throw new Error(
      `No se encontró la línea ancla (${MARKER}) en projects.js. Puede que se haya borrado o modificado; revisa el archivo a mano.`
    );
  }
  lines.splice(markerIndex + 1, 0, projectObjectSource.replace(/\n$/, ''));
  return lines.join('\n');
}
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

Run: `node --test js/admin/buildProjectEntry.test.js`
Expected: PASS (13 pruebas)

- [ ] **Step 5: Guardar**

---

### Task 5: `js/admin/config.js` — configuración del repositorio

**Files:**
- Create: `js/admin/config.js`

**Interfaces:**
- Produces: `export const githubConfig: { owner: string, repo: string, branch: string }`. Lo consumen `main-admin.js` (Tarea 8) al llamar a las funciones de `github.js`.

- [ ] **Step 1: Escribir `js/admin/config.js`**

```js
/* ============================================================================
   js/admin/config.js — Datos del repositorio de GitHub que usa el panel.
   QUÉ HACE: le dice al panel a qué repositorio y rama publicar los proyectos
   nuevos. No es información secreta (es pública en cuanto el repositorio
   existe en GitHub); por eso puede vivir aquí, a diferencia de la frase de
   paso o el token.
   QUÉ NO HACE: no valida que el repositorio exista — si te equivocas aquí,
   el panel lo detecta al intentar publicar y te lo dice con un error claro.

   CÓMO RELLENARLO
   Sustituye TU-USUARIO-GITHUB y TU-REPOSITORIO por los datos reales en
   cuanto crees el repositorio en GitHub (ver README.md, sección del panel
   de administración).
   ============================================================================ */

export const githubConfig = {
  owner: 'TU-USUARIO-GITHUB',
  repo: 'TU-REPOSITORIO',
  branch: 'main',
};
```

- [ ] **Step 2: Comprobar que el archivo es JavaScript válido**

Run: `node --check js/admin/config.js`
Expected: sin salida

- [ ] **Step 3: Guardar**

---

### Task 6: `css/admin.css` — estilos del panel

**Files:**
- Create: `css/admin.css`

**Interfaces:**
- Consumes: las variables de `tokens.css` y las clases `.btn`, `.field`, `.field__control`, `.field__error`, `.field.has-error`, `.chip` de `components.css` (se cargan aparte en `admin.html`, Tarea 7).
- Produces: las clases `.admin-page`, `.admin-card`, `.admin-card--wide`, `.admin-title`, `.admin-hint`, `.admin-form`, `.admin-form-row`, `.admin-checkbox`, `.admin-log`, que usa `admin.html`.

- [ ] **Step 1: Escribir `css/admin.css`**

```css
/* ============================================================================
   admin.css — Estilos propios del panel de administración (admin.html).
   QUÉ HACE: da forma a las pantallas del panel (frase de paso, token,
   formulario) y a la caja de registro de actividad durante la publicación.
   QUÉ NO HACE: no redefine botones, campos ni chips — esos ya vienen de
   components.css y se reutilizan tal cual para que el panel no desentone
   del resto de la web.
   ============================================================================ */

.admin-page {
  min-height: 100svh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-block: var(--space-2xl);
}

.admin-card {
  width: 100%;
  max-width: 34rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-xl);
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
}

.admin-card--wide {
  max-width: 42rem;
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

@media (min-width: 30em) {
  .admin-form-row {
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 2: Guardar**

---

### Task 7: `admin.html` — marcado del panel

**Files:**
- Create: `admin.html`

**Interfaces:**
- Consumes: `css/reset.css`, `css/tokens.css`, `css/base.css`, `css/layout.css` (solo por `.container`), `css/components.css`, `css/admin.css`; `js/admin/main-admin.js` como módulo de entrada.
- Produces: los ids del DOM que lee `main-admin.js` (Tarea 8): `gate-passphrase`, `passphrase-form`, `passphrase-input`, `passphrase-error`, `gate-token`, `token-form`, `token-input`, `token-error`, `token-forget`, `project-form-section`, `project-form`, `admin-id`, `admin-title`, `admin-tagline`, `admin-description`, `admin-role`, `admin-year`, `admin-status`, `admin-featured`, `admin-tags`, `admin-categories`, `admin-highlights`, `admin-demo`, `admin-repo`, `admin-case-study`, `admin-cover`, `admin-gallery`, `project-submit`, `admin-log`.

- [ ] **Step 1: Escribir `admin.html`**

```html
<!DOCTYPE html>
<html lang="es" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Panel de administración · Lucía Escoto Castro</title>
    <meta name="robots" content="noindex, nofollow" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Instrument+Sans:wght@400..700&display=swap"
    />

    <link rel="stylesheet" href="css/reset.css" />
    <link rel="stylesheet" href="css/tokens.css" />
    <link rel="stylesheet" href="css/base.css" />
    <link rel="stylesheet" href="css/layout.css" />
    <link rel="stylesheet" href="css/components.css" />
    <link rel="stylesheet" href="css/admin.css" />
  </head>

  <body>
    <main class="admin-page">
      <!-- Paso 1: frase de paso. Filtro contra la ojeada casual, no una
           protección criptográfica robusta: ver js/admin/auth.js. -->
      <section class="admin-card" id="gate-passphrase" aria-labelledby="gate-passphrase-title">
        <h1 class="admin-title" id="gate-passphrase-title">Panel de administración</h1>
        <p class="admin-hint">
          Escribe la frase de paso para continuar. Si no la tienes, no es para ti.
        </p>
        <form class="admin-form" id="passphrase-form" novalidate>
          <div class="field">
            <label class="field__label" for="passphrase-input">Frase de paso</label>
            <input
              class="field__control"
              id="passphrase-input"
              name="passphrase"
              type="password"
              autocomplete="off"
              required
            />
            <p class="field__error" id="passphrase-error" aria-live="polite"></p>
          </div>
          <button class="btn btn--primary btn--block" type="submit">Entrar</button>
        </form>
      </section>

      <!-- Paso 2: token personal de GitHub. Esta es la protección real:
           sin un token válido con permisos sobre el repositorio, nada se
           publica, sin importar si alguien pasó el paso anterior. -->
      <section class="admin-card" id="gate-token" hidden aria-labelledby="gate-token-title">
        <h1 class="admin-title" id="gate-token-title">Token de GitHub</h1>
        <p class="admin-hint">
          Pega un token personal de GitHub (grano fino, limitado a este
          repositorio, con permiso "Contents: Read and write"). Solo se
          guarda en la memoria de esta pestaña — desaparece al cerrarla.
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noopener noreferrer"
            >Crear un token nuevo</a
          >.
        </p>
        <form class="admin-form" id="token-form" novalidate>
          <div class="field">
            <label class="field__label" for="token-input">Token</label>
            <input
              class="field__control"
              id="token-input"
              name="token"
              type="password"
              autocomplete="off"
              placeholder="github_pat_…"
              required
            />
            <p class="field__error" id="token-error" aria-live="polite"></p>
          </div>
          <div class="admin-actions">
            <button class="btn btn--primary" type="submit">Guardar token</button>
            <button class="btn btn--ghost" type="button" id="token-forget">Olvidar token</button>
          </div>
        </form>
      </section>

      <!-- Paso 3: formulario del proyecto. -->
      <section
        class="admin-card admin-card--wide"
        id="project-form-section"
        hidden
        aria-labelledby="project-form-title"
      >
        <h1 class="admin-title" id="project-form-title">Añadir proyecto</h1>
        <form class="admin-form" id="project-form" novalidate>
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

          <div class="admin-form-row">
            <div class="field">
              <label class="field__label" for="admin-demo">Enlace a demo</label>
              <input class="field__control" id="admin-demo" type="url" placeholder="https://…" />
              <p class="field__error"></p>
            </div>
            <div class="field">
              <label class="field__label" for="admin-repo">Enlace al repositorio</label>
              <input class="field__control" id="admin-repo" type="url" placeholder="https://…" />
              <p class="field__error"></p>
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="admin-case-study">Enlace al caso de estudio</label>
            <input class="field__control" id="admin-case-study" type="url" placeholder="https://…" />
            <p class="field__error"></p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-cover">Imagen de portada</label>
            <input class="field__control" id="admin-cover" type="file" accept="image/*" />
            <p class="admin-hint">Máximo 1 MB. Se sube junto con el proyecto.</p>
          </div>

          <div class="field">
            <label class="field__label" for="admin-gallery">Imágenes de galería</label>
            <input class="field__control" id="admin-gallery" type="file" accept="image/*" multiple />
            <p class="admin-hint">Opcional. Máximo 1 MB cada una.</p>
          </div>

          <button class="btn btn--primary btn--block" type="submit" id="project-submit">
            Publicar proyecto
          </button>
        </form>

        <div class="admin-log" id="admin-log" role="status" aria-live="polite"></div>
      </section>
    </main>

    <script type="module" src="js/admin/main-admin.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Guardar**

---

### Task 8: `js/admin/main-admin.js` — orquestación del panel

**Files:**
- Create: `js/admin/main-admin.js`

**Interfaces:**
- Consumes: `checkPassphrase` de `auth.js` (Tarea 2); `utf8ToBase64`/`base64ToUtf8` indirectamente vía `fetchProjectsFile`, `updateProjectsFile`, `uploadImageFile` de `github.js` (Tarea 3); `githubConfig` de `config.js` (Tarea 5); `slugify`, `extractExistingIds`, `validateProjectForm`, `buildProjectFromForm`, `formatProjectObjectSource`, `insertProjectIntoSource` de `buildProjectEntry.js` (Tarea 4); los ids del DOM de `admin.html` (Tarea 7).
- Produces: nada que consuman otros módulos — es el punto de entrada.

- [ ] **Step 1: Escribir `js/admin/main-admin.js`**

```js
/* ============================================================================
   js/admin/main-admin.js — Punto de entrada del panel de administración.
   QUÉ HACE: conecta las tres pantallas (frase de paso, token, formulario),
   guarda el token solo en sessionStorage, y llama a github.js y
   buildProjectEntry.js para publicar el proyecto nuevo.
   QUÉ NO HACE: no valida el formulario ni construye el objeto Project (eso
   es buildProjectEntry.js) y no habla con la API de GitHub directamente
   (eso es github.js). Este archivo solo orquesta.
   ============================================================================ */

import { checkPassphrase } from './auth.js';
import { githubConfig } from './config.js';
import { fetchProjectsFile, updateProjectsFile, uploadImageFile } from './github.js';
import {
  slugify,
  extractExistingIds,
  validateProjectForm,
  buildProjectFromForm,
  formatProjectObjectSource,
  insertProjectIntoSource,
} from './buildProjectEntry.js';

const $ = (selector) => document.querySelector(selector);
const TOKEN_STORAGE_KEY = 'admin-github-token';
const MAX_IMAGE_BYTES = 1_000_000;

function getStoredToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function storeToken(token) {
  try {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    /* si sessionStorage no está disponible, el token solo dura en memoria de la variable */
  }
}

function clearToken() {
  try {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* nada que limpiar */
  }
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
  error.textContent = '';
  $('#gate-passphrase').hidden = true;
  $('#gate-token').hidden = false;

  const existingToken = getStoredToken();
  if (existingToken) {
    $('#token-input').value = existingToken;
    unlockForm();
  } else {
    $('#token-input').focus();
  }
});

/* --- Paso 2: token de GitHub -------------------------------------------- */
function unlockForm() {
  $('#gate-token').hidden = true;
  $('#project-form-section').hidden = false;
  $('#admin-title').focus();
}

$('#token-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const token = $('#token-input').value.trim();
  if (!token) {
    $('#token-error').textContent = 'Pega tu token de GitHub para continuar.';
    return;
  }
  $('#token-error').textContent = '';
  storeToken(token);
  unlockForm();
});

$('#token-forget').addEventListener('click', () => {
  clearToken();
  $('#token-input').value = '';
  $('#project-form-section').hidden = true;
  $('#gate-token').hidden = false;
  $('#token-input').focus();
});

/* --- Autogenerar el id a partir del título, salvo que se edite a mano --- */
let idEditedByHand = false;
$('#admin-id').addEventListener('input', () => {
  idEditedByHand = true;
});
$('#admin-title').addEventListener('input', (event) => {
  if (idEditedByHand) return;
  $('#admin-id').value = slugify(event.target.value);
});

/* --- Paso 3: publicar el proyecto --------------------------------------- */
$('#project-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearLog();
  clearFieldErrors();

  const submitButton = $('#project-submit');
  const values = readFormValues();
  const token = getStoredToken();

  if (!token) {
    log('No hay ningún token guardado. Vuelve al paso anterior y pégalo de nuevo.');
    return;
  }

  submitButton.disabled = true;
  try {
    log('Comprobando proyectos existentes…');
    const { content: currentSource, sha } = await fetchProjectsFile(githubConfig, token);
    const existingIds = extractExistingIds(currentSource);

    const errors = validateProjectForm(values, existingIds);
    if (Object.keys(errors).length > 0) {
      showFieldErrors(errors);
      log('Revisa los campos marcados en rojo antes de publicar.');
      return;
    }

    const coverFile = $('#admin-cover').files[0] || null;
    const galleryFiles = [...$('#admin-gallery').files];
    assertFileSize(coverFile, 'La imagen de portada');
    galleryFiles.forEach((file, index) =>
      assertFileSize(file, `La imagen de galería nº ${index + 1}`)
    );

    const id = values.id.trim();
    let coverPath = '';
    if (coverFile) {
      coverPath = `assets/img/${id}-cover.${fileExtension(coverFile)}`;
      log(`Subiendo imagen de portada (${coverPath})…`);
      await uploadImageFile(githubConfig, token, coverPath, coverFile);
    }

    const galleryPaths = [];
    for (let i = 0; i < galleryFiles.length; i += 1) {
      const file = galleryFiles[i];
      const path = `assets/img/${id}-${i + 1}.${fileExtension(file)}`;
      log(`Subiendo imagen de galería ${i + 1} de ${galleryFiles.length}…`);
      await uploadImageFile(githubConfig, token, path, file);
      galleryPaths.push(path);
    }

    const project = buildProjectFromForm(values, coverPath, galleryPaths);
    const objectSource = formatProjectObjectSource(project);
    const newSource = insertProjectIntoSource(currentSource, objectSource);

    log('Publicando projects.js…');
    const { commitUrl } = await updateProjectsFile(
      githubConfig,
      token,
      newSource,
      sha,
      `Añade proyecto: ${project.title}`
    );

    log('¡Proyecto publicado! La web tardará 1-2 minutos en actualizarse.');
    if (commitUrl) {
      const wrapper = document.createElement('p');
      const link = document.createElement('a');
      link.href = commitUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Ver el commit en GitHub';
      wrapper.appendChild(link);
      $('#admin-log').appendChild(wrapper);
    }
    $('#project-form').reset();
    idEditedByHand = false;
  } catch (error) {
    log(`Error: ${error.message}`);
  } finally {
    submitButton.disabled = false;
  }
});
```

- [ ] **Step 2: Comprobar que el archivo es JavaScript válido**

Run: `node --check js/admin/main-admin.js`
Expected: sin salida

- [ ] **Step 3: Guardar**

---

### Task 9: Generar la frase de paso real

**Files:**
- Modify: `js/admin/auth.js`

**Interfaces:**
- Produces: `PASSPHRASE_HASH` con el hash real (sustituye `'PENDIENTE-DE-GENERAR'`).

- [ ] **Step 1: Generar una frase de paso aleatoria y fuerte**

Run:
```bash
openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20; echo
```
Expected: una cadena de 20 caracteres alfanuméricos (ej. `Qm3vXpL9tRk2WsN7yBc4`). Guárdala en un gestor de contraseñas — no hace falta memorizarla.

- [ ] **Step 2: Calcular su hash SHA-256**

Run (sustituye `LA-FRASE-GENERADA` por el valor exacto del paso anterior):
```bash
printf '%s' 'LA-FRASE-GENERADA' | shasum -a 256 | awk '{print $1}'
```
Expected: 64 caracteres hexadecimales.

- [ ] **Step 3: Sustituir el hash en `js/admin/auth.js`**

Reemplaza:
```js
export const PASSPHRASE_HASH = 'PENDIENTE-DE-GENERAR';
```
por:
```js
export const PASSPHRASE_HASH = 'EL-HASH-CALCULADO-EN-EL-PASO-2';
```

- [ ] **Step 4: Comprobar que las pruebas de auth.js siguen pasando**

Run: `node --test js/admin/auth.test.js`
Expected: PASS (3 pruebas) — estas pruebas no dependen del valor real de `PASSPHRASE_HASH`, así que deben seguir pasando sin cambios.

- [ ] **Step 5: Guardar**

**Nota para quien ejecute esta tarea:** la frase de paso en claro se entrega directamente a Lucía fuera de este documento (por chat), nunca se escribe en ningún archivo del repositorio ni en este plan.

---

### Task 10: Documentar el panel en el README

**Files:**
- Modify: `README.md`

**Interfaces:** ninguna (solo documentación).

- [ ] **Step 1: Añadir una sección nueva al README, después de la sección "7. Publicar"**

```markdown
## 8. Panel de administración (añadir proyectos sin editar código)

En `admin.html` hay un panel para añadir proyectos desde un formulario, que
publica el cambio directamente en GitHub. Solo funciona una vez la web esté
publicada en GitHub, porque habla con la API de GitHub para hacer el commit.

### Configúralo una vez

1. En `js/admin/config.js`, cambia `owner` y `repo` por tu usuario y el
   nombre real de tu repositorio de GitHub.
2. Guarda la frase de paso que te dieron al construir este panel — la vas a
   necesitar cada vez que lo uses. Si la pierdes, pide que se genere una
   nueva (implica cambiar un valor en `js/admin/auth.js`).

### Cada vez que lo uses

1. Abre `tu-sitio.com/admin.html` y escribe la frase de paso.
2. Pega un token personal de GitHub. Créalo en
   <https://github.com/settings/personal-access-tokens/new> con estas
   opciones:
   - **Repository access**: *Only select repositories* → elige solo este
     repositorio.
   - **Permissions → Repository permissions → Contents**: *Read and write*.
   - **Expiration**: pon una fecha (por ejemplo 90 días) en vez de "sin
     caducidad" — si el token se filtrara alguna vez, dejaría de servir
     automáticamente.

   El token no se guarda en ningún archivo: vive solo en la memoria de esa
   pestaña del navegador mientras la tengas abierta.
3. Rellena el formulario y pulsa "Publicar proyecto". La web tarda 1-2
   minutos en reconstruirse después.

### Qué tan seguro es esto, en realidad

- La frase de paso es un filtro contra quien mire por encima del hombro, no
  una caja fuerte: su hash está en el código público, y alguien con
  conocimientos técnicos podría intentar romperlo sin conexión. No la
  reutilices en ningún otro sitio.
- La protección de verdad es el token: sin uno válido y con permisos sobre
  tu repositorio, nadie puede publicar nada, aunque conozca la frase de
  paso. Trátalo como una contraseña — no lo compartas ni lo pegues en
  ningún otro sitio.
- El panel solo **añade** proyectos. Para editar o borrar uno ya existente,
  sigue editando `js/data/projects.js` a mano, como antes.
```

- [ ] **Step 2: Guardar**

---

### Task 11: Verificación manual en el navegador

**Files:** ninguno (solo verificación).

- [x] **Step 1: Ejecutar toda la batería de pruebas de Node**

Run: `node --test js/admin/*.test.js` (nota: `node --test js/admin` a secas falla,
Node interpreta el directorio como módulo en vez de buscar los `*.test.js` dentro)
Expected: PASS — 19 pruebas entre `auth.test.js`, `github.test.js` y `buildProjectEntry.test.js`. ✅ Confirmado.

- [ ] **Step 2: Servir el sitio localmente**

Run: `python3 -m http.server 5173` (desde la carpeta del proyecto)

- [ ] **Step 3: Verificar la pantalla de frase de paso**

Abre `http://localhost:5173/admin.html`. Comprueba:
- Con una frase de paso incorrecta, aparece el mensaje de error y el campo se vacía.
- Con la frase de paso real (la del paso 1 de la Tarea 9), se pasa a la pantalla del token.

- [ ] **Step 4: Verificar la validación del formulario**

Con un token cualquiera (no hace falta que sea válido todavía), entra al formulario y comprueba que:
- Dejar "Título" vacío y publicar muestra el error correspondiente y no llega a llamar a la red antes de fallar la validación del token (o falla claramente por token inválido, no en silencio).
- El campo "Identificador" se autorrellena al escribir en "Título", y deja de autorrellenarse en cuanto lo editas a mano.

- [ ] **Step 5: Verificar el flujo real contra un repositorio de GitHub**

Esto requiere que Lucía tenga ya un repositorio real en GitHub con este proyecto subido, y `js/admin/config.js` apuntando a él. Guía en el momento:
1. Genera un token siguiendo el README (Tarea 10).
2. Rellena el formulario con un proyecto de prueba real.
3. Publica y comprueba en GitHub que aparece el commit, que `js/data/projects.js` tiene el proyecto nuevo insertado después de la línea `ANCLA-ADMIN`, y que las imágenes están en `assets/img/`.
4. Espera a que GitHub Pages reconstruya y comprueba que el proyecto aparece en la web pública.

---

## Self-Review

**Cobertura del spec:** modelo de seguridad de dos capas → Tareas 2, 9, 10; arquitectura y archivos → Tareas 1-8; flujo de publicación (validar → subir imágenes → insertar → commit) → Tarea 8; manejo de errores específicos → `github.js` (Tarea 3) y `main-admin.js` (Tarea 8); fuera de alcance (solo añadir, sin límite de intentos) → respetado, no se implementó nada de eso; pruebas → Tareas 2-4 (automatizadas) y 11 (manuales).

**Placeholders:** el único valor pendiente de rellenar a propósito es `PASSPHRASE_HASH` en la Tarea 2, resuelto de forma determinista en la Tarea 9 con comandos exactos — no es una instrucción vaga dejada al criterio de quien ejecute el plan.

**Consistencia de tipos:** los nombres de función (`checkPassphrase`, `fetchProjectsFile`, `updateProjectsFile`, `uploadImageFile`, `validateProjectForm`, `buildProjectFromForm`, `formatProjectObjectSource`, `insertProjectIntoSource`, `extractExistingIds`, `slugify`) se usan exactamente igual en su tarea de origen y en `main-admin.js` (Tarea 8).
