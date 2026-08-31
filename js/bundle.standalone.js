window.__M = window.__M || {};

/* js/data/projects.js */
(function(){
/* ============================================================================
   js/data/projects.js — EL ÚNICO ARCHIVO QUE TIENES QUE EDITAR PARA AÑADIR
   UN PROYECTO NUEVO.
   QUÉ HACE: exporta el array `projects`. Cada objeto del array se convierte
   automáticamente en una tarjeta del portafolio, alimenta los filtros y
   rellena el modal de detalle.
   QUÉ NO HACE: no contiene lógica de renderizado ni HTML. Solo datos.

   CÓMO AÑADIR UN PROYECTO
   1. Copia uno de los objetos de ejemplo y pégalo al principio del array
      (el orden del array es el orden en que se muestran).
   2. Cambia los valores. `id` tiene que ser único.
   3. Guarda. Ya está: no hay que tocar el HTML ni el CSS.

   TODOS LOS CAMPOS SON OPCIONALES SALVO `id` Y `title`.
   Si dejas un campo vacío ("" o [] o lo borras), esa parte simplemente no se
   dibuja. La web no se rompe ni deja huecos raros.
   ============================================================================ */

/**
 * @typedef {Object} ProjectLinks
 * @property {string} [demo]      URL de la demo en vivo. Vacío = no se muestra.
 * @property {string} [repo]      URL del repositorio. Vacío = no se muestra.
 * @property {string} [caseStudy] URL del caso de estudio. Vacío = no se muestra.
 */

/**
 * @typedef {Object} Project
 * @property {string}   id          Identificador único en formato slug. Obligatorio.
 * @property {string}   title       Nombre del proyecto. Obligatorio.
 * @property {string}   [tagline]   Una línea que resume qué resuelve.
 * @property {string}   [description] Párrafo largo para el modal de detalle.
 * @property {string}   [role]      Tu papel en el proyecto.
 * @property {number}   [year]      Año de referencia.
 * @property {string}   [date]      Fecha en formato "AAAA-MM-DD". Alimenta el
 *                                  gráfico de publicaciones por mes del panel
 *                                  del portafolio; sin fecha, ese mes no cuenta.
 * @property {'finalizado'|'en curso'|'prototipo'} [status] Estado del proyecto.
 * @property {boolean}  [featured]  true = tarjeta grande a doble ancho.
 * @property {string[]} [tags]      Tecnologías. Generan los filtros de tecnología.
 * @property {string[]} [categories] Categorías. Generan los filtros de categoría.
 * @property {string}   [cover]     Ruta de la imagen de portada.
 * @property {string[]} [gallery]   Rutas de imágenes adicionales para el modal.
 * @property {string[]} [highlights] Logros o retos técnicos concretos.
 * @property {ProjectLinks} [links] Enlaces del proyecto.
 */

/**
 * Listado de proyectos del portafolio.
 * @type {Project[]}
 */
const projects = [
  /* ▲ ANCLA-ADMIN: no borrar esta línea. Aquí inserta el panel los proyectos nuevos. */
  {
    id: 'gestor-aulas-ies',
    title: 'AulaViva',
    tagline:
      'Reserva de aulas y equipos de un centro educativo, sin hojas de cálculo.',
    description:
      'AulaViva nació de un problema real del instituto: la reserva de aulas de informática y carros de portátiles se llevaba en una hoja de cálculo compartida que se pisaba constantemente. La aplicación de escritorio centraliza el calendario de reservas, valida los solapamientos en el momento de guardar y deja registro de quién reservó qué. El profesorado consulta la disponibilidad por franja horaria y confirma en dos clics; el equipo directivo obtiene un informe mensual de uso por departamento. La capa de acceso a datos usa sentencias preparadas y el esquema impone la integridad con claves foráneas y una restricción de exclusión temporal, de modo que dos reservas nunca pueden ocupar la misma aula en la misma franja.',
    role: 'Desarrollo completo: análisis, base de datos e interfaz',
    year: 2026,
    /* REEMPLAZAR con la fecha real de publicación */
    date: '2026-05-20',
    status: 'finalizado',
    featured: true,
    tags: ['Java', 'JavaFX', 'MySQL', 'JDBC', 'Scene Builder'],
    categories: ['escritorio'],
    cover: (window.__resources && window.__resources.p1) || 'assets/img/proyecto-1.png',
    gallery: [(window.__resources && window.__resources.p1a) || 'assets/img/proyecto-1-a.png', (window.__resources && window.__resources.p1b) || 'assets/img/proyecto-1-b.png'],
    highlights: [
      'Detección de solapamientos resuelta en la base de datos, no en la interfaz: el conflicto es imposible aunque haya dos usuarios guardando a la vez.',
      'Consultas parametrizadas con JDBC en toda la capa de datos, sin concatenación de cadenas.',
      'Informe mensual de ocupación exportable a CSV para el equipo directivo.',
    ],
    links: {
      demo: '',
      repo: 'https://github.com/USUARIO-GITHUB/aulaviva',
      caseStudy: '',
    },
  },
  {
    id: 'inventario-nebrimatica',
    title: 'Panel de inventario',
    tagline:
      'Intranet para dar de alta, buscar y auditar el material de una empresa.',
    description:
      'Proyecto desarrollado durante las prácticas en Nebrimática. Sustituye el control manual del material por una intranet donde cada equipo tiene ficha, historial de asignaciones y estado. La búsqueda filtra por sede, tipo de equipo y estado sin recargar la página, y el listado se pagina en servidor para que la tabla siga siendo rápida con miles de registros. Toda la entrada de usuario se valida en el servidor antes de tocar la base de datos y se escapa al imprimirla en la plantilla. Trabajé con el equipo en las revisiones de código y documenté el despliegue para que otra persona pudiera levantar el entorno desde cero.',
    role: 'Desarrollo front-end e integración con la API interna',
    year: 2026,
    /* REEMPLAZAR con la fecha real de publicación */
    date: '2026-02-10',
    status: 'finalizado',
    featured: false,
    tags: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
    categories: ['web', 'api'],
    cover: (window.__resources && window.__resources.p2) || 'assets/img/proyecto-2.png',
    gallery: [(window.__resources && window.__resources.p2a) || 'assets/img/proyecto-2-a.png'],
    highlights: [
      'Filtrado en cliente con paginación en servidor: la tabla responde igual con 50 registros que con 5.000.',
      'Validación y escapado en servidor de todos los campos del formulario de alta.',
      'Documentación de despliegue escrita para que el entorno se levante sin ayuda.',
    ],
    links: {
      demo: '',
      repo: '',
      caseStudy: '',
    },
  },
  {
    id: 'rutas-accesibles',
    title: 'Ruta Abierta',
    tagline:
      'App móvil que marca qué tramos de una ciudad son accesibles en silla de ruedas.',
    description:
      'Prototipo funcional de una aplicación Android que permite a cualquier persona señalar barreras arquitectónicas —un bordillo sin rebaje, una obra, un ascensor averiado— y consultar las que otras personas han marcado antes. Los datos se guardan en local con Room para que la app siga siendo útil sin cobertura y se sincronizan cuando vuelve la conexión. Ahora mismo está en desarrollo: el registro de incidencias y el mapa funcionan, y el siguiente paso es la validación comunitaria de los avisos para que no se acumulen marcas obsoletas.',
    role: 'Desarrollo Android y diseño de la interfaz',
    year: 2026,
    /* REEMPLAZAR con la fecha real de publicación */
    date: '2026-07-01',
    status: 'en curso',
    featured: false,
    tags: ['Kotlin', 'Android', 'Room', 'Retrofit'],
    categories: ['movil'],
    cover: (window.__resources && window.__resources.p3) || 'assets/img/proyecto-3.png',
    gallery: [],
    highlights: [
      'Funciona sin conexión: Room como fuente de verdad local y sincronización diferida.',
      'Interfaz pensada desde la accesibilidad, con áreas táctiles grandes y contraste alto.',
    ],
    links: {
      demo: '',
      repo: 'https://github.com/USUARIO-GITHUB/ruta-abierta',
      caseStudy: '',
    },
  },
];

/**
 * Etiquetas legibles para las categorías. Si añades una categoría nueva y no
 * la registras aquí, se muestra capitalizada automáticamente: nada se rompe.
 * @type {Record<string, string>}
 */
const categoryLabels = {
  web: 'Web',
  movil: 'Móvil',
  api: 'API',
  escritorio: 'Escritorio',
};

Object.assign(window.__M, { projects, categoryLabels });
})();
Object.assign(window, window.__M);

