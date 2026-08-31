/* ============================================================================
   js/modules/renderProjects.js — Construye las tarjetas del portafolio.
   QUÉ HACE: transforma un array de proyectos en nodos del DOM, tolerando
   campos vacíos o ausentes, y los pinta en la rejilla. Muestra el estado vacío
   cuando no hay resultados.
   QUÉ NO HACE: no filtra (filters.js), no abre el detalle (modal.js) y no
   anima la aparición (scrollReveal.js). Solo avisa por callback de qué
   proyecto se ha pulsado.

   SEGURIDAD: todo el texto se inserta con textContent, nunca con innerHTML.
   Aunque los datos los escribas tú, esto elimina de raíz cualquier XSS si
   algún día el contenido viniera de fuera.
   ============================================================================ */

import { categoryLabels } from '../data/projects.js?v=64';

/* Iconos SVG en línea, sin librerías. Se clonan al vuelo. */
const ICON_ARROW =
  'M7 17L17 7M17 7H8M17 7v9';

/**
 * Crea un elemento con clase y texto opcionales.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * Crea un SVG inline a partir del atributo `d` de un path.
 * @param {string} d
 * @returns {SVGElement}
 */
function icon(d) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);
  return svg;
}

/**
 * Devuelve true si el valor es una cadena con contenido real.
 * @param {unknown} value
 */
function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Devuelve un array limpio: sin valores vacíos y sin duplicados.
 * @param {unknown} value
 * @returns {string[]}
 */
export function cleanList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter((item) => {
    if (!hasText(item)) return false;
    const key = item.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Etiqueta legible de una categoría. Si no está registrada, se capitaliza.
 * @param {string} value
 */
export function labelForCategory(value) {
  if (categoryLabels[value]) return categoryLabels[value];
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Convierte el estado en un sufijo de clase válido ("en curso" → "en-curso").
 * @param {string} status
 */
function statusModifier(status) {
  return status.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Construye la tarjeta de un proyecto.
 * @param {import('../data/projects.js').Project} project
 * @param {(project: object) => void} onOpen Se llama al activar la tarjeta.
 * @returns {HTMLElement}
 */
export function createProjectCard(project, onOpen) {
  const card = el('article', 'card');
  card.dataset.projectId = project.id;
  card.setAttribute('data-reveal', '');

  if (project.featured === true) {
    card.classList.add('card--featured');
  }

  /* --- Media: solo si hay portada ------------------------------------- */
  if (hasText(project.cover)) {
    const media = el('div', 'card__media');

    const img = el('img', 'card__img');
    img.src = project.cover;
    /* El alt describe la captura, no repite el título como decoración */
    img.alt = `Captura del proyecto ${project.title}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 1200;
    img.height = 750;
    media.appendChild(img);

    if (typeof project.year === 'number') {
      media.appendChild(el('span', 'card__year', String(project.year)));
    }

    const overlay = el('div', 'card__overlay');
    const cta = el('span', 'card__overlay-cta', 'Ver detalle');
    cta.appendChild(icon(ICON_ARROW));
    overlay.appendChild(cta);
    media.appendChild(overlay);

    card.appendChild(media);
  }

  /* --- Cuerpo ---------------------------------------------------------- */
  const body = el('div', 'card__body');

  /* Metadatos: estado y categorías */
  const meta = el('div', 'card__meta');
  if (hasText(project.status)) {
    const status = el('span', `status status--${statusModifier(project.status)}`);
    status.appendChild(el('span', 'status__dot'));
    status.appendChild(el('span', null, project.status));
    meta.appendChild(status);
  }
  const categories = cleanList(project.categories);
  if (categories.length > 0) {
    meta.appendChild(
      el('span', 'status', categories.map(labelForCategory).join(' · '))
    );
  }
  if (meta.childElementCount > 0) body.appendChild(meta);

  /* Título: es el disparador del modal. Un único elemento enfocable. */
  const title = el('h3', 'card__title');
  const trigger = el('button', 'card__trigger', project.title);
  trigger.type = 'button';
  trigger.setAttribute(
    'aria-label',
    `Ver el detalle del proyecto ${project.title}`
  );
  trigger.addEventListener('click', () => onOpen(project));
  title.appendChild(trigger);
  body.appendChild(title);

  if (hasText(project.tagline)) {
    body.appendChild(el('p', 'card__tagline', project.tagline));
  }

  /* Tecnologías */
  const tags = cleanList(project.tags);
  if (tags.length > 0) {
    const list = el('ul', 'chip-list');
    list.setAttribute('role', 'list');
    list.setAttribute('aria-label', 'Tecnologías utilizadas');
    tags.forEach((tag) => {
      const item = document.createElement('li');
      item.appendChild(el('span', 'chip', tag));
      list.appendChild(item);
    });
    const footer = el('div', 'card__footer');
    footer.appendChild(list);
    body.appendChild(footer);
  }

  card.appendChild(body);
  return card;
}

/**
 * Pinta la lista de proyectos en la rejilla.
 * @param {object} options
 * @param {import('../data/projects.js').Project[]} options.projects
 * @param {HTMLElement} options.grid Contenedor de la rejilla.
 * @param {HTMLElement} options.emptyState Nodo del estado vacío.
 * @param {(project: object) => void} options.onOpen
 */
export function renderProjects({ projects, grid, emptyState, onOpen }) {
  if (!grid) return;

  grid.replaceChildren();

  /* Se descartan las entradas sin id o sin título: son datos inservibles */
  const valid = (Array.isArray(projects) ? projects : []).filter(
    (project) => project && hasText(project.id) && hasText(project.title)
  );

  if (valid.length === 0) {
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  const fragment = document.createDocumentFragment();
  valid.forEach((project) => {
    fragment.appendChild(createProjectCard(project, onOpen));
  });
  grid.appendChild(fragment);
}
