/* ============================================================================
   js/modules/lightbox.js — Visor de imagen ampliada de la galería del modal.
   QUÉ HACE: muestra una imagen a pantalla casi completa, cierra con Esc y con
   clic en el fondo, alterna el zoom al pulsar sobre la propia imagen, y deja
   pasar a la foto anterior/siguiente con flechas o con las teclas ←/→ cuando
   el proyecto tiene más de una imagen.
   QUÉ NO HACE: no sabe nada de proyectos — solo recibe una lista de
   {src, alt} y un índice de partida, y las va mostrando.
   ============================================================================ */

/**
 * Inicializa el visor.
 * @param {object} options
 * @param {HTMLElement} options.root      Contenedor .lightbox
 * @param {HTMLElement} options.image     El <img> donde se pinta la foto
 * @param {HTMLElement} options.backdrop  El fondo clicable
 * @param {HTMLElement} options.closeButton
 * @param {HTMLElement} options.prevButton
 * @param {HTMLElement} options.nextButton
 * @param {HTMLElement} options.counter   Texto "2 / 5"
 * @returns {{ open: (images: {src: string, alt: string}[], startIndex: number) => void, close: () => void }}
 */
export function initLightbox({ root, image, backdrop, closeButton, prevButton, nextButton, counter }) {
  if (!root || !image) {
    return { open() {}, close() {} };
  }

  let lastFocused = null;
  let isOpen = false;
  let images = [];
  let currentIndex = 0;

  function showCurrent() {
    const current = images[currentIndex];
    if (!current) return;
    image.classList.remove('is-zoomed');
    image.src = current.src;
    image.alt = current.alt || '';

    const hasMultiple = images.length > 1;
    if (prevButton) prevButton.hidden = !hasMultiple;
    if (nextButton) nextButton.hidden = !hasMultiple;
    if (counter) {
      counter.hidden = !hasMultiple;
      counter.textContent = `${currentIndex + 1} / ${images.length}`;
    }
  }

  function goTo(index) {
    if (images.length === 0) return;
    currentIndex = (index + images.length) % images.length;
    showCurrent();
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function prev() {
    goTo(currentIndex - 1);
  }

  function toggleZoom() {
    image.classList.toggle('is-zoomed');
  }

  function handleKeydown(event) {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    }
  }

  /**
   * @param {{src: string, alt: string}[]} imageList
   * @param {number} startIndex
   */
  function open(imageList, startIndex) {
    if (!Array.isArray(imageList) || imageList.length === 0) return;
    lastFocused = document.activeElement;
    images = imageList;
    goTo(startIndex || 0);

    root.classList.add('is-open');
    root.removeAttribute('aria-hidden');
    document.body.classList.add('is-modal-open');
    isOpen = true;

    if (closeButton) closeButton.focus();
    document.addEventListener('keydown', handleKeydown, true);
  }

  function close() {
    if (!isOpen) return;

    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-modal-open');
    isOpen = false;
    image.classList.remove('is-zoomed');

    document.removeEventListener('keydown', handleKeydown, true);

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  image.addEventListener('click', toggleZoom);
  if (backdrop) backdrop.addEventListener('click', close);
  if (closeButton) closeButton.addEventListener('click', close);
  if (prevButton) prevButton.addEventListener('click', prev);
  if (nextButton) nextButton.addEventListener('click', next);

  return { open, close };
}
