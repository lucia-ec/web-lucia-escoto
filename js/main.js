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

import { projects } from './data/projects.js?v=64';
import { renderProjects, cleanList } from './modules/renderProjects.js?v=64';
import { initFilters } from './modules/filters.js?v=64';
import { initDashboard } from './modules/dashboard.js?v=64';
import { initModal } from './modules/modal.js?v=64';
import { initLightbox } from './modules/lightbox.js?v=64';
import { initScrollReveal, revealWithin } from './modules/scrollReveal.js?v=64';
import { initNavigation } from './modules/navigation.js?v=64';

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
const lightbox = initLightbox({
  root: $('#image-lightbox'),
  image: $('#lightbox-image'),
  backdrop: $('#lightbox-backdrop'),
  closeButton: $('#lightbox-close'),
  prevButton: $('#lightbox-prev'),
  nextButton: $('#lightbox-next'),
  counter: $('#lightbox-counter'),
});

const modal = initModal({
  root: $('#project-modal'),
  content: $('#modal-content'),
  dialog: $('#modal-dialog'),
  backdrop: $('#modal-backdrop'),
  closeButton: $('#modal-close'),
  titleId: 'modal-title',
  onImageClick: lightbox.open,
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
