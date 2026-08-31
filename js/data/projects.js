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
    cover: 'assets/img/proyecto-1.png',
    gallery: ['assets/img/proyecto-1-a.png', 'assets/img/proyecto-1-b.png'],
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
    cover: 'assets/img/proyecto-2.png',
    gallery: ['assets/img/proyecto-2-a.png'],
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
    cover: 'assets/img/proyecto-3.png',
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
export const categoryLabels = {
  web: 'Web',
  movil: 'Móvil',
  api: 'API',
  escritorio: 'Escritorio',
};
