/* ============================================================================
   js/admin/main-admin.js — Punto de entrada del panel de administración.
   QUÉ HACE: conecta las tres pantallas (frase de paso, lista de proyectos,
   formulario de añadir/editar) y llama a projectList.js, localAdmin.js y
   buildProjectEntry.js para leer y guardar los proyectos en disco a través
   del servidor local (scripts/admin-server.py).
   QUÉ NO HACE: no valida el formulario ni construye el objeto Project (eso
   es buildProjectEntry.js), no pinta la tabla ni el diálogo de confirmación
   (eso es projectList.js) y no escribe en disco directamente (eso es
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
  replaceProjectInSource,
  projectToFormValues,
  mergeEditedProject,
} from './buildProjectEntry.js';
import { renderProjectList, confirmDialog, toggleFeatured, deleteProject } from './projectList.js';

const $ = (selector) => document.querySelector(selector);
const MAX_IMAGE_BYTES = 1_000_000;

/* Hash de la frase de paso ya verificada en esta sesión. Solo vive en esta
   variable de módulo (memoria de la pestaña) — nunca se guarda en disco ni
   en localStorage/sessionStorage. Se manda en cada petición al servidor
   local para que él también compruebe que quien escribe tiene permiso. */
let passphraseHash = '';

/* null = modo "añadir"; objeto Project = modo "editar" (guarda los datos
   originales, incluidas las rutas de portada/galería, para conservarlas si
   no se sube una imagen nueva). */
let editingProject = null;

/* Si se ha tocado el campo id a mano, dejar de regenerarlo a partir del
   título. En modo edición se marca como "tocado" desde el principio, para
   no reescribir el id existente solo por rellenar el título. */
let idEditedByHand = false;

const screens = {
  gate: $('#gate-passphrase'),
  list: $('#project-list-section'),
  form: $('#project-form-section'),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => {
    node.hidden = key !== name;
  });
}

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

/* ---------------------------------------------------------------------
   Lista de proyectos
   --------------------------------------------------------------------- */
async function refreshList() {
  const module = await import(`/js/data/projects.js?t=${Date.now()}`);
  renderProjectList({
    tableBody: $('#project-table-body'),
    emptyMessage: $('#project-table-empty'),
    projects: module.projects,
    onEdit: openEditForm,
    onDelete: handleDelete,
    onToggleFeatured: handleToggleFeatured,
  });
}

async function handleDelete(project) {
  const ok = await confirmDialog(
    $('#confirm-dialog'),
    `¿Seguro que quieres eliminar "${project.title}"? Esta acción no se puede deshacer.`
  );
  if (!ok) return;
  try {
    await deleteProject(project, passphraseHash);
    await refreshList();
  } catch (error) {
    window.alert(`No se pudo eliminar "${project.title}": ${error.message}`);
  }
}

async function handleToggleFeatured(project) {
  try {
    await toggleFeatured(project, passphraseHash);
    await refreshList();
  } catch (error) {
    window.alert(`No se pudo actualizar "${project.title}": ${error.message}`);
  }
}

/* ---------------------------------------------------------------------
   Formulario: modo añadir / modo editar
   --------------------------------------------------------------------- */
function resetFormToAddMode() {
  editingProject = null;
  idEditedByHand = false;
  $('#project-form').reset();
  $('#admin-editing-id').value = '';
  $('#project-form-title').textContent = 'Añadir proyecto';
  const submitButton = $('#project-submit');
  submitButton.textContent = 'Publicar proyecto';
  submitButton.classList.remove('btn--success');
  submitButton.classList.add('btn--primary');
  $('#admin-cover-current').hidden = true;
  const galleryCurrent = $('#admin-gallery-current');
  galleryCurrent.querySelectorAll('img').forEach((img) => img.remove());
  galleryCurrent.hidden = true;
}

function openAddForm() {
  resetFormToAddMode();
  clearLog();
  clearFieldErrors();
  showScreen('form');
  $('#admin-title').focus();
}

