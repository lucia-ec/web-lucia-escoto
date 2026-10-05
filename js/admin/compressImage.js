/* ============================================================================
   js/admin/compressImage.js — Reduce una imagen por debajo del límite de peso.
   QUÉ HACE: si la imagen pesa más que maxBytes, la redibuja en un <canvas>
   (bajando el tamaño y la calidad poco a poco) hasta que cabe. Prefiere WebP;
   si el navegador no sabe codificarlo, usa JPEG sobre fondo blanco.
   QUÉ NO HACE: no toca las imágenes que ya caben, ni los GIF (perderían la
   animación): esos se devuelven tal cual y el panel avisa del peso.
   ============================================================================ */

const MAX_SIDE_STEPS = [2400, 1920, 1600, 1280, 1024];
const QUALITY_STEPS = [0.88, 0.8, 0.7, 0.6, 0.5];

function loadBitmap(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`No se pudo leer la imagen "${file.name}".`));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * @param {File} file
 * @param {number} maxBytes
 * @returns {Promise<File>} el mismo archivo si ya cabe; si no, uno comprimido.
 */
export async function compressImageToLimit(file, maxBytes) {
  if (!file || file.size <= maxBytes || file.type === 'image/gif') return file;

  const img = await loadBitmap(file);
  const baseName = file.name.replace(/\.[^.]+$/, '');

  for (const maxSide of MAX_SIDE_STEPS) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');

    for (const quality of QUALITY_STEPS) {
      let blob = await canvasToBlob(canvas, 'image/webp', quality);
      let ext = 'webp';
      if (!blob || blob.type !== 'image/webp') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        blob = await canvasToBlob(canvas, 'image/jpeg', quality);
        ext = 'jpg';
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Se vuelve a codificar ya con la imagen dibujada (el primer intento
      // solo sirvió para saber qué formato admite el navegador).
      blob = await canvasToBlob(canvas, ext === 'webp' ? 'image/webp' : 'image/jpeg', quality);
      if (blob && blob.size <= maxBytes) {
        return new File([blob], `${baseName}.${ext}`, { type: blob.type });
      }
    }
  }
  return file;
}
