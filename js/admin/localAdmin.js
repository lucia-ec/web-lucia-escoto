/* ============================================================================
   js/admin/localAdmin.js — Cliente del servidor local del panel.
   QUÉ HACE: lee js/data/projects.js y guarda cambios (proyecto nuevo,
   imágenes) hablando con el pequeño servidor local que arranca
   scripts/admin-server.py — el único que puede escribir en el disco. Cada
   petición de escritura lleva el hash de la frase de paso; el servidor la
   vuelve a comprobar por su cuenta antes de guardar nada.
   QUÉ NO HACE: no valida el formulario ni construye el objeto Project (eso
   es buildProjectEntry.js). No sabe nada de GitHub ni de ningún servicio
   externo — todo se queda en este ordenador.
   ============================================================================ */

async function postJson(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    /* respuesta sin cuerpo JSON legible */
  }
  if (!response.ok) {
    throw new Error(
      data.error || `El servidor local respondió con un error (HTTP ${response.status}).`
    );
  }
  return data;
}

/**
 * Lee un archivo de imagen del disco de la usuaria y lo convierte a base64,
 * listo para enviarlo al servidor local.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function base64FromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Descarga el contenido actual de js/data/projects.js tal como está servido
 * ahora mismo (se añade un parámetro para evitar que el navegador devuelva
 * una copia en caché).
 * @returns {Promise<{content: string}>}
 */
export async function fetchProjectsFile() {
  const response = await fetch(`/js/data/projects.js?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(
      'No se pudo leer js/data/projects.js. ¿Está corriendo el servidor local del panel (scripts/admin-server.py)?'
    );
  }
  const content = await response.text();
  return { content };
}

/**
 * Guarda la nueva versión de js/data/projects.js en disco.
 * @param {string} content
 * @param {string} passphraseHash
 */
export async function saveProjectsFile(content, passphraseHash) {
  await postJson('/__admin/save-projects', { content, passphraseHash });
}

/**
 * Sube una imagen y la guarda en assets/img/.
 * @param {string} filename
 * @param {File} file
 * @param {string} passphraseHash
 * @returns {Promise<string>} la ruta relativa (assets/img/...) donde quedó guardada.
 */
export async function uploadImageFile(filename, file, passphraseHash) {
  const base64 = await base64FromFile(file);
  const data = await postJson('/__admin/upload-image', { filename, base64, passphraseHash });
  return data.path;
}
