import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aplicarMes, mensajeCommit, validarMes, aJson, aBase64, deBase64 } from '../app/js/datos.js';
import { acumuladoTotal } from '../app/js/calculo.js';

const datos = JSON.parse(readFileSync(new URL('../datos/continuidades.json', import.meta.url)));
const HOY = new Date(2026, 9, 16);

test('Alta de un mes nuevo: queda en orden y no toca el original', () => {
  const nuevo = aplicarMes(datos, '2026-12', {
    rafa: { dias: [15, 2], ausencia: null, abonado: false },
    carlos: { dias: [], ausencia: null, abonado: false },
  }, HOY);
  assert.deepEqual(nuevo.meses['2026-12'], { rafa: { dias: [2, 15], ausencia: null, abonado: false } });
  assert.equal(Object.keys(nuevo.meses).at(-1), '2026-12');
  assert.equal(datos.meses['2026-12'], undefined);
  assert.equal(nuevo.actualizado, '2026-10-16');
});

test('Cambiar un mes no altera las cifras de control de los demás', () => {
  const nuevo = aplicarMes(datos, '2026-11', datos.meses['2026-11'], HOY);
  assert.equal(acumuladoTotal(nuevo, '2026-10', 'rafa', '2026-10-16'), 60);
});

test('Un mes sin nada se elimina', () => {
  const nuevo = aplicarMes(datos, '2026-11', { rafa: { dias: [] }, carlos: { dias: [] } }, HOY);
  assert.equal(nuevo.meses['2026-11'], undefined);
});

test('Mensaje del commit', () => {
  assert.equal(mensajeCommit(datos, '2026-12'), 'Datos: alta diciembre 2026');
  assert.equal(mensajeCommit(datos, '2026-11'), 'Datos: cambio noviembre 2026');
});

test('Validación del mes por persona', () => {
  const e = validarMes('2026-11', { rafa: { dias: [31] }, carlos: { dias: [4, 4] } });
  assert.match(e.rafa[0], /no existe/);
  assert.match(e.carlos[0], /repetido/);
});

test('Base64 UTF-8 ida y vuelta (con acentos)', () => {
  const texto = aJson({ nota: 'Débito acumulado — Galán' });
  assert.equal(deBase64(aBase64(texto)), texto);
  assert.equal(aBase64('á'), 'w6E=');
});
