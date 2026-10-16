// El escrito generado tiene que coincidir letra por letra con el ejemplo de docs/modelo-escrito.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generarEscrito, asuntoEscrito, nombrePdf, formatoDebito, enlaceCorreo, propuestaEscrito } from '../app/js/escrito.js';

const datos = JSON.parse(readFileSync(new URL('../datos/continuidades.json', import.meta.url)));
const modelo = readFileSync(new URL('../docs/modelo-escrito.md', import.meta.url), 'utf8');
const HOY = '2026-10-16';
const OPC = { primerMes: '2026-09', numMeses: 3, prevision: true, saludo: 'Buenos días' };

function ejemploDelModelo() {
  const desde = modelo.indexOf('## Ejemplo');
  const m = modelo.slice(desde).match(/```\n([\s\S]*?)\n```/);
  return m[1];
}

test('Escrito idéntico al ejemplo del modelo', () => {
  assert.equal(generarEscrito(datos, OPC, HOY), ejemploDelModelo());
});

test('Asunto', () => {
  assert.equal(asuntoEscrito(OPC), 'Continuidades Área de Calidad: Septiembre 2026, Octubre 2026 y previsión de Noviembre 2026');
});

test('Formato de los débitos', () => {
  assert.equal(formatoDebito(0), '0');
  assert.equal(formatoDebito(3), '-3');
  assert.equal(formatoDebito(-1), '+1');
});

test('Abonado distinto para cada uno', () => {
  const d = structuredClone(datos);
  d.meses['2026-08'].carlos.abonado = false;
  const texto = generarEscrito(d, OPC, HOY);
  assert.match(texto, /a Rafa se le han abonado todas hasta Agosto de 2026 y a Carlos hasta Julio de 2026\./);
});

test('Vacaciones y línea de Carlos con débito', () => {
  const d = { meses: {
    '2025-08': { rafa: { dias: [], ausencia: 'vacaciones' }, carlos: { dias: [4, 11] } },
  } };
  const texto = generarEscrito(d, { primerMes: '2025-08', numMeses: 1, prevision: false, saludo: 'Buenas tardes' }, HOY);
  assert.equal(texto, [
    'Buenas tardes, Sole y Pedro:',
    '',
    'Esta es la información de las continuidades de Agosto 2025. Gracias.',
    '',
    'Agosto 2025',
    'Rafa: vacaciones el mes completo (sin débito).',
    'Carlos: Solicitados 2 (Débito mensual -2; Acumulados 2024/25 -50)', // 12 meses previos vacíos × 4 + 2
    '    • Día 4, lunes.',
    '    • Día 11, lunes.',
  ].join('\n'));
});

test('Nombre del PDF', () => {
  assert.equal(nombrePdf(OPC, HOY), '2026-10-16_Escrito_Sep-Oct-Nov_2026.pdf');
  assert.equal(nombrePdf({ primerMes: '2026-12', numMeses: 2 }, HOY), '2026-10-16_Escrito_Dic-2026_Ene-2027.pdf');
});

test('Enlace de correo con destinatarios, CCO y asunto', () => {
  const url = enlaceCorreo('Asunto á', 'Línea 1\nLínea 2');
  assert.ok(url.startsWith('mailto:pedromanuel.castro.sspa@juntadeandalucia.es,soledad.delgado.sspa@juntadeandalucia.es?bcc=rjavier.romero.sspa@juntadeandalucia.es&subject='));
  assert.ok(url.includes('%0D%0A'));
});

test('Propuesta por defecto: septiembre, octubre y previsión de noviembre', () => {
  const p = propuestaEscrito(datos, new Date(2026, 9, 16, 10, 0));
  assert.deepEqual(p, { primerMes: '2026-09', numMeses: 3, prevision: true, saludo: 'Buenos días' });
  assert.equal(propuestaEscrito(datos, new Date(2026, 9, 16, 17, 0)).saludo, 'Buenas tardes');
});
