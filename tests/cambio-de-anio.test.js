// El paso de un año a otro no necesita preparar nada: se simula diciembre de 2026 → enero de 2027.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  aniosDisponibles, acumuladoAnio, acumuladoTotal, debitoAnual, debitoMensual,
} from '../app/js/calculo.js';
import { generarEscrito, asuntoEscrito, propuestaEscrito, nombrePdf } from '../app/js/escrito.js';

const base = JSON.parse(readFileSync(new URL('../datos/continuidades.json', import.meta.url)));
const datos = structuredClone(base);
for (const c of ['2026-09', '2026-10']) { datos.meses[c].rafa.abonado = true; datos.meses[c].carlos.abonado = true; }
datos.meses['2026-12'] = { rafa: { dias: [9, 14], ausencia: null, abonado: false }, carlos: { dias: [1, 15, 22, 29], ausencia: null, abonado: false } };
datos.meses['2027-01'] = { rafa: { dias: [12, 20, 26], ausencia: null, abonado: false }, carlos: { dias: [5, 12, 19, 26], ausencia: null, abonado: false } };

test('El año nuevo aparece solo en los selectores', () => {
  assert.deepEqual(aniosDisponibles(base, '2027-01-05'), [2024, 2025, 2026, 2027]);
  assert.deepEqual(aniosDisponibles(datos, '2026-12-18'), [2024, 2025, 2026, 2027]); // ya hay previsión de enero
});

test('El acumulado del año empieza de cero en enero y el total sigue sumando', () => {
  const HOY = '2027-01-20';
  assert.equal(debitoMensual(datos, '2026-12', 'rafa', HOY), 3);
  assert.equal(debitoAnual(datos, 2026, 'rafa', HOY), 25); // 22 + 3 de diciembre
  assert.equal(acumuladoAnio(datos, '2027-01', 'rafa', HOY), 2);
  assert.equal(acumuladoTotal(datos, '2026-12', 'rafa', HOY), 64);
  assert.equal(acumuladoTotal(datos, '2027-01', 'rafa', HOY), 66);
});

test('Escrito de diciembre con la previsión de enero del año siguiente', () => {
  const hoy = new Date(2026, 11, 18, 10, 0);
  const opc = propuestaEscrito(datos, hoy);
  assert.deepEqual(opc, { primerMes: '2026-11', numMeses: 3, prevision: true, saludo: 'Buenos días' });
  assert.equal(asuntoEscrito(opc), 'Continuidades Área de Calidad: Noviembre 2026, Diciembre 2026 y previsión de Enero 2027');
  const texto = generarEscrito(datos, opc, hoy);
  assert.match(texto, /hasta Octubre de 2026\. Gracias\./);
  assert.match(texto, /Diciembre 2026\nRafa: Solicitados 2 \(Débito mensual -3; Acumulados 2024\/26 -64\)/);
  assert.match(texto, /Enero 2027\nRafa: Solicitados 3 \(Débito mensual -2; Acumulados 2024\/27 -66\)/);
  assert.match(texto, /Enero 2027[\s\S]*Día 20, miércoles\./); // 20 de enero de 2027 cae en miércoles
  assert.equal(nombrePdf(opc, hoy), '2026-12-18_Escrito_Nov-2026_Dic-2026_Ene-2027.pdf');
});
