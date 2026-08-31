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
