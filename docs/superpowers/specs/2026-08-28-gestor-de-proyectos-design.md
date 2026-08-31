# Gestor de proyectos — rediseño del panel de administración

## Contexto

El panel de administración (`admin.html`) ya permite añadir proyectos nuevos
mediante un formulario, tras verificar una frase de paso. Todo el flujo
posterior al login se va a rediseñar: pantalla completa (sin recuadro),
título "Gestor de proyectos", una tabla con los proyectos existentes, y la
posibilidad de editar y eliminar proyectos (hasta ahora solo se podía añadir).

La pantalla de la frase de paso (`#gate-passphrase`) no cambia.

## Pantallas

### 1. Frase de paso — sin cambios

Sigue igual: recuadro centrado, campo de contraseña, botón "Entrar".

### 2. Gestor de proyectos (nueva)

Pantalla completa, sin recuadro que enmarque el contenido.

- Cabecera: título "Gestor de proyectos" a la izquierda, enlace "Volver a
  la web" (a `index.html`) a la derecha.
- Tabla de proyectos. La primera fila de la tabla es el botón
  **"+ Añadir proyecto"** (azul, `--color-accent`), integrado como parte de
  la propia tabla, no como un elemento separado por encima.
- El resto de filas: una por proyecto, ordenadas por `date` — **la más
  reciente primero**. Los proyectos sin `date` van al final, manteniendo
  entre ellos el orden en que aparecen en el array.
- Cada fila muestra, a la izquierda, una estrella y el título; a la
  derecha, los iconos de editar y eliminar:
  - Estrella (destacado): vacía/gris (`--color-ink-3`) si el proyecto no es
    `featured`, rellena en ámbar (`--color-warning`) si lo es. Un clic
    alterna el valor y **guarda al instante** (no hace falta entrar a
    editar el proyecto para esto).
  - Lápiz (editar), color verde (`--color-success`).
  - Papelera (eliminar), color rojo (`--color-danger`).
- Si no hay ningún proyecto, en vez de una tabla vacía se muestra un mensaje
  ("Aún no hay proyectos") y el botón de añadir bien visible.
- Los datos de la tabla se obtienen importando `js/data/projects.js`
  directamente como módulo ES (`import()`), no analizando el texto — es JS
  real y ya se sirve por HTTP.

### 3. Añadir / Editar proyecto

Se reutiliza el formulario que ya existe (mismos campos: título, id,
tagline, descripción, rol, año, estado, destacado, tags, categorías,
highlights, portada, galería, enlaces), quitándole el recuadro para que
ocupe toda la pantalla. Un único formulario sirve para los dos modos:

| | Añadir | Editar |
|---|---|---|
| Título de la pantalla | "Añadir proyecto" | "Editar proyecto" |
| Color del botón de guardar | Azul (`--color-accent`) | Verde (`--color-success`) |
| Campos | vacíos | precargados con los datos del proyecto |
| Validación de id duplicado | contra todos los ids existentes | contra todos los ids existentes **excepto el propio** |

- Las imágenes (portada/galería) no se pueden precargar en un `<input
  type="file">` (limitación del navegador). En modo edición se muestra una
  miniatura de la imagen actual con el texto "Sube una nueva para
  reemplazarla"; si no se sube nada nuevo, se conserva la ruta que ya
  tenía.
- Un enlace "Cancelar" vuelve a la pantalla de la lista sin guardar nada.

### 4. Eliminar

Al pulsar la papelera aparece un cuadro de confirmación **a medida** (no el
feo `window.confirm` del navegador): un overlay oscurecido con una tarjeta
centrada, mismo lenguaje visual que el resto de la web (esquinas
redondeadas, sombra), con el texto "¿Seguro que quieres eliminar
'{título}'? Esta acción no se puede deshacer." y dos botones: "Cancelar"
(estilo `btn--ghost`) y "Eliminar" (rojo, `--color-danger`, nuevo
`btn--danger`). Si se confirma, se quita la entrada de
`js/data/projects.js`.

**Decisión explícita:** las imágenes del proyecto (`assets/img/...`) no se
borran del disco al eliminar el proyecto — se quedan huérfanas. Es más
seguro que arriesgarse a borrar el archivo equivocado por un error de
nombre, y no rompe nada si algún día se necesitan recuperar. Si más
adelante se quiere limpiar `assets/img/`, se hace a mano.

## Cómo funciona por dentro

### Lectura (listar, precargar el formulario de edición)

`js/data/projects.js` es un módulo ES real; se importa dinámicamente
(`import('/js/data/projects.js?t=' + Date.now())`) para obtener el array
`projects` ya parseado, sin tocar el texto. Esto sirve tanto para pintar la
tabla como para rellenar el formulario de edición.

### Escritura (añadir, editar, eliminar)

Se sigue escribiendo el archivo entero a través del mismo endpoint que ya
existe, `/__admin/save-projects` (servido por `scripts/admin-server.py`,
que no necesita ningún cambio: sigue exigiendo el hash de la frase de paso
y la presencia de la línea `ANCLA-ADMIN`).

Lo que cambia es cómo se construye el nuevo contenido del archivo en el
cliente, trabajando sobre el **texto fuente** (no sobre el array parseado)
para no reformatear ni perder comentarios de las entradas que no se tocan:

- **Añadir**: sigue igual que ahora — se inserta el nuevo objeto justo
  después de la línea `▲ ANCLA-ADMIN` (`insertProjectIntoSource`, ya
  existe).
