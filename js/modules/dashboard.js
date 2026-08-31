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

import { cleanList, labelForCategory } from './renderProjects.js?v=64';

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
export function initDashboard({
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
