/* ============================================================================
   js/admin/main-admin.js — Punto de entrada del panel de administración.
   QUÉ HACE: conecta las dos pantallas (frase de paso, formulario) y llama a
   localAdmin.js y buildProjectEntry.js para guardar el proyecto nuevo en
   disco a través del servidor local (scripts/admin-server.py).
   QUÉ NO HACE: no valida el formulario ni construye el objeto Project (eso
   es buildProjectEntry.js) y no escribe en disco directamente (eso es
   localAdmin.js, que habla con el servidor local). Este archivo solo
   orquesta.
   ============================================================================ */

import { checkPassphrase, sha256Hex } from './auth.js';
import { fetchProjectsFile, saveProjectsFile, uploadImageFile } from './localAdmin.js';
import {
  slugify,
  extractExistingIds,
  validateProjectForm,
  buildProjectFromForm,
  formatProjectObjectSource,
  insertProjectIntoSource,
} from './buildProjectEntry.js';

const $ = (selector) => document.querySelector(selector);
const MAX_IMAGE_BYTES = 1_000_000;

/* Hash de la frase de paso ya verificada en esta sesión. Solo vive en esta
   variable de módulo (memoria de la pestaña) — nunca se guarda en disco ni
   en localStorage/sessionStorage. Se manda en cada petición al servidor
   local para que él también compruebe que quien escribe tiene permiso. */
let passphraseHash = '';

function log(message) {
  const node = $('#admin-log');
  if (!node) return;
  const line = document.createElement('p');
  line.textContent = message;
  node.appendChild(line);
  node.scrollTop = node.scrollHeight;
}

function clearLog() {
  const node = $('#admin-log');
  if (node) node.replaceChildren();
}

function clearFieldErrors() {
  document.querySelectorAll('#project-form .field').forEach((field) => {
    field.classList.remove('has-error');
    const errorNode = field.querySelector('.field__error');
    if (errorNode) errorNode.textContent = '';
  });
}

function showFieldErrors(errors) {
  clearFieldErrors();
  const idMap = { demo: 'admin-demo', repo: 'admin-repo', caseStudy: 'admin-case-study' };
  for (const [key, message] of Object.entries(errors)) {
    const fieldName = key.startsWith('links.') ? key.split('.')[1] : key;
    const controlId = idMap[fieldName] || `admin-${fieldName}`;
    const control = document.getElementById(controlId);
    const field = control ? control.closest('.field') : null;
    if (field) {
      field.classList.add('has-error');
      const errorNode = field.querySelector('.field__error');
      if (errorNode) errorNode.textContent = message;
    }
  }
}

function readFormValues() {
  return {
    id: $('#admin-id').value,
    title: $('#admin-title').value,
    tagline: $('#admin-tagline').value,
    description: $('#admin-description').value,
    role: $('#admin-role').value,
    year: $('#admin-year').value,
    status: $('#admin-status').value,
    featured: $('#admin-featured').checked,
    tags: $('#admin-tags').value,
    categories: $('#admin-categories').value,
    highlights: $('#admin-highlights').value,
    links: {
      demo: $('#admin-demo').value,
      repo: $('#admin-repo').value,
      caseStudy: $('#admin-case-study').value,
    },
  };
}

function fileExtension(file) {
  const parts = file.name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'webp';
}

function assertFileSize(file, label) {
  if (file && file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `${label} pesa demasiado (${(file.size / 1_000_000).toFixed(1)} MB). Recomprímela por debajo de 1 MB antes de subirla.`
    );
  }
}

/* --- Paso 1: frase de paso --------------------------------------------- */
$('#passphrase-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('#passphrase-input');
  const error = $('#passphrase-error');
  const ok = await checkPassphrase(input.value);
  if (!ok) {
    error.textContent = 'Frase de paso incorrecta.';
    input.value = '';
    input.focus();
    return;
  }
  passphraseHash = await sha256Hex(input.value.trim());
  error.textContent = '';
  $('#gate-passphrase').hidden = true;
  $('#project-form-section').hidden = false;
  $('#admin-title').focus();
});

/* --- Autogenerar el id a partir del título, salvo que se edite a mano --- */
let idEditedByHand = false;
$('#admin-id').addEventListener('input', () => {
  idEditedByHand = true;
});
$('#admin-title').addEventListener('input', (event) => {
  if (idEditedByHand) return;
  $('#admin-id').value = slugify(event.target.value);
});

/* --- Paso 2: publicar el proyecto --------------------------------------- */
$('#project-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearLog();
  clearFieldErrors();

  const submitButton = $('#project-submit');
  const values = readFormValues();

  if (!passphraseHash) {
    log('No se ha verificado la frase de paso. Recarga la página y vuelve a intentarlo.');
    return;
  }

  submitButton.disabled = true;
  try {
    log('Leyendo proyectos existentes…');
    const { content: currentSource } = await fetchProjectsFile();
    const existingIds = extractExistingIds(currentSource);

    const errors = validateProjectForm(values, existingIds);
    if (Object.keys(errors).length > 0) {
      showFieldErrors(errors);
      log('Revisa los campos marcados en rojo antes de publicar.');
      return;
    }

    const coverFile = $('#admin-cover').files[0] || null;
    const galleryFiles = [...$('#admin-gallery').files];
    assertFileSize(coverFile, 'La imagen de portada');
    galleryFiles.forEach((file, index) =>
      assertFileSize(file, `La imagen de galería nº ${index + 1}`)
    );

    const id = values.id.trim();
    let coverPath = '';
    if (coverFile) {
      const filename = `${id}-cover.${fileExtension(coverFile)}`;
      log(`Guardando imagen de portada (assets/img/${filename})…`);
      coverPath = await uploadImageFile(filename, coverFile, passphraseHash);
    }

    const galleryPaths = [];
    for (let i = 0; i < galleryFiles.length; i += 1) {
      const file = galleryFiles[i];
      const filename = `${id}-${i + 1}.${fileExtension(file)}`;
      log(`Guardando imagen de galería ${i + 1} de ${galleryFiles.length}…`);
      const path = await uploadImageFile(filename, file, passphraseHash);
      galleryPaths.push(path);
    }

    const project = buildProjectFromForm(values, coverPath, galleryPaths);
    const objectSource = formatProjectObjectSource(project);
    const newSource = insertProjectIntoSource(currentSource, objectSource);

    log('Guardando js/data/projects.js…');
    await saveProjectsFile(newSource, passphraseHash);

    log('¡Proyecto guardado! Recarga la web para verlo en el portafolio.');
    $('#project-form').reset();
    idEditedByHand = false;
  } catch (error) {
    log(`Error: ${error.message}`);
  } finally {
    submitButton.disabled = false;
  }
});