- **Editar / Eliminar**: se necesita localizar el bloque de texto exacto
  (`{ ... }`) que corresponde al proyecto con un `id` dado, dentro del
  array. Función nueva `findProjectRange(sourceText, id)`:
  1. Localiza la posición del `id` con las mismas expresiones regulares que
     ya usa `extractExistingIds` (comillas simples o dobles).
  2. Desde ahí, retrocede carácter a carácter contando llaves para
     encontrar la `{` de apertura del objeto que lo contiene.
  3. Desde esa apertura, avanza contando llaves para encontrar la `}` de
     cierre correspondiente, saltándose los caracteres que estén dentro de
     literales de cadena (comillas simples, dobles o backticks, respetando
     el escape `\"`) y dentro de comentarios `/* ... */` o `//`, para que
     un `{` o `}` que aparezca en la descripción de un proyecto no
     descuadre el conteo.
  4. Extiende el rango para incluir una coma final y el salto de línea
     siguiente, si los hay (para no dejar una coma suelta o una línea en
     blanco de más).
  - `replaceProjectInSource(sourceText, id, newObjectSource)`: usa
    `findProjectRange` y sustituye ese tramo por el objeto serializado
    nuevo (reutilizando `formatProjectObjectSource`, ya existente).
  - `removeProjectFromSource(sourceText, id)`: usa `findProjectRange` y
    quita ese tramo entero.
  - Si `findProjectRange` no encuentra el id, lanza un error claro ("no se
    encontró el proyecto X, puede que lo haya modificado otra persona;
    recarga la lista") — igual que ya hace `insertProjectIntoSource` cuando
    no encuentra el ancla.

### Alternar destacado desde la estrella

Un clic en la estrella no abre el formulario de edición: `projectList.js`
coge el proyecto ya importado, construye una copia con `featured` invertido
(`{ ...project, featured: !project.featured }`), lo serializa con
`formatProjectObjectSource` (ya existente) y llama a
`replaceProjectInSource` + `saveProjectsFile`, igual que en una edición
normal pero sin pasar por el formulario. Mientras se guarda, la estrella
muestra un estado deshabilitado breve para evitar dobles clics.

### Mapeo inverso para precargar el formulario de edición

Función nueva `projectToFormValues(project)` en `buildProjectEntry.js`:
convierte un objeto `Project` (tal como sale de `import()`) en los valores
de formulario (arrays `tags`/`categories`/`highlights` vueltos a texto
separado por comas o saltos de línea) — es el inverso de
`buildProjectFromForm`.

## Archivos que se tocan

- **`admin.html`** — nueva sección `#project-list` (tabla); nuevo diálogo
  `#confirm-dialog` (oculto por defecto); se quita el recuadro
  (`admin-card`) de `#project-form`; se añaden los elementos que faltan en
  el formulario para el modo edición (miniatura de imagen actual, enlace
  "Cancelar").
- **`js/admin/main-admin.js`** — orquesta la navegación entre las tres
  pantallas (lista ⇄ formulario) y el modo del formulario (añadir/editar),
  usando un id de "edición en curso" para decidir si se llama a
  `insertProjectIntoSource` o a `replaceProjectInSource`.
- **`js/admin/buildProjectEntry.js`** — añade `findProjectRange`,
  `replaceProjectInSource`, `removeProjectFromSource`,
  `projectToFormValues`. Módulo puro, sin tocar el DOM ni la red — se
  puede seguir probando con `node --test` sin navegador.
- **Nuevo `js/admin/projectList.js`** — importa `projects.js`, ordena por
  fecha, pinta la tabla (o el mensaje de "aún no hay proyectos"), conecta
  los clics de añadir/editar/eliminar/destacar y el diálogo de
  confirmación.
- **`css/admin.css`** — estilos de pantalla completa (sin recuadro), tabla,
  fila-cabecera de la tabla con el botón de añadir, iconos verde/rojo,
  estrella ámbar/gris, diálogo de confirmación (`btn--danger` nuevo).
  Reutiliza tokens que ya existen (`--color-accent`, `--color-success`,
  `--color-danger`, `--color-warning`, `--color-ink-3`); no se define
  ningún color nuevo.

`scripts/admin-server.py` no se toca.

## Pruebas

Se añaden casos a `js/admin/buildProjectEntry.test.js` (o un archivo nuevo
`buildProjectEntry.range.test.js`) cubriendo `findProjectRange` /
`replaceProjectInSource` / `removeProjectFromSource`:

- Encuentra y reemplaza/quita el primer, del medio y el último proyecto del
  array, dejando intactos los demás (incluidos sus comentarios).
- Un proyecto cuya descripción contiene literalmente `{` o `}` no
  descuadra el conteo de llaves.
- Un proyecto con un comentario `/* ... */` dentro del objeto (como el
  `date` de ejemplo actual) tampoco lo descuadra.
- Id inexistente lanza un error claro, sin tocar el archivo.
- `projectToFormValues` es el inverso exacto de `buildProjectFromForm` para
  los campos de tipo lista.
- Una función de ordenación (`sortProjectsByDate` o similar) coloca antes
  el `date` más reciente y manda al final, en su orden original, los
  proyectos sin `date`.

## Fuera de alcance (decisiones explícitas, no ambigüedades)

- No se borran las imágenes de `assets/img/` al eliminar un proyecto.
- El orden de la tabla es automático por fecha; no hay arrastrar-y-soltar
  ni botones de subir/bajar. Para forzar un orden distinto al de la fecha,
  se sigue editando `projects.js` a mano.
