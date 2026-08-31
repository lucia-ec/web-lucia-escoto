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
export function revealWithin(scope = document) {
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
export function initScrollCycle(scope = document) {
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
export function initCounters() {
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
export function initScrollReveal() {
  /* La clase la pone JS: sin JS, nada queda invisible */
  document.documentElement.classList.add('reveal-enabled');
  revealWithin(document);
  initScrollCycle(document);
  initCounters();
}