/* js/modules/renderProjects.js */
(function(){
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
function cleanList(value) {
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
function labelForCategory(value) {
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
function createProjectCard(project, onOpen) {
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
function renderProjects({ projects, grid, emptyState, onOpen }) {
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

Object.assign(window.__M, { cleanList, labelForCategory, createProjectCard, renderProjects });
})();
Object.assign(window, window.__M);

/* js/modules/filters.js */
(function(){
/* ============================================================================
   js/modules/filters.js — Filtros del portafolio.
   QUÉ HACE: deriva los filtros de categoría y de tecnología directamente de
   los datos de los proyectos (si añades un proyecto con una tecnología nueva,
   el filtro aparece solo), gestiona el estado activo —de selección
   múltiple: se pueden marcar varios a la vez dentro de un mismo grupo— y
   avisa por callback con la lista ya filtrada.
   QUÉ NO HACE: no pinta tarjetas (renderProjects.js) ni sabe cómo se ve una.
   ============================================================================ */


/**
 * Crea un elemento con clase y texto opcionales.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * Cuenta cuántas veces aparece cada valor en una propiedad de tipo array.
 * @param {object[]} projects
 * @param {'categories'|'tags'} key
 * @returns {Map<string, number>}
 */
function countValues(projects, key) {
  const counts = new Map();
  projects.forEach((project) => {
    cleanList(project[key]).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });
  return counts;
}

/**
 * Construye una fila de filtro con casilla real: la casilla es la que marca
 * la selección (varias a la vez), la fila entera es su <label> para que se
 * pueda marcar tocando también el texto.
 * @param {object} options
 * @param {string} options.value  Valor del filtro.
 * @param {string} options.label  Texto visible.
 * @param {number} options.count  Nº de proyectos que coinciden.
 * @param {boolean} options.checked Estado inicial.
 * @param {(value: string, checked: boolean) => void} options.onToggle
 */
function createFilterCheckbox({ value, label, count, checked, onToggle }) {
  const item = el('label', 'filter-item');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'filter-item__checkbox';
  checkbox.value = value;
  checkbox.checked = checked;
  checkbox.addEventListener('change', () => onToggle(value, checkbox.checked));
  item.appendChild(checkbox);
  item.appendChild(el('span', 'filter-item__label', label));
  item.appendChild(el('span', 'filter-item__count', String(count)));
  return item;
}

/**
 * Botón "Todos": no es una casilla más, es la acción de vaciar el grupo.
 * @param {object} options
 * @param {number} options.count
 * @param {boolean} options.pressed
 * @param {() => void} options.onSelect
 */
function createAllButton({ count, pressed, onSelect }) {
  const button = el('button', 'filter-item filter-item--all');
  button.type = 'button';
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  button.appendChild(el('span', 'filter-item__label', 'Todos'));
  button.appendChild(el('span', 'filter-item__count', String(count)));
  button.addEventListener('click', onSelect);
  return button;
}

/**
 * Aplica el estado (selección múltiple) a una lista de proyectos. Un grupo
 * vacío no filtra nada; con valores marcados, basta con que coincida uno.
 * @param {object[]} projects
 * @param {{category: Set<string>, tag: Set<string>}} state
 */
function applyFilters(projects, state) {
  return projects.filter((project) => {
    const categoryOk =
      state.category.size === 0 ||
      cleanList(project.categories).some((value) => state.category.has(value));
    const tagOk =
      state.tag.size === 0 ||
      cleanList(project.tags).some((value) => state.tag.has(value));
    return categoryOk && tagOk;
  });
}

/**
 * Inicializa los filtros.
 * @param {object} options
 * @param {object[]} options.projects Lista completa de proyectos.
 * @param {HTMLElement} options.categoryContainer
 * @param {HTMLElement} options.tagContainer
 * @param {HTMLElement} [options.liveRegion] Región aria-live para anunciar resultados.
 * @param {(filtered: object[]) => void} options.onChange
 * @returns {{ reset: () => void }}
 */
function initFilters({
  projects,
  categoryContainer,
  tagContainer,
  liveRegion,
  onChange,
}) {
  const state = { category: new Set(), tag: new Set() };
  const all = Array.isArray(projects) ? projects : [];

  /**
   * Repinta un grupo de filtros con el estado actual.
   * @param {HTMLElement} container
   * @param {'category'|'tag'} key
   * @param {Map<string, number>} counts
   * @param {(value: string) => string} labelFn
   */
  function renderGroup(container, key, counts, labelFn) {
    if (!container) return;
    container.replaceChildren();

    /* Si solo hay un valor posible, el filtro no aporta nada: se oculta la
       fila entera (etiqueta incluida), no solo los botones. */
    if (counts.size <= 1) {
      const row = container.closest('.filter-group');
      if (row) row.hidden = true;
      return;
    }

    /* Marcar o desmarcar un valor dentro del grupo, sin tocar el otro grupo */
    const onToggle = (value, checked) => {
      if (checked) {
        state[key].add(value);
      } else {
        state[key].delete(value);
      }
      update();
    };

    container.appendChild(
      createAllButton({
        count: all.length,
        pressed: state[key].size === 0,
        onSelect: () => {
          state[key].clear();
          update();
        },
      })
    );

    /* Orden: primero los más usados, y a igualdad, alfabético */
    const sorted = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')
    );

    /* La lista completa (trece tecnologías, por ejemplo) no cabe en una
       barra lateral: solo se ven los primeros VISIBLE_COUNT de entrada, el
       resto vive oculto detrás de un botón "Ver más". */
    const VISIBLE_COUNT = 4;
    const visible = sorted.slice(0, VISIBLE_COUNT);
    const rest = sorted.slice(VISIBLE_COUNT);

    const buildItem = ([value, count]) =>
      createFilterCheckbox({
        value,
        label: labelFn(value),
        count,
        checked: state[key].has(value),
        onToggle,
      });

    visible.forEach((entry) => container.appendChild(buildItem(entry)));

    if (rest.length > 0) {
      const extra = el('div', 'filter-group__extra');
      extra.hidden = true;
      rest.forEach((entry) => extra.appendChild(buildItem(entry)));
      container.appendChild(extra);

      const toggle = el('button', 'filter-group__toggle', `Ver más (${rest.length})`);
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        extra.hidden = !extra.hidden;
        toggle.textContent = extra.hidden ? `Ver más (${rest.length})` : 'Ver menos';
        toggle.setAttribute('aria-expanded', extra.hidden ? 'false' : 'true');
      });
      container.appendChild(toggle);
    }
  }

  /** Sincroniza el botón "Todos" y las casillas con el estado actual. */
  function syncPressed(container, key) {
    if (!container) return;
    const allButton = container.querySelector('.filter-item--all');
    if (allButton) {
      allButton.setAttribute('aria-pressed', state[key].size === 0 ? 'true' : 'false');
    }
    container.querySelectorAll('.filter-item__checkbox').forEach((checkbox) => {
      checkbox.checked = state[key].has(checkbox.value);
    });
  }

  /** Recalcula y notifica. */
  function update() {
    syncPressed(categoryContainer, 'category');
    syncPressed(tagContainer, 'tag');

    const filtered = applyFilters(all, state);
    onChange(filtered);

    if (liveRegion) {
      liveRegion.textContent =
        filtered.length === 0
          ? 'Ningún proyecto coincide con los filtros seleccionados.'
          : filtered.length === 1
          ? '1 proyecto visible.'
          : `${filtered.length} proyectos visibles.`;
    }
  }

  renderGroup(
    categoryContainer,
    'category',
    countValues(all, 'categories'),
    labelForCategory
  );
  renderGroup(tagContainer, 'tag', countValues(all, 'tags'), (value) => value);

  /* Primera pintura, sin anunciar nada todavía */
  onChange(applyFilters(all, state));

  return {
    reset() {
      state.category.clear();
      state.tag.clear();
      update();
    },
  };
}

Object.assign(window.__M, { initFilters });
})();
Object.assign(window, window.__M);

/* js/modules/dashboard.js */
(function(){
/* ============================================================================
   js/modules/dashboard.js — Panel de cifras del portafolio.
   QUÉ HACE: a partir del array `projects` (siempre la lista completa, no la
   filtrada: el panel resume todo el portafolio, no lo que se ve tras un
   filtro), dibuja un gráfico de barras de publicaciones por mes y dos
   gráficos de anillo (categorías y tecnologías), en SVG puro y sin
   librerías. Se recalcula cada vez que carga la página: nunca hay una cifra
   escrita a mano que se pueda quedar desactualizada.
   QUÉ NO HACE: no toca los contadores de arriba (esos ya los anima
   scrollReveal.js) ni el filtrado (filters.js).
   ============================================================================ */


const SVG_NS = 'http://www.w3.org/2000/svg';
const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/* Paleta corta y de colores marcadamente distintos entre sí, reutilizada en
   bucle si hay más categorías o tecnologías que colores. */
const PALETTE = [
  '#0b1f3d',
  '#2f6fb5',
  '#7fb3e3',
  '#123f6b',
  '#4c8fd0',
  '#a9cdee',
  '#1d5490',
  '#68a3da',
];

/**
 * Color de una porción: "Otros" siempre en gris neutro (no forma parte del
 * ciclo de colores, para no confundirlo con una categoría real).
 * @param {{ label: string }} entry
 * @param {number} index
 */
function colorFor(entry, index) {
  if (entry.label === 'Otros') return 'var(--color-ink-3)';
  return PALETTE[index % PALETTE.length];
}

/**
 * Crea un elemento SVG con atributos.
 * @param {string} tag
 * @param {Record<string, string|number>} attrs
 */
function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    node.setAttribute(key, String(value));
  });
  return node;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Agrupa los proyectos por mes ("AAAA-MM") a partir de `date` y devuelve
 * una ventana fija de los últimos 6 meses, terminando en el mes actual
 * (incluidos los meses sin publicaciones, para que el hueco se vea en la
 * gráfica). Como el final se calcula desde `new Date()` en cada carga, la
 * ventana se desplaza sola mes a mes: no hay que tocar el código.
 * @param {object[]} projects
 * @returns {{ key: string, label: string, count: number }[]}
 */
function monthlyCounts(projects) {
  const counts = new Map();

  projects.forEach((project) => {
    if (typeof project.date !== 'string') return;
    const match = /^(\d{4})-(\d{2})/.exec(project.date.trim());
    if (!match) return;
    const key = `${match[1]}-${match[2]}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const WINDOW_SIZE = 6;
  const today = new Date();

  /* Retrocede (WINDOW_SIZE - 1) meses desde el actual para hallar el
     primer mes de la ventana */
  let year = today.getFullYear();
  let month = today.getMonth() + 1 - (WINDOW_SIZE - 1);
  while (month <= 0) {
    month += 12;
    year -= 1;
  }

  const months = [];
  for (let i = 0; i < WINDOW_SIZE; i += 1) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    months.push({
      key,
      label: `${MONTH_LABELS[month - 1]} ${String(year).slice(2)}`,
      count: counts.get(key) || 0,
    });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/**
 * Cuenta cuántas veces aparece cada valor de una propiedad de tipo array
 * (categorías o tecnologías) y lo convierte en porcentajes.
 * @param {object[]} projects
 * @param {'categories'|'tags'} key
 * @param {(value: string) => string} labelFn
 */
function breakdown(projects, key, labelFn) {
  const counts = new Map();
  projects.forEach((project) => {
    cleanList(project[key]).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });

  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  if (total === 0) return [];

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .map(([value, count]) => ({
      label: labelFn(value),
      count,
      percent: (count / total) * 100,
    }));
}

/**
 * Junta en un único "Otros" las porciones por debajo de un umbral: con
 * trece tecnologías, un anillo con trece porciones minúsculas no se lee.
 * Va al final de la lista, tenga el porcentaje que tenga.
 * @param {{ label: string, count: number, percent: number }[]} data
 * @param {number} threshold Porcentaje mínimo para tener porción propia.
 */
function groupSmallSlices(data, threshold) {
  const big = data.filter((entry) => entry.percent >= threshold);
  const small = data.filter((entry) => entry.percent < threshold);
  if (small.length <= 1) return data;

  const count = small.reduce((sum, entry) => sum + entry.count, 0);
  const percent = small.reduce((sum, entry) => sum + entry.percent, 0);
  return [...big, { label: 'Otros', count, percent }];
}

/**
 * Une una lista de puntos {x,y} en una curva suave: cada tramo es una curva
 * de Bézier con los puntos de control a media distancia horizontal, así el
 * trazo pasa por todos los puntos con tangente suave, sin librería.
 * @param {{x: number, y: number}[]} points
 */
function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/**
 * Dibuja el gráfico de publicaciones por mes: línea fina y uniforme con
 * degradado bajo la curva, y cuadrícula horizontal sutil con sus valores.
 * Sin resaltar ningún mes concreto: con varios meses empatados al mismo
 * valor, señalar "el primero" no aporta nada real.
 * @param {SVGSVGElement} svg
 * @param {{ key: string, label: string, count: number }[]} months
 */
function renderLineChart(svg, months) {
  svg.replaceChildren();
  if (months.length === 0) return;

  const width = 100;
  const height = 58;
  const padLeft = 6;
  const padRight = 3;
  const padTop = 8;
  const padBottom = 11;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const baseline = height - padBottom;

  const max = Math.max(...months.map((m) => m.count));
  const niceMax = Math.max(max, 1);
  const step = niceMax <= 4 ? 1 : Math.ceil(niceMax / 4);
  const gridValues = [];
  for (let v = 0; v <= niceMax; v += step) gridValues.push(v);
  if (gridValues[gridValues.length - 1] < niceMax) gridValues.push(niceMax);

  const points = months.map((entry, index) => ({
    x:
      months.length === 1
        ? padLeft + plotWidth / 2
        : padLeft + (index / (months.length - 1)) * plotWidth,
    y: baseline - (entry.count / niceMax) * plotHeight,
    entry,
  }));

  /* Cuadrícula horizontal sutil, sin eje vertical */
  gridValues.forEach((value) => {
    const y = baseline - (value / niceMax) * plotHeight;
    svg.appendChild(
      svgEl('line', {
        x1: padLeft,
        x2: width - padRight,
        y1: y,
        y2: y,
        class: 'dashboard-line-chart__gridline',
      })
    );
    const label = svgEl('text', {
      x: padLeft - 1.5,
      y: y + 1,
      class: 'dashboard-line-chart__gridlabel',
      'text-anchor': 'end',
    });
    label.textContent = String(value);
    svg.appendChild(label);
  });

  /* Relleno muy sutil bajo la curva */
  const gradientId = 'monthly-gradient';
  const defs = svgEl('defs');
  const gradient = svgEl('linearGradient', {
    id: gradientId,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 1,
  });
  gradient.appendChild(
    svgEl('stop', { offset: '0%', class: 'dashboard-line-chart__gradient-start' })
  );
  gradient.appendChild(
    svgEl('stop', { offset: '100%', class: 'dashboard-line-chart__gradient-end' })
  );
  defs.appendChild(gradient);
  svg.appendChild(defs);

  const linePath = buildSmoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;

  svg.appendChild(
    svgEl('path', { d: areaPath, fill: `url(#${gradientId})`, stroke: 'none' })
  );
  svg.appendChild(
    svgEl('path', { d: linePath, class: 'dashboard-line-chart__line', fill: 'none' })
  );

  /* Etiquetas de mes bajo el eje */
  points.forEach((p) => {
    const label = svgEl('text', {
      x: p.x,
      y: height - 1,
      class: 'dashboard-line-chart__label',
      'text-anchor': 'middle',
    });
    label.textContent = p.entry.label;
    svg.appendChild(label);
  });
}

/**
 * Dibuja un gráfico de anillo (donut) a partir de una lista con porcentajes,
 * usando stroke-dasharray sobre círculos concéntricos: sin librerías, sin
 * trigonometría de arcos.
 * @param {SVGSVGElement} svg
 * @param {{ label: string, count: number, percent: number }[]} data
 */
function renderDonutChart(svg, data) {
  svg.replaceChildren();
  if (data.length === 0) return;

  const size = 100;
  const radius = 38;
  const strokeWidth = 15;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Sombra interior: hunde cada porción del anillo en lugar de dejarla plana.
  const defs = svgEl('defs', {});
  defs.innerHTML =
    // Sombra interior + reflejo: el anillo parece un tubo de vidrio.
    '<filter id="donut-inset">' +
    '<feOffset dx="0" dy="1.4"></feOffset>' +
    '<feGaussianBlur stdDeviation="1.6" result="blurred"></feGaussianBlur>' +
    '<feComposite operator="out" in="SourceGraphic" in2="blurred" result="inverse"></feComposite>' +
    '<feFlood flood-color="#0d1524" flood-opacity="0.55" result="tone"></feFlood>' +
    '<feComposite operator="in" in="tone" in2="inverse" result="shadow"></feComposite>' +
    '<feComposite operator="over" in="shadow" in2="SourceGraphic"></feComposite>' +
    '</filter>' +
    // Desenfoque de los reflejos: sin canto duro, luz difusa.
    '<filter id="donut-gloss-blur" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feGaussianBlur stdDeviation="2.2"></feGaussianBlur>' +
    '</filter>' +
    // Brillo superior: luz que resbala por la cara alta del anillo.
    '<linearGradient id="donut-gloss" x1="0" y1="0" x2="0.35" y2="1">' +
    '<stop offset="0" stop-color="#ffffff" stop-opacity="0.9"></stop>' +
    '<stop offset="0.28" stop-color="#ffffff" stop-opacity="0.45"></stop>' +
    '<stop offset="0.58" stop-color="#ffffff" stop-opacity="0.12"></stop>' +
    '<stop offset="0.8" stop-color="#ffffff" stop-opacity="0"></stop>' +
    '</linearGradient>' +
    // Reflejo inferior, más tenue: rebote de la luz en el canto de abajo.
    '<linearGradient id="donut-gloss-low" x1="0" y1="1" x2="0.2" y2="0">' +
    '<stop offset="0" stop-color="#ffffff" stop-opacity="0.38"></stop>' +
    '<stop offset="0.4" stop-color="#ffffff" stop-opacity="0"></stop>' +
    '</linearGradient>';
  svg.appendChild(defs);

  svg.appendChild(
    svgEl('circle', {
      cx: center,
      cy: center,
      r: radius,
      class: 'dashboard-donut__track',
      fill: 'none',
      'stroke-width': strokeWidth,
    })
  );

  let offset = 0;
  data.forEach((entry, index) => {
    const length = (entry.percent / 100) * circumference;
    const circle = svgEl('circle', {
      cx: center,
      cy: center,
      r: radius,
      fill: 'none',
      'stroke-width': strokeWidth,
      'stroke-linecap': data.length === 1 ? 'butt' : 'round',
      'stroke-dasharray': `${Math.max(length - 1.5, 0)} ${circumference}`,
      'stroke-dashoffset': -offset,
      style: `stroke: ${colorFor(entry, index)}`,
      transform: `rotate(-90 ${center} ${center})`,
      filter: 'url(#donut-inset)',
    });
    svg.appendChild(circle);
    offset += length;
  });

  addDonutGlass(svg, center, radius, strokeWidth);
}

/**
 * Añade a un anillo dos capas de reflejo (arriba y abajo) que no tapan el
 * color de las porciones: se pintan encima, en blanco translúcido.
 * @param {SVGSVGElement} svg
 * @param {number} center
 * @param {number} radius
 * @param {number} strokeWidth
 */
function addDonutGlass(svg, center, radius, strokeWidth) {
  [
    { gradient: 'donut-gloss', width: strokeWidth * 0.5, offset: -strokeWidth * 0.24 },
    { gradient: 'donut-gloss-low', width: strokeWidth * 0.26, offset: strokeWidth * 0.32 },
  ].forEach(({ gradient, width, offset }) => {
    svg.appendChild(
      svgEl('circle', {
        cx: center,
        cy: center,
        r: radius + offset,
        fill: 'none',
        'stroke-width': width,
        stroke: `url(#${gradient})`,
        filter: 'url(#donut-gloss-blur)',
        'pointer-events': 'none',
      })
    );
  });
}

/**
 * Rellena la leyenda (color + etiqueta + porcentaje) de un donut.
 * @param {HTMLElement} container
 * @param {{ label: string, count: number, percent: number }[]} data
 */
function renderLegend(container, data) {
  if (!container) return;
  container.replaceChildren();

  data.forEach((entry, index) => {
    const item = el('li', 'dashboard-legend__item');
    const swatch = el('span', 'dashboard-legend__swatch');
    swatch.style.backgroundColor = colorFor(entry, index);
    item.appendChild(swatch);
    item.appendChild(el('span', 'dashboard-legend__label', entry.label));
    item.appendChild(
      el('span', 'dashboard-legend__percent', `${Math.round(entry.percent)}%`)
    );
    container.appendChild(item);
  });
}

/**
 * Punto de entrada: calcula y dibuja los tres gráficos del panel.
 * @param {object} options
 * @param {object[]} options.projects Lista completa (sin filtrar) de proyectos.
 * @param {SVGSVGElement} [options.monthlyChart]
 * @param {SVGSVGElement} [options.categoryChart]
 * @param {HTMLElement} [options.categoryLegend]
 * @param {SVGSVGElement} [options.techChart]
 * @param {HTMLElement} [options.techLegend]
 */
function initDashboard({
  projects,
  monthlyChart,
  categoryChart,
  categoryLegend,
  techChart,
  techLegend,
}) {
  const all = Array.isArray(projects) ? projects : [];

  if (monthlyChart) {
    renderLineChart(monthlyChart, monthlyCounts(all));
  }

  if (categoryChart) {
    const data = breakdown(all, 'categories', labelForCategory);
    renderDonutChart(categoryChart, data);
    renderLegend(categoryLegend, data);
  }

  if (techChart) {
    const data = groupSmallSlices(breakdown(all, 'tags', (value) => value), 10);
    renderDonutChart(techChart, data);
    renderLegend(techLegend, data);
  }
}

Object.assign(window.__M, { initDashboard });
})();
Object.assign(window, window.__M);

/* js/modules/modal.js */
(function(){
/* ============================================================================
   js/modules/modal.js — Modal accesible de detalle de proyecto.
   QUÉ HACE: rellena y abre el diálogo, atrapa el foco dentro (focus trap),
   cierra con Esc y con clic en el fondo, bloquea el scroll del body y
   devuelve el foco al elemento que lo abrió.
   QUÉ NO HACE: no conoce la estructura de datos más allá del objeto proyecto
   que recibe, y no construye tarjetas.

   Se usa un <div role="dialog"> en lugar de <dialog> nativo para controlar
   por completo la animación de entrada y el comportamiento del foco.
   ============================================================================ */

/* Selector de todo lo que puede recibir foco dentro del diálogo */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/* Etiquetas visibles de cada tipo de enlace */
const LINK_LABELS = {
  demo: 'Ver demo',
  repo: 'Ver código',
  caseStudy: 'Caso de estudio',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Solo http(s) y mailto. Impide que un dato mal escrito acabe siendo un
 * enlace `javascript:` ejecutable.
 * @param {unknown} url
 */
function isSafeUrl(url) {
  if (!hasText(url)) return false;
  try {
    const parsed = new URL(url, window.location.href);
    return ['https:', 'http:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function statusModifier(status) {
  return status.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Inicializa el modal.
 * @param {object} options
 * @param {HTMLElement} options.root      Contenedor .modal
 * @param {HTMLElement} options.content   Contenedor donde se inyecta el detalle
 * @param {HTMLElement} options.dialog    El nodo con role="dialog"
 * @param {HTMLElement} options.backdrop  El fondo clicable
 * @param {HTMLElement} options.closeButton
 * @param {string} options.titleId        id del h2 que titula el diálogo
 * @returns {{ open: (project: object) => void, close: () => void }}
 */
function initModal({
  root,
  content,
  dialog,
  backdrop,
  closeButton,
  titleId,
}) {
  if (!root || !content || !dialog) {
    return { open() {}, close() {} };
  }

  /** Elemento que tenía el foco antes de abrir, para devolvérselo al cerrar */
  let lastFocused = null;
  let isOpen = false;

  /* ---------------------------------------------------------------------
     Construcción del contenido
     --------------------------------------------------------------------- */
  function buildContent(project) {
    content.replaceChildren();

    /* Metadatos: estado, año, rol */
    const meta = el('div', 'modal__meta');
    if (hasText(project.status)) {
      const status = el(
        'span',
        `status status--${statusModifier(project.status)}`
      );
      status.appendChild(el('span', 'status__dot'));
      status.appendChild(el('span', null, project.status));
      meta.appendChild(status);
    }
    if (typeof project.year === 'number') {
      meta.appendChild(el('span', 'status', String(project.year)));
    }
    /* El rol va en caja normal: en versalitas y a 14 px una frase larga
       como "Desarrollo completo: análisis, base de datos e interfaz" grita. */
    if (hasText(project.role)) {
      meta.appendChild(el('span', 'modal__role', project.role));
    }
    if (meta.childElementCount > 0) content.appendChild(meta);

    /* Título: es el nombre accesible del diálogo */
    const title = el('h2', 'modal__title', project.title);
    title.id = titleId;
    content.appendChild(title);

    if (hasText(project.tagline)) {
      content.appendChild(el('p', 'modal__tagline', project.tagline));
    }

    /* Galería: portada + imágenes adicionales, sin duplicar la portada */
    const images = [];
    if (hasText(project.cover)) images.push(project.cover);
    if (Array.isArray(project.gallery)) {
      project.gallery
        .filter(hasText)
        .forEach((src) => {
          if (!images.includes(src)) images.push(src);
        });
    }
    if (images.length > 0) {
      const gallery = el('div', 'modal__gallery');
      images.forEach((src, index) => {
        const figure = el('figure', 'modal__figure');
        const img = el('img');
        img.src = src;
        img.alt = `${project.title}: imagen ${index + 1} de ${images.length}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 1200;
        img.height = 750;
        figure.appendChild(img);
        gallery.appendChild(figure);
      });
      content.appendChild(gallery);
    }

    /* Tecnologías */
    const tags = Array.isArray(project.tags) ? project.tags.filter(hasText) : [];
    if (tags.length > 0) {
      const wrapper = el('div');
      wrapper.appendChild(el('h3', 'modal__section-title', 'Tecnologías'));
      const list = el('ul', 'chip-list');
      list.setAttribute('role', 'list');
      tags.forEach((tag) => {
        const li = document.createElement('li');
        li.appendChild(el('span', 'chip chip--accent', tag));
        list.appendChild(li);
      });
      wrapper.appendChild(list);
      content.appendChild(wrapper);
    }

    /* Descripción larga */
    if (hasText(project.description)) {
      const wrapper = el('div');
      wrapper.appendChild(el('h3', 'modal__section-title', 'Sobre el proyecto'));
      wrapper.appendChild(
        el('p', 'modal__description', project.description)
      );
      content.appendChild(wrapper);
    }

    /* Highlights */
    const highlights = Array.isArray(project.highlights)
      ? project.highlights.filter(hasText)
      : [];
    if (highlights.length > 0) {
      const wrapper = el('div');
      wrapper.appendChild(el('h3', 'modal__section-title', 'Destacado'));
      const list = el('ul', 'modal__highlights');
      list.setAttribute('role', 'list');
      highlights.forEach((text) => {
        list.appendChild(el('li', 'modal__highlight', text));
      });
      wrapper.appendChild(list);
      content.appendChild(wrapper);
    }

    /* Enlaces: los ausentes o inválidos simplemente no se dibujan */
    const links = project.links && typeof project.links === 'object'
      ? project.links
      : {};
    const validLinks = Object.keys(LINK_LABELS).filter((key) =>
      isSafeUrl(links[key])
    );
    if (validLinks.length > 0) {
      content.appendChild(el('hr', 'modal__divider'));
      const nav = el('div', 'modal__links');
      validLinks.forEach((key, index) => {
        const link = el(
          'a',
          index === 0 ? 'btn btn--primary' : 'btn btn--ghost',
          LINK_LABELS[key]
        );
        link.href = links[key];
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        nav.appendChild(link);
      });
      content.appendChild(nav);
    }
  }

  /* ---------------------------------------------------------------------
     Focus trap
     --------------------------------------------------------------------- */
  function getFocusable() {
    return [...dialog.querySelectorAll(FOCUSABLE)].filter(
      (node) => node.offsetParent !== null || node === closeButton
    );
  }

  function handleKeydown(event) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    /* Ciclo cerrado: del último al primero y viceversa */
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!dialog.contains(document.activeElement)) {
      /* Si el foco se ha escapado (por ejemplo tras un clic fuera), se recupera */
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------------------------
     API pública
     --------------------------------------------------------------------- */
  function open(project) {
    if (!project) return;

    lastFocused = document.activeElement;
    buildContent(project);

    root.classList.add('is-open');
    root.removeAttribute('aria-hidden');
    document.body.classList.add('is-modal-open');
    isOpen = true;

    /* El scroll del diálogo vuelve arriba en cada apertura */
    dialog.scrollTop = 0;
    /* El foco entra por el botón de cerrar: siempre existe y es seguro */
    if (closeButton) closeButton.focus();

    document.addEventListener('keydown', handleKeydown, true);
  }

  function close() {
    if (!isOpen) return;

    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-modal-open');
    isOpen = false;

    document.removeEventListener('keydown', handleKeydown, true);

    /* Devolución del foco al disparador original */
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  if (backdrop) backdrop.addEventListener('click', close);
  if (closeButton) closeButton.addEventListener('click', close);

  return { open, close };
}

Object.assign(window.__M, { initModal });
})();
Object.assign(window, window.__M);

/* js/modules/scrollReveal.js */
(function(){
/* ============================================================================
   js/modules/scrollReveal.js — Efectos ligados al scroll dentro del contenido.
   QUÉ HACE: revela elementos al entrar en el viewport (con escalonado que
   resuelve el CSS) y anima los contadores una sola vez.
   QUÉ NO HACE: no toca el header ni la navegación (navigation.js).

   RENDIMIENTO: todo lo que depende de la posición usa IntersectionObserver,
   nunca un listener de scroll sin throttle.
   ACCESIBILIDAD: con prefers-reduced-motion no se activa nada; el contenido
   se muestra directamente en su estado final.
   ============================================================================ */

/** Consulta viva: si el usuario cambia la preferencia, se respeta al instante */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Revela los elementos con [data-reveal] al entrar en pantalla.
 * @param {ParentNode} [scope=document] Ámbito donde buscar (útil tras filtrar).
 */
function revealWithin(scope = document) {
  const targets = scope.querySelectorAll('[data-reveal]:not(.is-revealed)');
  if (targets.length === 0) return;

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    targets.forEach((node) => node.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        /* Una vez revelado, deja de observarse: no hay coste residual */
        obs.unobserve(entry.target);
      });
    },
    {
      /* Se dispara un poco antes de que el elemento entre del todo */
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.08,
    }
  );

  targets.forEach((node) => observer.observe(node));
}

/**
 * Revela y OCULTA los elementos con [data-reveal-cycle] según entren o
 * salgan del viewport: a diferencia de revealWithin(), nunca deja de
 * observarlos, así que la animación se repite cada vez que se cruza la
 * sección (entrada y salida), en vez de quedar fija tras la primera vez.
 * @param {ParentNode} [scope=document] Ámbito donde buscar.
 */
function initScrollCycle(scope = document) {
  const targets = scope.querySelectorAll('[data-reveal-cycle]');
  if (targets.length === 0) return;

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    targets.forEach((node) => node.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-revealed', entry.isIntersecting);
      });
    },
    {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.2,
    }
  );

  targets.forEach((node) => observer.observe(node));
}

/**
 * Anima un contador de 0 hasta su valor final.
 * @param {HTMLElement} node Elemento con data-count="12"
 */
function animateCounter(node) {
  const target = Number.parseInt(node.dataset.count || '0', 10);
  if (!Number.isFinite(target)) return;

  if (reducedMotion.matches) {
    node.textContent = String(target);
    return;
  }

  const duration = 900;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    /* easeOutCubic: arranca rápido y frena, se lee mejor que lineal */
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/**
 * Activa los contadores cuando entran en pantalla, una sola vez.
 */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((node) => observer.observe(node));
}

/**
 * Punto de entrada del módulo.
 */
function initScrollReveal() {
  /* La clase la pone JS: sin JS, nada queda invisible */
  document.documentElement.classList.add('reveal-enabled');
  revealWithin(document);
  initScrollCycle(document);
  initCounters();
}

Object.assign(window.__M, { revealWithin, initScrollCycle, initCounters, initScrollReveal });
})();
Object.assign(window, window.__M);

/* js/modules/navigation.js */
(function(){
/* ============================================================================
   js/modules/navigation.js — Todo lo que ocurre en la cabecera.
   QUÉ HACE: comprime el header al bajar, dibuja la barra de progreso de
   lectura, marca el enlace de la sección visible, y gestiona el menú móvil
   (apertura, cierre con Esc, clic fuera, foco y bloqueo del scroll).
   QUÉ NO HACE: no anima el contenido de las secciones (scrollReveal.js).

   El desplazamiento suave lo hace el CSS (scroll-behavior + scroll-padding-top),
   no JavaScript: menos código y mejor comportamiento por defecto.
   ============================================================================ */

/**
 * Inicializa la cabecera.
 * @param {object} options
 * @param {HTMLElement} options.header
 * @param {HTMLElement} options.nav
 * @param {HTMLElement} options.toggle    Botón hamburguesa
 * @param {HTMLElement} options.overlay   Velo del menú móvil
 * @param {HTMLElement} options.progressBar
 * @param {NodeListOf<HTMLAnchorElement>} options.links Enlaces de navegación
 */
function initNavigation({
  header,
  nav,
  toggle,
  overlay,
  progressBar,
  links,
}) {
  /* -------------------------------------------------------------------
     1. Header comprimido + barra de progreso
     Un único listener de scroll para las dos cosas, limitado con rAF.
     ------------------------------------------------------------------- */
  let ticking = false;

  function updateOnScroll() {
    ticking = false;

    const scrolled = window.scrollY;

    if (header) {
      header.classList.toggle('is-compact', scrolled > 24);
    }

    if (progressBar) {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? scrolled / scrollable : 0;
      const clamped = Math.max(0, Math.min(1, ratio));
      progressBar.style.transform = `scaleX(${clamped.toFixed(4)})`;
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateOnScroll);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateOnScroll();

  /* -------------------------------------------------------------------
     2. Enlace activo según la sección visible
     Con IntersectionObserver, nunca calculando posiciones en cada scroll.
     ------------------------------------------------------------------- */
  const linkList = links ? [...links] : [];
  const sections = linkList
    .map((link) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return null;
      return document.querySelector(id);
    })
    .filter(Boolean);

  if (sections.length > 0 && 'IntersectionObserver' in window) {
    /* Se guarda la visibilidad de cada sección y gana la más visible */
    const ratios = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestId = null;
        let bestRatio = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        linkList.forEach((link) => {
          const isActive = bestId !== null && link.getAttribute('href') === `#${bestId}`;
          link.classList.toggle('is-active', isActive);
          if (isActive) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      },
      {
        /* Se ignora la franja tapada por el header fijo */
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.6, 0.85],
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* -------------------------------------------------------------------
     3. Menú móvil
     ------------------------------------------------------------------- */
  if (!nav || !toggle) return;

  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    if (overlay) overlay.classList.add('is-visible');
    document.body.classList.add('is-menu-open');

    /* El panel pasa de visibility:hidden a visible y un elemento aún oculto
       no puede recibir el foco. Leer offsetHeight fuerza el recálculo de
       estilos antes de enfocar: más fiable que esperar un fotograma, que en
       una pestaña en segundo plano puede tardar en llegar. */
    void nav.offsetHeight;
    const firstLink = nav.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu({ returnFocus = false } = {}) {
    if (!menuOpen) return;
    menuOpen = false;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de navegación');
    if (overlay) overlay.classList.remove('is-visible');
    document.body.classList.remove('is-menu-open');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (menuOpen) {
      closeMenu({ returnFocus: true });
    } else {
      openMenu();
    }
  });

  if (overlay) {
    overlay.addEventListener('click', () => closeMenu({ returnFocus: true }));
  }

  /* Al elegir un destino, el panel se cierra sin robar el foco al ancla */
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuOpen) {
      closeMenu({ returnFocus: true });
    }
  });

  /* Si se pasa a escritorio con el panel abierto, se limpia el estado:
     de lo contrario el body seguiría con el scroll bloqueado. */
  const desktop = window.matchMedia('(min-width: 64em)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });
}

Object.assign(window.__M, { initNavigation });
})();
Object.assign(window, window.__M);

/* js/main.js */
(function(){
/* ============================================================================
   js/main.js — Punto de entrada. Orquesta los módulos.
   QUÉ HACE: recoge los nodos del DOM una sola vez, arranca cada módulo con lo
   que necesita, conecta filtros → rejilla → modal, calcula los contadores a
   partir de los datos y valida el formulario de contacto.
   QUÉ NO HACE: no contiene lógica de presentación de ningún componente. Si
   algo crece aquí, es que le toca su propio módulo.

   No se crea ninguna variable global: este archivo es un módulo ES y todo su
   contenido queda encapsulado.
   ============================================================================ */








/* ==========================================================================
   Utilidades locales mínimas
   ========================================================================== */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ==========================================================================
   1. Navegación
   ========================================================================== */
initNavigation({
  header: $('#header'),
  nav: $('#primary-nav'),
  toggle: $('#nav-toggle'),
  overlay: $('#nav-overlay'),
  progressBar: $('#progress-bar'),
  links: $$('.nav__link'),
});

/* ==========================================================================
   2. Modal de proyecto
   ========================================================================== */
const modal = initModal({
  root: $('#project-modal'),
  content: $('#modal-content'),
  dialog: $('#modal-dialog'),
  backdrop: $('#modal-backdrop'),
  closeButton: $('#modal-close'),
  titleId: 'modal-title',
});

/* ==========================================================================
   3. Portafolio: filtros → rejilla → modal
   ========================================================================== */
const grid = $('#project-grid');
const emptyState = $('#projects-empty');

/**
 * Pinta la rejilla con una transición corta de salida y entrada.
 * @param {object[]} filtered
 */
function paintProjects(filtered) {
  if (!grid) return;

  const draw = () => {
    renderProjects({
      projects: filtered,
      grid,
      emptyState,
      onOpen: (project) => modal.open(project),
    });
    /* Las tarjetas nuevas entran con el mismo reveal que el resto */
    revealWithin(grid);
    grid.classList.remove('is-filtering');
  };

  /* Sin movimiento reducido, se hace un fundido de 160 ms antes de repintar */
  if (reducedMotion.matches || grid.childElementCount === 0) {
    draw();
    return;
  }

  grid.classList.add('is-filtering');
  window.setTimeout(draw, 160);
}

initFilters({
  projects,
  categoryContainer: $('#filters-category'),
  tagContainer: $('#filters-tag'),
  liveRegion: $('#projects-status'),
  onChange: paintProjects,
});

/* El panel resume SIEMPRE el portafolio completo: usa `projects` tal cual,
   nunca la lista ya filtrada. */
initDashboard({
  projects,
  monthlyChart: $('#chart-monthly'),
  categoryChart: $('#chart-categories'),
  categoryLegend: $('#legend-categories'),
  techChart: $('#chart-technologies'),
  techLegend: $('#legend-technologies'),
});

/* El bloque de filtros nunca puede quedar más alto que el panel de cifras
   de al lado: si "Ver más" no cabe, se desplaza dentro del propio bloque.
   El grid CSS por sí solo no basta (un hijo con overflow no evita que su
   contenido siga empujando la fila), así que se iguala la altura a mano y
   se vuelve a calcular si cambia el tamaño de la ventana o el contenido
   del panel. */
(function syncSidebarHeight() {
  const sidebar = $('.portfolio__sidebar');
  const dashboard = $('.dashboard');
  if (!sidebar || !dashboard) return;

  const isDesktop = window.matchMedia('(min-width: 64em)');

  function sync() {
    if (isDesktop.matches) {
      sidebar.style.maxHeight = `${dashboard.getBoundingClientRect().height}px`;
    } else {
      sidebar.style.maxHeight = '';
    }
  }

  sync();
  window.addEventListener('resize', sync);
  if ('ResizeObserver' in window) {
    new ResizeObserver(sync).observe(dashboard);
  }
})();

/* ==========================================================================
   4. Contadores derivados de los datos
   Nunca se escriben cifras a mano en el HTML: si añades un proyecto, suben
   solas.
   ========================================================================== */
function updateCounters() {
  const technologies = new Set();
  const categories = new Set();

  projects.forEach((project) => {
    cleanList(project.tags).forEach((tag) => technologies.add(tag));
    cleanList(project.categories).forEach((category) =>
      categories.add(category)
    );
  });

  const values = {
    'count-projects': projects.length,
    'count-technologies': technologies.size,
    'count-categories': categories.size,
  };

  Object.entries(values).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.dataset.count = String(value);
    /* Valor visible desde el principio por si el contador no llega a animarse */
    node.textContent = String(value);
  });
}

updateCounters();

/* ==========================================================================
   5. Efectos de scroll
   Se arrancan al final, cuando todo el contenido dinámico ya está en el DOM.
   ========================================================================== */
initScrollReveal();

/* ==========================================================================
   6. Formulario de contacto (mailto)
   No hay servidor: el formulario compone un correo y lo abre en el cliente de
   la usuaria. La validación es solo para la experiencia; no protege nada,
   porque no hay nada que proteger en el cliente.
   ========================================================================== */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const status = $('#form-status');
  const email = form.dataset.mailto;

  /**
   * Marca o limpia el error de un campo.
   * @param {HTMLElement} field   Contenedor .field
   * @param {string} message      Cadena vacía = sin error
   */
  function setError(field, message) {
    const control = $('.field__control', field);
    const error = $('.field__error', field);
    field.classList.toggle('has-error', message !== '');
    if (error) error.textContent = message;
    if (control) {
      control.setAttribute('aria-invalid', message !== '' ? 'true' : 'false');
    }
  }

  /**
   * Valida un campo y devuelve si es correcto.
   * @param {HTMLElement} field
   */
  function validateField(field) {
    const control = $('.field__control', field);
    if (!control) return true;

    const value = control.value.trim();

    if (control.required && value === '') {
      setError(field, 'Este campo es obligatorio.');
      return false;
    }

    if (control.type === 'email' && value !== '' && !control.checkValidity()) {
      setError(field, 'Escribe una dirección de correo válida.');
      return false;
    }

    if (control.minLength > 0 && value !== '' && value.length < control.minLength) {
      setError(
        field,
        `Escribe al menos ${control.minLength} caracteres (llevas ${value.length}).`
      );
      return false;
    }

    setError(field, '');
    return true;
  }

  const fields = $$('.field', form);

  /* Se valida al salir del campo, y al escribir solo si ya había error:
     así no se regaña a nadie mientras aún está escribiendo. */
  fields.forEach((field) => {
    const control = $('.field__control', field);
    if (!control) return;
    control.addEventListener('blur', () => validateField(field));
    control.addEventListener('input', () => {
      if (field.classList.contains('has-error')) validateField(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const results = fields.map(validateField);
    if (results.includes(false)) {
      if (status) status.textContent = 'Revisa los campos marcados en rojo.';
      const firstInvalid = $('.field.has-error .field__control', form);
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    if (!email) {
      if (status) {
        status.textContent =
          'No hay dirección de destino configurada en el formulario.';
      }
      return;
    }

    const name = $('#form-name')?.value.trim() || '';
    const from = $('#form-email')?.value.trim() || '';
    const message = $('#form-message')?.value.trim() || '';

    const subject = `Contacto desde el portafolio — ${name}`;
    const body = `${message}\n\n—\n${name}\n${from}`;

    /* encodeURIComponent evita que un salto de línea o un & rompan el enlace */
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    if (status) {
      status.textContent =
        'Se abrirá tu cliente de correo con el mensaje preparado.';
    }
  });
}

initContactForm();

/* ==========================================================================
   7. Año dinámico del footer
   ========================================================================== */
const yearNode = $('#current-year');
if (yearNode) yearNode.textContent = String(new Date().getFullYear());

})();
