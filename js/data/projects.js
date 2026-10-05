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
export const projects = [
  /* ▲ ANCLA-ADMIN: no borrar esta línea. Aquí inserta el panel los proyectos nuevos. */
  {
    "id": "escada-web",
    "title": "ESCADA-web",
    "tagline": "Landing perfume ESCADA",
    "description": "Landing de maqueta ficticia para el Eau de Parfum ESCADA. HTML, CSS y JS estándar: sin dependencias de build ni de CDN.\nTodos los datos son ficticios",
    "status": "finalizado",
    "featured": true,
    "tags": [
      "HTML",
      "CSS",
      "JavaScript",
      "Canvas 2D",
      "WebGL",
      "Blender",
      "Python"
    ],
    "categories": [
      "web"
    ],
    "cover": "assets/img/escada-web-cover.jpg",
    "gallery": [
      "assets/img/escada-web-1.jpg",
      "assets/img/escada-web-2.png",
      "assets/img/escada-web-3.jpg",
      "assets/img/escada-web-4.jpg"
    ],
    "links": {
      "demo": "",
      "repo": "https://github.com/lucia-ec/escada-web"
    },
    "date": "2026-10-05"
  },
];

/**
 * Etiquetas legibles para las categorías. Si añades una categoría nueva y no
 * la registras aquí, se muestra capitalizada automáticamente: nada se rompe.
 * @type {Record<string, string>}
 */
export const categoryLabels = {
  web: 'Web',
  movil: 'Móvil',
  api: 'API',
  escritorio: 'Escritorio',
};
