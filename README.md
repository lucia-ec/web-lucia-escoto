# Web personal — Lucía Escoto Castro

## Panel de administración (añadir proyectos sin editar código)

En `admin.html` hay un panel para añadir proyectos desde un formulario. Todo
se queda en tu ordenador: no hace falta cuenta de GitHub, ni repositorio, ni
publicar nada en internet. El panel guarda los cambios directamente en tus
propios archivos (`js/data/projects.js` y las imágenes en `assets/img/`).

### Cómo arrancarlo

El panel necesita un servidor especial, distinto del `python3 -m
http.server` normal, porque además de servir la web tiene que poder
**escribir** archivos cuando publicas un proyecto. Desde la carpeta del
proyecto:

```bash
python3 scripts/admin-server.py
```

Y abre <http://localhost:4180/admin.html>. Este mismo servidor también sirve
la web normal en <http://localhost:4180/>, así que para trabajar en el
proyecto no hace falta arrancar nada más.

### Cada vez que lo uses

1. Escribe la frase de paso que te dieron al construir este panel. Si la
   pierdes, pide que se genere una nueva (implica cambiar un valor en
   `js/admin/auth.js` y en `scripts/admin-server.py`, tienen que coincidir).
2. Rellena el formulario. El identificador (id) se autorrellena desde el
   título, pero puedes editarlo.
3. En "Fotos del proyecto", adjunta la imagen de portada y, si quieres,
   más fotos de galería.
4. En "Enlaces", pon como mínimo el enlace a GitHub del proyecto (el
   repositorio donde vive su código de verdad — esta web nunca guarda el
   código, solo el enlace y las capturas).
5. Pulsa "Publicar proyecto". En un segundo queda guardado en disco; recarga
   la web para verlo en el portafolio.

### Qué tan seguro es esto, en realidad

- El servidor (`scripts/admin-server.py`) solo escucha en `127.0.0.1` — tu
  propio ordenador. Ningún otro dispositivo de tu red, ni internet, puede
  alcanzarlo.
- La frase de paso ahora sí la comprueba el servidor, no solo el navegador:
  cada vez que el panel guarda algo, manda el hash de la frase de paso y el
  servidor lo verifica antes de escribir ningún archivo. Sin el hash
  correcto, rechaza la petición.
- Sigue sin ser una caja fuerte inexpugnable (el hash está en el código, y
  alguien muy decidido podría intentar romperlo sin conexión), pero la
  protección real, en la práctica, es que el servidor solo corre en tu
  ordenador: quien no tenga acceso físico a tu máquina no puede llegar a él.
- El panel solo **añade** proyectos. Para editar o borrar uno ya existente,
  sigue editando `js/data/projects.js` a mano, como antes.

### Publicar la web en internet más adelante

Esto es un paso aparte, cuando decidas hacerlo — el panel de administración
no depende de ello ni lo necesita para funcionar en tu ordenador. Cuando
quieras que la web sea pública (por ejemplo con GitHub Pages), es tan
sencillo como subir esta carpeta tal cual a un repositorio; el panel se
queda funcionando igual en local para seguir añadiendo proyectos después.
