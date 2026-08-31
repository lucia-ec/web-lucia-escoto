/* ============================================================================
   js/admin/projectList.js — Tabla del panel "Gestor de proyectos".
   QUÉ HACE: pinta la tabla de proyectos (ordenados por fecha), conecta los
   clics de editar/eliminar/destacar de cada fila, y controla el diálogo de
   confirmación de borrado.
   QUÉ NO HACE: no valida ni construye el objeto Project (eso es
   buildProjectEntry.js) y no sabe hablar con el servidor local más allá de
   leer/guardar el archivo entero (eso es localAdmin.js). No conoce la
   pantalla de formulario — main-admin.js decide qué hacer con los clics de
   editar (`onEdit`) y con el resto de la navegación.
   ============================================================================ */

import {
  sortProjectsByDate,
  formatProjectObjectSource,
  replaceProjectInSource,
  removeProjectFromSource,
} from './buildProjectEntry.js';
import { fetchProjectsFile, saveProjectsFile } from './localAdmin.js';

const STAR_OUTLINE_PATH =
  'm354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z';
const STAR_FILLED_PATH =
  'm233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z';
const EDIT_PATH =
  'M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z';
const DELETE_PATH =
  'M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z';

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function iconSvg(pathData) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);
  return svg;
}

/**
 * Muestra el diálogo de confirmación y resuelve con true/false según lo que
 * elija la usuaria (botón Eliminar, botón Cancelar, clic en el fondo o
 * tecla Escape).
 * @param {HTMLElement} dialog El nodo raíz #confirm-dialog
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function confirmDialog(dialog, message) {
  const backdrop = dialog.querySelector('.confirm-dialog__backdrop');
  const messageNode = dialog.querySelector('#confirm-dialog-message');
  const cancelButton = dialog.querySelector('#confirm-dialog-cancel');
  const confirmButton = dialog.querySelector('#confirm-dialog-confirm');

  messageNode.textContent = message;

  return new Promise((resolve) => {
    function close(result) {
      dialog.classList.remove('is-open');
      dialog.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKeydown, true);
      backdrop.removeEventListener('click', onCancel);
      cancelButton.removeEventListener('click', onCancel);
      confirmButton.removeEventListener('click', onConfirm);
      resolve(result);
    }
    function onCancel() {
      close(false);
    }
    function onConfirm() {
      close(true);
    }
    function onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }

    backdrop.addEventListener('click', onCancel);
    cancelButton.addEventListener('click', onCancel);
    confirmButton.addEventListener('click', onConfirm);
    document.addEventListener('keydown', onKeydown, true);

    dialog.classList.add('is-open');
    dialog.removeAttribute('aria-hidden');
    confirmButton.focus();
  });
}

/**
 * Pinta la tabla de proyectos (ordenados por fecha) y conecta los botones
 * de cada fila. Sustituye por completo las filas de proyecto anteriores;
 * la fila de "Añadir proyecto" (fija en el HTML) no se toca.
 * @param {object} options
 * @param {HTMLElement} options.tableBody
 * @param {HTMLElement} options.emptyMessage
 * @param {object[]} options.projects
 * @param {(project: object) => void} options.onEdit
 * @param {(project: object) => (Promise<void>|void)} options.onDelete
 * @param {(project: object) => (Promise<void>|void)} options.onToggleFeatured
 */
export function renderProjectList({
  tableBody,
  emptyMessage,
  projects,
  onEdit,
  onDelete,
  onToggleFeatured,
}) {
  [...tableBody.querySelectorAll('.project-table__row')].forEach((row) => row.remove());

  const sorted = sortProjectsByDate(projects);
  emptyMessage.hidden = sorted.length > 0;

  sorted.forEach((project) => {
    const row = el('tr', 'project-table__row');

    const titleCell = el('td', 'project-table__title-cell');
    const starButton = el('button', 'icon-btn icon-btn--star');
    starButton.type = 'button';
    starButton.classList.toggle('is-featured', Boolean(project.featured));
    starButton.setAttribute(
      'aria-label',
      project.featured
        ? `Quitar "${project.title}" de destacados`
        : `Destacar "${project.title}"`
    );
    starButton.appendChild(iconSvg(project.featured ? STAR_FILLED_PATH : STAR_OUTLINE_PATH));
    starButton.addEventListener('click', async () => {
      starButton.disabled = true;
      try {
        await onToggleFeatured(project);
      } finally {
        starButton.disabled = false;
      }
    });
    titleCell.appendChild(starButton);
    titleCell.appendChild(document.createTextNode(project.title));
    row.appendChild(titleCell);

    const actionsCell = el('td', 'project-table__actions-cell');

    const editButton = el('button', 'icon-btn icon-btn--edit');
    editButton.type = 'button';
    editButton.setAttribute('aria-label', `Editar "${project.title}"`);
    editButton.appendChild(iconSvg(EDIT_PATH));
    editButton.addEventListener('click', () => onEdit(project));
    actionsCell.appendChild(editButton);

    const deleteButton = el('button', 'icon-btn icon-btn--delete');
    deleteButton.type = 'button';
    deleteButton.setAttribute('aria-label', `Eliminar "${project.title}"`);
    deleteButton.appendChild(iconSvg(DELETE_PATH));
    deleteButton.addEventListener('click', () => onDelete(project));
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);
    tableBody.appendChild(row);
  });
}

/**
 * Invierte el campo `featured` de un proyecto y guarda el archivo.
 * @param {object} project
 * @param {string} passphraseHash
 */
export async function toggleFeatured(project, passphraseHash) {
  const { content: currentSource } = await fetchProjectsFile();
  const updated = { ...project, featured: !project.featured };
  const objectSource = formatProjectObjectSource(updated);
  const newSource = replaceProjectInSource(currentSource, project.id, objectSource);
  await saveProjectsFile(newSource, passphraseHash);
}

/**
 * Quita un proyecto de js/data/projects.js.
 * @param {object} project
 * @param {string} passphraseHash
 */
export async function deleteProject(project, passphraseHash) {
  const { content: currentSource } = await fetchProjectsFile();
  const newSource = removeProjectFromSource(currentSource, project.id);
  await saveProjectsFile(newSource, passphraseHash);
}
