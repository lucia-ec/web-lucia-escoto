/* ============================================================================
   js/modules/filters.js — Filtros del portafolio.
   QUÉ HACE: deriva los filtros de categoría y de tecnología directamente de
   los datos de los proyectos (si añades un proyecto con una tecnología nueva,
   el filtro aparece solo), gestiona el estado activo —de selección
   múltiple: se pueden marcar varios a la vez dentro de un mismo grupo— y
   avisa por callback con la lista ya filtrada.
   QUÉ NO HACE: no pinta tarjetas (renderProjects.js) ni sabe cómo se ve una.
   ============================================================================ */

import { cleanList, labelForCategory } from './renderProjects.js?v=64';

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
export function initFilters({
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
