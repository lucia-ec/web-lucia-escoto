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
export function initNavigation({
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