function openEditForm(project) {
  editingProject = project;
  idEditedByHand = true;
  clearLog();
  clearFieldErrors();

  const values = projectToFormValues(project);
  $('#admin-editing-id').value = project.id;
  $('#admin-title').value = values.title;
  $('#admin-id').value = values.id;
  $('#admin-tagline').value = values.tagline;
  $('#admin-description').value = values.description;
  $('#admin-role').value = values.role;
  $('#admin-year').value = values.year;
  $('#admin-status').value = values.status;
  $('#admin-featured').checked = values.featured;
  $('#admin-tags').value = values.tags;
  $('#admin-categories').value = values.categories;
  $('#admin-highlights').value = values.highlights;
  $('#admin-demo').value = values.links.demo;
  $('#admin-repo').value = values.links.repo;
  $('#admin-case-study').value = values.links.caseStudy;

  const coverCurrent = $('#admin-cover-current');
  if (project.cover) {
    $('#admin-cover-current-img').src = project.cover;
    coverCurrent.hidden = false;
  } else {
    coverCurrent.hidden = true;
  }

  const galleryCurrent = $('#admin-gallery-current');
  galleryCurrent.querySelectorAll('img').forEach((img) => img.remove());
  if (Array.isArray(project.gallery) && project.gallery.length > 0) {
    project.gallery.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      galleryCurrent.insertBefore(img, galleryCurrent.firstChild);
    });
    galleryCurrent.hidden = false;
  } else {
    galleryCurrent.hidden = true;
  }

  $('#project-form-title').textContent = 'Editar proyecto';
  const submitButton = $('#project-submit');
  submitButton.textContent = 'Guardar cambios';
  submitButton.classList.remove('btn--primary');
  submitButton.classList.add('btn--success');

  showScreen('form');
  $('#admin-title').focus();
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
  showScreen('list');
  await refreshList();
});

/* --- Navegación entre la lista y el formulario -------------------------- */
$('#add-project-button').addEventListener('click', openAddForm);
$('#cancel-form-link').addEventListener('click', (event) => {
  event.preventDefault();
  showScreen('list');
});

/* --- Autogenerar el id a partir del título, salvo que se edite a mano --- */
$('#admin-id').addEventListener('input', () => {
  idEditedByHand = true;
});
$('#admin-title').addEventListener('input', (event) => {
  if (idEditedByHand) return;
  $('#admin-id').value = slugify(event.target.value);
});

/* --- Paso 2: publicar (añadir) o guardar cambios (editar) --------------- */
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
    if (editingProject) existingIds.delete(editingProject.id);

    const errors = validateProjectForm(values, existingIds);
    if (Object.keys(errors).length > 0) {
      showFieldErrors(errors);
      log('Revisa los campos marcados en rojo antes de guardar.');
      return;
    }

    const coverFile = $('#admin-cover').files[0] || null;
    const galleryFiles = [...$('#admin-gallery').files];
    assertFileSize(coverFile, 'La imagen de portada');
    galleryFiles.forEach((file, index) =>
      assertFileSize(file, `La imagen de galería nº ${index + 1}`)
    );

    const id = values.id.trim();
    let coverPath = editingProject ? editingProject.cover || '' : '';
    if (coverFile) {
      const filename = `${id}-cover.${fileExtension(coverFile)}`;
      log(`Guardando imagen de portada (assets/img/${filename})…`);
      coverPath = await uploadImageFile(filename, coverFile, passphraseHash);
    }

    let galleryPaths = editingProject ? editingProject.gallery || [] : [];
    if (galleryFiles.length > 0) {
      galleryPaths = [];
      for (let i = 0; i < galleryFiles.length; i += 1) {
        const file = galleryFiles[i];
        const filename = `${id}-${i + 1}.${fileExtension(file)}`;
        log(`Guardando imagen de galería ${i + 1} de ${galleryFiles.length}…`);
        const path = await uploadImageFile(filename, file, passphraseHash);
        galleryPaths.push(path);
      }
    }

    const project = editingProject
      ? mergeEditedProject(editingProject, values, coverPath, galleryPaths)
      : buildProjectFromForm(values, coverPath, galleryPaths);
    const objectSource = formatProjectObjectSource(project);

    let newSource;
    if (editingProject) {
      log('Actualizando js/data/projects.js…');
      newSource = replaceProjectInSource(currentSource, editingProject.id, objectSource);
    } else {
      log('Guardando js/data/projects.js…');
      newSource = insertProjectIntoSource(currentSource, objectSource);
    }
    await saveProjectsFile(newSource, passphraseHash);

    log(editingProject ? '¡Cambios guardados!' : '¡Proyecto guardado!');
    await refreshList();
    showScreen('list');
  } catch (error) {
    log(`Error: ${error.message}`);
  } finally {
    submitButton.disabled = false;
  }
});
