# Panel de administración para añadir proyectos — Diseño

Fecha: 2026-07-28
Estado: Aprobado

## Objetivo

Permitir a Lucía añadir un proyecto nuevo al portafolio desde un formulario en
el navegador, sin editar `js/data/projects.js` a mano, publicando el cambio
directamente en GitHub para que aparezca en la web en vivo.

## Modelo de seguridad

Dos capas, con responsabilidades distintas:

1. **Frase de paso** (generada por Claude, aleatoria y fuerte). Se compara su
   hash SHA-256 en el navegador; el texto en claro nunca aparece en el código
   fuente publicado. Es un filtro contra la ojeada casual, **no** una
   protección criptográfica robusta: no hay límite de intentos ni salado,
   porque no hay servidor que los aplique. No se persiste entre visitas: se
   pide en cada carga de la página.

2. **Token personal de GitHub** (generado por la usuaria desde su cuenta,
   cuando vaya a usar el panel). Esta es la protección real, porque la
   gestiona GitHub. Se pega en el panel en cada sesión de uso, se guarda solo
   en `sessionStorage` (memoria de esa pestaña) y desaparece al cerrarla.
   Nunca se escribe en ningún archivo del repositorio ni se envía a nada que
   no sea `https://api.github.com`.

   Recomendación documentada en el README: token de grano fino (*fine-grained
   personal access token*), con acceso limitado a este único repositorio,
   permiso `Contents: Read and write`, y fecha de caducidad.

## Arquitectura y archivos nuevos

```
/admin.html                       Panel. <meta name="robots" content="noindex, nofollow">.
                                   No enlazado desde index.html ni desde el footer.
/css/admin.css                    Estilos del panel. Reutiliza reset.css, tokens.css, base.css.
/js/admin/
  ├── main-admin.js               Punto de entrada. Orquesta el resto de módulos del panel.
  ├── auth.js                     Pantalla de frase de paso: hash SHA-256 con SubtleCrypto.
  ├── github.js                   Cliente mínimo de la API de GitHub (Contents API).
  ├── buildProjectEntry.js        Convierte los datos del formulario en un objeto Project válido
  │                                y en el texto JS formateado que se inserta en projects.js.
  └── config.js                   { owner, repo, branch }. No es secreto: se rellena a mano
                                   una vez creado el repositorio real.
```

Se añade una línea marcadora en `js/data/projects.js`, inmediatamente después
de `export const projects = [`:

```js
export const projects = [
  /* ▲ ANCLA-ADMIN: no borrar esta línea, el panel inserta aquí los proyectos nuevos. */
```

El panel busca ese texto literal para saber dónde insertar el objeto nuevo. Si
la usuaria reformatea el archivo a mano pero conserva la línea, el panel sigue
funcionando; si la borra, el panel lo detecta y muestra un error explicando
qué ha pasado, en vez de fallar en silencio o corromper el archivo.

## Flujo de publicación

1. La usuaria abre `admin.html`, escribe la frase de paso. Si el hash no
   coincide, error y no se muestra el formulario.
2. Pega su token de GitHub en un campo tipo `password`. Se guarda en
   `sessionStorage` para no tener que pegarlo de nuevo si añade varios
   proyectos en la misma sesión. Botón "Olvidar token" lo borra a mano.
3. Rellena el formulario (mismos campos que el esquema `Project` de
   `projects.js`: id, title, tagline, description, role, year, status,
   featured, tags, categories, imagen de portada, galería, highlights,
   enlaces). Validación en cliente equivalente a la del formulario de
   contacto existente: campos obligatorios, formato de URL en los enlaces.
4. Al enviar:
   a. `github.js` descarga `js/data/projects.js` actual (`GET
      /repos/{owner}/{repo}/contents/js/data/projects.js`) y comprueba que el
      `id` introducido no exista ya en el array. Si existe, error, no se
      publica nada.
   b. Si hay imagen de portada y/o galería, se codifican en base64 y se suben
      con `PUT /repos/{owner}/{repo}/contents/assets/img/{archivo}`, un
      commit por archivo.
   c. `buildProjectEntry.js` genera el texto del objeto nuevo con el mismo
      estilo del archivo (comillas simples, indentado de 2 espacios, coma
      final) y lo inserta justo después de la línea ancla.
   d. Se sube el `projects.js` modificado con `PUT
      /repos/{owner}/{repo}/contents/js/data/projects.js`, incluyendo el
      `sha` del archivo obtenido en el paso (a) — es el mecanismo de GitHub
      para evitar sobrescribir un cambio concurrente.
   e. Mensaje de commit: `Añade proyecto: <title>`.
5. Confirmación en el panel con enlace directo al commit en GitHub, y aviso
   de que la web tarda 1-2 minutos en reconstruirse.

Se hace commit directo a la rama configurada en `config.js` (por defecto
`main`). No hay flujo de *pull request* porque solo hay una usuaria.

## Manejo de errores

Mensajes específicos y visibles en el panel (no solo en consola) para:
frase de paso incorrecta; token ausente, inválido o sin permisos suficientes
(HTTP 401/403); `id` de proyecto duplicado; campos obligatorios vacíos; fallo
de red o de la API de GitHub (incluye el mensaje que devuelve GitHub cuando
está disponible); línea ancla no encontrada en `projects.js`.

Cada llamada a la API de GitHub se hace de forma secuencial, no en paralelo,
para poder informar en qué paso ha fallado exactamente si algo sale mal (por
ejemplo: "la imagen se subió correctamente, pero no se pudo actualizar
projects.js: ..."), en vez de dejar el repositorio en un estado a medias sin
explicación.

## Fuera de alcance

Solo **añadir** proyectos. Editar o eliminar un proyecto existente se sigue
haciendo a mano en `projects.js`. Ampliable más adelante si hace falta.

No se implementa límite de intentos para la frase de paso (sería seguridad
aparente sin un servidor que lo haga cumplir).

## Pruebas

La construcción del objeto (`buildProjectEntry.js`), la validación del
formulario y la verificación de la frase de paso se pueden probar en el
navegador sin repositorio real. La llamada real a la API de GitHub (subida de
imagen + commit de `projects.js`) requiere que la usuaria tenga ya el
repositorio creado en GitHub y un token válido; se verifica de forma guiada
la primera vez que lo use.
