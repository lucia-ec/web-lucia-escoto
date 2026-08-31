/* ============================================================================
   js/admin/auth.js — Verificación de la frase de paso del panel de administración.
   QUÉ HACE: calcula el hash SHA-256 de lo que escribe la usuaria y lo compara
   con el hash guardado en PASSPHRASE_HASH. El texto en claro de la frase de
   paso no aparece en este archivo ni en ningún otro del repositorio.
   QUÉ NO HACE: no es una protección criptográfica robusta por sí sola — no hay
   límite de intentos ni salado, porque no hay servidor que los haga cumplir.
   La protección real es el token personal de GitHub (ver github.js): esta
   frase de paso es solo un filtro contra la ojeada casual.
   ============================================================================ */

// Hash SHA-256 en hexadecimal de la frase de paso real. Se sustituye por el
// valor definitivo en el último paso de la construcción del panel; hasta
// entonces ninguna frase de paso lo verificará correctamente.
export const PASSPHRASE_HASH =
  '602130f7df2dffe5649ba6f4eaa3d3f498bec68f22cd19e72a641410f3e7d782';

/**
 * Calcula el hash SHA-256 en hexadecimal de un texto.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Comprueba si el texto introducido coincide con la frase de paso configurada.
 * @param {string} input
 * @returns {Promise<boolean>}
 */
export async function checkPassphrase(input) {
  const hash = await sha256Hex((input || '').trim());
  return hash === PASSPHRASE_HASH;
}
