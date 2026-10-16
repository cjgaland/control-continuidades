// Cifras de control de docs/reglas-de-calculo.md (fecha de hoy: 16-10-2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  debitoMensual, debitoAnual, acumuladoTotal, acumuladoAnio, abonadoHasta, resumen,
  diaSemana, diasEnMes, validarRegistro, mesTerminado, partirClave,
} from '../app/js/calculo.js';

const datos = JSON.parse(readFileSync(new URL('../datos/continuidades.json', import.meta.url)));
const HOY = '2026-10-16';

test('Rafa: débito anual 2024 = 7, 2025 = 32, 2026 (ene–oct) = 21', () => {
  assert.equal(debitoAnual(datos, 2024, 'rafa', HOY), 7);
  assert.equal(debitoAnual(datos, 2025, 'rafa', HOY), 32);
  assert.equal(acumuladoAnio(datos, '2026-10', 'rafa', HOY), 21);
});

test('Rafa: acumulado total a octubre de 2026 = 60', () => {
  assert.equal(acumuladoTotal(datos, '2026-10', 'rafa', HOY), 60);
});

test('Rafa: detalle 2025 mes a mes', () => {
  const esperado = [1, 3, 2, 1, 3, 3, 4, 5, 4, 2, 3, 1];
  const real = esperado.map((_, i) => debitoMensual(datos, `2025-${String(i + 1).padStart(2, '0')}`, 'rafa', HOY));
  assert.deepEqual(real, esperado);
});

test('Carlos: todo a 0', () => {
  assert.equal(debitoAnual(datos, 2024, 'carlos', HOY), 0);
  assert.equal(debitoAnual(datos, 2025, 'carlos', HOY), 0);
  assert.equal(acumuladoAnio(datos, '2026-10', 'carlos', HOY), 0);
  assert.equal(acumuladoTotal(datos, '2026-10', 'carlos', HOY), 0);
});

test('Meses anteriores a agosto de 2024 no cuentan', () => {
  assert.equal(debitoMensual(datos, '2024-07', 'rafa', HOY), 0);
});

test('Mes futuro sin días no cuenta; con días, sí', () => {
  const d = { meses: { '2026-11': { rafa: { dias: [3, 6, 16, 17] } } } };
  assert.equal(debitoMensual(d, '2026-12', 'rafa', HOY), 0);
  assert.equal(debitoMensual(d, '2026-11', 'rafa', HOY), 1);
});

test('Mes terminado sin días genera el débito completo', () => {
  assert.equal(debitoMensual({ meses: {} }, '2025-08', 'rafa', HOY), 5);
  assert.equal(debitoMensual({ meses: {} }, '2025-08', 'carlos', HOY), 4);
  assert.equal(mesTerminado('2026-09', HOY), true);
  assert.equal(mesTerminado('2026-10', HOY), false);
});

test('Vacaciones o baja: débito 0', () => {
  const d = { meses: { '2025-08': { rafa: { dias: [], ausencia: 'vacaciones' }, carlos: { dias: [], ausencia: 'baja' } } } };
  assert.equal(debitoMensual(d, '2025-08', 'rafa', HOY), 0);
  assert.equal(debitoMensual(d, '2025-08', 'carlos', HOY), 0);
});

test('Más días que el cupo: débito negativo que resta', () => {
  const d = { meses: { '2025-01': { carlos: { dias: [1, 2, 3, 4, 5] } } } };
  assert.equal(debitoMensual(d, '2025-01', 'carlos', HOY), -1);
});

test('Abonado hasta agosto de 2026 para los dos', () => {
  assert.equal(abonadoHasta(datos, 'rafa'), '2026-08');
  assert.equal(abonadoHasta(datos, 'carlos'), '2026-08');
});

test('Resumen de octubre de 2026', () => {
  const r = resumen(datos, 'rafa', '2026-10', HOY);
  assert.equal(r.debitoMes, 4);
  assert.equal(r.acumuladoTotal, 60);
});

test('Días de la semana y días del mes', () => {
  assert.equal(diaSemana(2026, 9, 2), 'miércoles');
  assert.equal(diaSemana(2026, 10, 27), 'martes');
  assert.equal(diasEnMes(2026, 11), 30);
  assert.equal(diasEnMes(2028, 2), 29);
});

test('Validación: día inexistente, repetidos y más de 5', () => {
  assert.equal(validarRegistro(2026, 11, { dias: [3, 6, 16, 17] }).length, 0);
  assert.match(validarRegistro(2026, 11, { dias: [31] })[0], /no existe/);
  assert.match(validarRegistro(2026, 11, { dias: [3, 3] })[0], /repetido/);
  assert.match(validarRegistro(2026, 11, { dias: [1, 2, 3, 4, 5, 6] })[0], /máximo/);
});

test('Todos los datos guardados son válidos', () => {
  for (const [clave, mes] of Object.entries(datos.meses)) {
    const { anio, mes: m } = partirClave(clave);
    for (const persona of ['rafa', 'carlos']) {
      if (mes[persona]) assert.deepEqual(validarRegistro(anio, m, mes[persona]), [], `${clave} ${persona}`);
    }
  }
});

test('Resumen anual: solicitados frente al cupo y meses abonados/pendientes', async () => {
  const { resumenAnual } = await import('../app/js/calculo.js');
  const r26 = resumenAnual(datos, 2026, 'rafa', HOY);
  assert.deepEqual(
    { s: r26.solicitados, c: r26.cupo, a: r26.abonados, p: r26.pendientes, v: r26.prevision },
    { s: 33, c: 55, a: 8, p: 3, v: 1 },
  );
  assert.equal(r26.cupo - r26.solicitados, debitoAnual(datos, 2026, 'rafa', HOY)); // 22
  assert.deepEqual(r26.estados.slice(7), ['abonado', 'pendiente', 'pendiente', 'prevision', 'vacio']);

  const r24 = resumenAnual(datos, 2024, 'rafa', HOY);
  assert.deepEqual([r24.solicitados, r24.cupo, r24.abonados, r24.pendientes], [18, 25, 5, 0]);
  assert.equal(r24.estados[0], 'fuera');

  const r25 = resumenAnual(datos, 2025, 'carlos', HOY);
  assert.deepEqual([r25.solicitados, r25.cupo, r25.abonados, r25.pendientes], [48, 48, 12, 0]);
});
