# Web personal — Lucía Escoto Castro

Portafolio personal de Lucía Escoto Castro, Desarrolladora de Aplicaciones
Multiplataforma. Es una web estática (sin frameworks, sin backend real): se
publica tal cual en un sitio como GitHub Pages, y muestra los proyectos,
las tecnologías usadas y una forma de contacto.

Va acompañada de un panel de administración de uso exclusivamente local,
pensado para que Lucía pueda añadir, editar y borrar proyectos del
portafolio sin tener que tocar código a mano.

## En qué consiste el proyecto

Dos piezas conviven en el mismo repositorio:

1. **La web pública** (`index.html`) — lo que ve cualquier visitante:
   presentación, catálogo de proyectos con filtros y un pequeño panel de
   estadísticas (cuántos proyectos, tecnologías y categorías hay), y un
   formulario de contacto. Se aloja tal cual en GitHub Pages; no necesita
   ningún servidor propio para funcionar una vez publicada.

2. **El panel de administración** (`admin.html`) — una herramienta privada,
   que solo funciona en el ordenador de Lucía, para gestionar el contenido
   de los proyectos (añadir nuevos, editar los existentes, marcarlos como
   destacados o borrarlos) sin editar el código fuente. Va protegido con
   una frase de paso y nunca se ejecuta en internet: es exclusivamente para
   uso personal, no para visitantes de la web.

## Partes del proyecto

```
index.html          → la web pública
admin.html           → el panel de administración (uso local)
scripts/
  admin-server.py     → servidor local que hace funcionar el panel
                        (sirve las páginas y guarda los cambios en disco)
js/
  main.js             → arranca la web pública
  data/projects.js    → los datos de todos los proyectos del portafolio
  modules/            → piezas de la web pública (filtros, galería con
                        zoom, panel de estadísticas, navegación, etc.)
  admin/              → toda la lógica del panel de administración
  vendor/             → Flatpickr, la única librería externa que se usa
                        (selector de fechas del panel), guardada en el
                        propio proyecto
css/
  tokens.css          → colores, tipografía y espaciados de toda la web
  base.css, layout.css, components.css, sections.css, animations.css
                      → estilos de la web pública, organizados por capas
  admin.css           → estilos exclusivos del panel de administración
  vendor/             → estilos de Flatpickr
assets/
  img/, icons/         → imágenes e iconos usados en la web pública
```

## Qué uso se le va a dar

- La web pública se publica en internet (GitHub Pages) para que cualquiera
  pueda ver el portafolio de proyectos.
- El panel de administración es una herramienta de trabajo diario: cada vez
  que Lucía termina un proyecto nuevo, lo da de alta ahí (título,
  descripción, tecnologías, fotos y enlaces), y los cambios quedan
  guardados en los propios archivos del repositorio (`js/data/projects.js`
  y las imágenes en `assets/img/`). Después, para que esos cambios se vean
  también en la web pública, hace falta subirlos a GitHub (el panel no
  publica nada por sí mismo; solo modifica los archivos locales).
- El panel corre siempre en local (`http://localhost:4180`) y nunca se
  expone a internet: eso es justo lo que lo mantiene privado, aunque el
  código del proyecto sea público en GitHub.
