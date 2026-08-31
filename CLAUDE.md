# Proyecto: web de Lucía Escoto Castro

Sitio estático (HTML + CSS + JS con módulos ES). Sin build, sin dependencias npm.

## Cómo abrirlo

Los módulos ES necesitan servidor (no vale abrir `index.html` con doble clic):

```
python3 -m http.server 8000
# http://localhost:8000/index.html
```

Panel de administración local (añade proyectos y guarda en `js/data/projects.js`):

```
python3 scripts/admin-server.py
# http://localhost:8000/admin.html
```

## Estructura

- `index.html` — página única con todas las secciones (hero, sobre mí, proyectos, dashboard, contacto).
- `admin.html` — panel local para dar de alta proyectos.
- `css/` — hojas en cascada, cargadas en este orden: `reset` → `tokens` → `base` → `layout` → `components` → `sections` → `animations`. Las variables de diseño (color, tipografía, espaciado) están en `tokens.css`.
- `js/main.js` — punto de entrada; inicializa los módulos.
- `js/data/projects.js` — fuente de datos de los proyectos (`projects`, `categoryLabels`). Contiene el ancla `▲ ANCLA-ADMIN`, que usa el panel para insertar entradas nuevas: no borrar esa línea.
- `js/modules/` — `renderProjects`, `filters`, `dashboard`, `modal`, `scrollReveal`, `navigation`.
- `js/admin/` — lógica del panel, con tests (`node --test js/admin/`).
- `assets/img`, `assets/icons`, `assets/video` — recursos. `media/mascota.mp4` está sin usar.
- `snapshots/` — variantes anteriores del hero, guardadas como referencia.

## Estado actual

- El hero es un SVG de ondas animadas con efecto tipo LED (`css/animations.css`); las variantes en imagen y en vídeo están en `snapshots/`.
- En la sección de contacto hay un hueco marcado con `data-placeholder="mascota"` (`.contact-mascota--placeholder` en `css/sections.css`) a la espera de la mascota definitiva. El vídeo de prueba está en `media/mascota.mp4`.
- Los enlaces de contacto apuntan a github.com/lucia-ec; el de LinkedIn sigue con un usuario de ejemplo (`USUARIO-LINKEDIN`) pendiente de sustituir, igual que en los datos estructurados de `index.html`.

## Convenciones

- Nomenclatura BEM en las clases (`bloque__elemento--modificador`).
- Comentarios y textos en español.
- Sin librerías externas: iconos SVG en línea, gráficos del dashboard construidos a mano con SVG.
