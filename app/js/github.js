// Lectura y guardado de datos/continuidades.json con la API de GitHub.
// El token solo se guarda en el localStorage de este dispositivo.

import { aBase64, deBase64, aJson } from './datos.js?v=1.3';

// Repositorio: se deduce de la dirección de GitHub Pages (usuario.github.io/repositorio/).
// Si la app se abre desde otro sitio (por ejemplo, en local), se usan estos valores.
const REPO_POR_DEFECTO = { owner: 'cjgaland', repo: 'control-continuidades' };
const RAMA = 'main';
const RUTA = 'datos/continuidades.json';
const API = 'https://api.github.com';
const CLAVE_TOKEN = 'continuidades.token';

export function repositorio() {
  const { hostname, pathname } = location;
  if (hostname.endsWith('.github.io')) {
    const owner = hostname.split('.')[0];
    const repo = pathname.split('/').filter(Boolean)[0];
    if (repo) return { owner, repo };
  }
  return REPO_POR_DEFECTO;
}

export function leerToken() {
  try { return localStorage.getItem(CLAVE_TOKEN) || null; } catch { return null; }
}

export function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token.trim());
}

export function olvidarToken() {
  try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* nada */ }
}

export class ErrorConflicto extends Error {
  constructor() {
    super('Los datos han cambiado en GitHub desde que los cargaste (quizá desde otro dispositivo). '
      + 'Se han recargado los datos nuevos y no se ha sobrescrito nada. Revisa el mes y vuelve a guardar.');
    this.name = 'ErrorConflicto';
  }
}

async function peticion(ruta, token, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (r.status === 409 || (r.status === 422 && opciones.method === 'PUT')) throw new ErrorConflicto();
  if (r.status === 401) throw new Error('El token no es válido o ha caducado. Revísalo en Ajustes.');
  if (r.status === 403) throw new Error('El token no tiene permiso para esto (hace falta «Contents: Read and write»).');
  if (r.status === 404) throw new Error('No se encuentra el repositorio o el archivo. ¿El token tiene acceso a este repositorio?');
  if (!r.ok) throw new Error(`GitHub ha respondido con un error (${r.status}).`);
  return r.json();
}

// Devuelve { datos, sha } del archivo tal y como está ahora en GitHub.
export async function leerDatos(token) {
  const { owner, repo } = repositorio();
  const j = await peticion(`/repos/${owner}/${repo}/contents/${RUTA}?ref=${RAMA}&t=${Date.now()}`, token);
  return { datos: JSON.parse(deBase64(j.content)), sha: j.sha };
}

// Guarda solo si el archivo sigue siendo el que se cargó (mismo sha). Devuelve el sha nuevo.
export async function guardarDatos(token, datos, shaCargado, mensaje) {
  const { owner, repo } = repositorio();
  const actual = await leerDatos(token);
  if (actual.sha !== shaCargado) throw new ErrorConflicto();
  const j = await peticion(`/repos/${owner}/${repo}/contents/${RUTA}`, token, {
    method: 'PUT',
    body: JSON.stringify({ message: mensaje, content: aBase64(aJson(datos)), sha: shaCargado, branch: RAMA }),
  });
  return j.content.sha;
}

// Comprueba que el token puede escribir en el repositorio.
export async function comprobarToken(token) {
  const { owner, repo } = repositorio();
  const j = await peticion(`/repos/${owner}/${repo}`, token);
  if (!j.permissions?.push) throw new Error('El token puede leer el repositorio, pero no escribir. Dale el permiso «Contents: Read and write».');
  return `${owner}/${repo}`;
}
