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
