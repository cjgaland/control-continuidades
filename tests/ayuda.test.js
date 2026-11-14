import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { manualDisponible, rutaManual, RUTA_MANUAL_CONSULTA, RUTA_MANUAL_EDICION } from '../app/js/ayuda.js';

const respuesta = (ok, tipo) => ({ ok, headers: { get: () => tipo } });

test('el manual de edición solo se ofrece en Modo edición', () => {
  assert.equal(rutaManual(false), RUTA_MANUAL_CONSULTA);
  assert.equal(rutaManual(true), RUTA_MANUAL_EDICION);
  assert.notEqual(RUTA_MANUAL_CONSULTA, RUTA_MANUAL_EDICION);
});

test('las rutas son relativas (valen en GitHub Pages) y apuntan a PDF', () => {
  for (const r of [RUTA_MANUAL_CONSULTA, RUTA_MANUAL_EDICION]) {
    assert.ok(!r.startsWith('/') && !r.includes('://'), r);
    assert.match(r, /^ayuda\/.+\.pdf$/);
  }
});

test('manual disponible: existe y es un PDF', async () => {
  const pedir = async (ruta, op) => { assert.equal(ruta, RUTA_MANUAL_CONSULTA); assert.equal(op.method, 'HEAD'); return respuesta(true, 'application/pdf'); };
  assert.equal(await manualDisponible(RUTA_MANUAL_CONSULTA, pedir), true);
});

test('manual no disponible: 404, HTML o sin conexión', async () => {
  assert.equal(await manualDisponible(RUTA_MANUAL_CONSULTA, async () => respuesta(false, 'text/html')), false);
  assert.equal(await manualDisponible(RUTA_MANUAL_CONSULTA, async () => respuesta(true, 'text/html; charset=utf-8')), false);
  assert.equal(await manualDisponible(RUTA_MANUAL_CONSULTA, async () => { throw new TypeError('Failed to fetch'); }), false);
});

test('los PDF de los manuales están en app/ayuda', () => {
  for (const r of [RUTA_MANUAL_CONSULTA, RUTA_MANUAL_EDICION]) {
    assert.ok(existsSync(new URL(`../app/${r}`, import.meta.url)), `falta app/${r}`);
  }
});
