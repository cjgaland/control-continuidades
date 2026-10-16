// Cambios sobre el JSON de datos (sin nada de interfaz ni de red).

import { NOMBRES_MES, partirClave, validarRegistro } from './calculo.js?v=1.2';

function registroVacio(r) {
  return !r || ((r.dias ?? []).length === 0 && !r.ausencia && !r.abonado);
}

function limpiar(r) {
  return {
    dias: [...(r.dias ?? [])].sort((a, b) => a - b),
    ausencia: r.ausencia || null,
    abonado: r.abonado === true,
  };
}

// Devuelve los errores de los dos registros del mes ({ rafa: [...], carlos: [...] }).
export function validarMes(clave, registros) {
  const { anio, mes } = partirClave(clave);
  const errores = {};
  for (const [p, r] of Object.entries(registros)) errores[p] = validarRegistro(anio, mes, r);
  return errores;
}

// Devuelve una copia de "datos" con el mes "clave" sustituido por "registros".
// Los registros vacíos se quitan y los meses quedan en orden cronológico.
export function aplicarMes(datos, clave, registros, hoy = new Date()) {
  const nuevo = structuredClone(datos);
  const mes = {};
  for (const [p, r] of Object.entries(registros)) if (!registroVacio(r)) mes[p] = limpiar(r);
  const meses = { ...nuevo.meses };
  if (Object.keys(mes).length) meses[clave] = mes;
  else delete meses[clave];
  nuevo.meses = Object.fromEntries(Object.keys(meses).sort().map((c) => [c, meses[c]]));
  nuevo.actualizado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return nuevo;
}

// "Datos: alta noviembre 2026" o "Datos: cambio noviembre 2026"
export function mensajeCommit(datosAntes, clave) {
  const { anio, mes } = partirClave(clave);
  const tipo = datosAntes?.meses?.[clave] ? 'cambio' : 'alta';
  return `Datos: ${tipo} ${NOMBRES_MES[mes - 1].toLowerCase()} ${anio}`;
}

export function aJson(datos) {
  return `${JSON.stringify(datos, null, 2)}\n`;
}

// Base64 de texto UTF-8 (lo que pide la API de GitHub) y al revés.
export function aBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function deBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
