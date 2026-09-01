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
 * @param {(images: {src: string, alt: string}[], index: number) => void} [options.onImageClick]
 *        Se llama al pulsar una foto de la galería, con la lista completa de
 *        fotos del proyecto y el índice de la que se pulsó — quien
 *        inicializa el modal decide qué hacer (por ejemplo, abrir el visor
 *        ampliado de js/modules/lightbox.js, que ya sabe pasar a la
 *        anterior/siguiente con esa misma lista).
 * @returns {{ open: (project: object) => void, close: () => void }}
 */
export function initModal({
  root,
  content,
  dialog,
  backdrop,
  closeButton,
  titleId,
  onImageClick,
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
      const galleryImages = images.map((src, index) => ({
        src,
        alt: `${project.title}: imagen ${index + 1} de ${images.length}`,
      }));
      images.forEach((src, index) => {
        const figure = el('figure', 'modal__figure');
        const img = el('img');
        img.src = src;
        img.alt = galleryImages[index].alt;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 1200;
        img.height = 750;
        if (typeof onImageClick === 'function') {
          img.addEventListener('click', () => onImageClick(galleryImages, index));
        }
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
