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

/**
 * Recorre el texto fuente una vez y devuelve el rango [start, end] (índices
 * de carácter, `end` inclusive) de cada bloque `{ ... }` que aparece al
 * nivel más externo de anidamiento de llaves — que es exactamente el nivel
 * en el que viven los objetos de proyecto dentro del array `projects`.
 * Ignora las llaves que aparezcan dentro de literales de cadena (comillas
 * simples, dobles o backticks, respetando el escape) y dentro de
 * comentarios (de línea y de bloque), para que un `{` o `}` que
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

  let start = range.start;
  // Retract start to the beginning of the line (consume leading whitespace)
  while (start > 0 && sourceText[start - 1] !== '\n') {
    start -= 1;
  }

  let end = range.end + 1;
  if (sourceText[end] === ',') end += 1;
  if (sourceText[end] === '\n') end += 1;

  return { start, end };
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
