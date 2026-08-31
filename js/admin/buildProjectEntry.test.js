import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  extractExistingIds,
  validateProjectForm,
  buildProjectFromForm,
  formatProjectObjectSource,
  insertProjectIntoSource,
  findProjectRange,
  replaceProjectInSource,
  removeProjectFromSource,
  projectToFormValues,
  mergeEditedProject,
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
  const markerIndex = result.indexOf('ANCLA-ADMIN');
  const nuevoIndex = result.indexOf('"id": "nuevo"');
  const viejoIndex = result.indexOf('"viejo"');
  assert.ok(nuevoIndex > markerIndex, 'el proyecto nuevo debe ir después del ancla');
  assert.ok(viejoIndex > nuevoIndex, 'el proyecto anterior debe seguir presente, después del nuevo');
});

test('insertProjectIntoSource throws a clear error if the marker is missing', () => {
  assert.throws(
    () => insertProjectIntoSource('export const projects = [];', 'x'),
    /ANCLA-ADMIN/
  );
});

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

test('removeProjectFromSource mantiene indentación correcta al quitar el primer proyecto', () => {
  const result = removeProjectFromSource(RANGE_FIXTURE, 'proyecto-uno');
  // After removing proyecto-uno, proyecto-dos should still have 2-space indentation
  assert.match(result, /^  \{[\s\S]*id: 'proyecto-dos'/m);
  // Verify no 4-space indentation from double whitespace
  assert.doesNotMatch(result, /^    \{[\s\S]*id: 'proyecto-dos'/m);
});

test('removeProjectFromSource mantiene indentación correcta al quitar el proyecto del medio', () => {
  const result = removeProjectFromSource(RANGE_FIXTURE, 'proyecto-dos');
  // After removing proyecto-dos, proyecto-tres should still have 2-space indentation
  assert.match(result, /^  \{[\s\S]*id: 'proyecto-tres'/m);
  // Verify no 4-space indentation from double whitespace
  assert.doesNotMatch(result, /^    \{[\s\S]*id: 'proyecto-tres'/m);
});

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
