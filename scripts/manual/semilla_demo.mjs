// Monta la carpeta de DEMOSTRACIÓN para las capturas del manual: una copia de la app y un datos/continuidades.json FICTICIO.
// Uso: node scripts/manual/semilla_demo.mjs <carpeta_demo>
// Nunca lee ni copia datos/continuidades.json real (el repositorio es público).
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const destino = resolve(process.argv[2] || '');
if (!process.argv[2]) { console.error('Uso: node semilla_demo.mjs <carpeta_demo>'); process.exit(1); }
const RAIZ = fileURLToPath(new URL('../..', import.meta.url));

// Generador pseudoaleatorio con semilla fija: los datos inventados son siempre los mismos.
let s = 20261114;
const azar = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };

// n días laborables distintos de un mes (lunes a viernes).
function dias(anio, mes, n) {
  const ult = new Date(anio, mes, 0).getDate();
  const validos = [];
  for (let d = 1; d <= ult; d++) { const w = new Date(anio, mes - 1, d).getDay(); if (w !== 0 && w !== 6) validos.push(d); }
  const out = [];
  while (out.length < n) { const d = validos.splice(Math.floor(azar() * validos.length), 1)[0]; out.push(d); }
  return out.sort((a, b) => a - b);
}

const clave = (a, m) => `${a}-${String(m).padStart(2, '0')}`;
const ABONADO_HASTA = { rafa: '2026-09', carlos: '2026-10' };
// Cantidades de días inventadas, por persona y año (se reparten por mes).
const PLAN = {
  rafa: { 2024: [2, 3, 4, 2, 1], 2025: [3, 2, 4, 3, 2, 1, 0, 5, 4, 3, 2, 4], 2026: [3, 2, 4, 3, 5, 2, 3, 1, 2, 4, 3, 4] },
  carlos: { 2024: [4, 4, 3, 4, 4], 2025: [4, 3, 4, 4, 4, 5, 4, 4, 3, 4, 4, 4], 2026: [4, 4, 4, 3, 4, 4, 4, 0, 4, 4, 4, 4] },
};
// Ausencias de mes completo inventadas.
const AUSENCIAS = { 'rafa/2025-08': 'vacaciones', 'carlos/2024-12': 'baja', 'carlos/2026-08': 'vacaciones' };

const meses = {};
for (const p of ['rafa', 'carlos']) {
  for (const a of [2024, 2025, 2026]) {
    const desde = a === 2024 ? 8 : 1;
    PLAN[p][a].forEach((n, i) => {
      const m = desde + i;
      const c = clave(a, m);
      const ausencia = AUSENCIAS[`${p}/${c}`] || null;
      if (p === 'rafa' && c === '2025-07') return; // mes terminado sin ningún día: débito completo
      const reg = { dias: ausencia ? [] : dias(a, m, n), ausencia, abonado: c <= ABONADO_HASTA[p] };
      (meses[c] ??= {})[p] = reg;
    });
  }
}
// Mes en curso (noviembre) y previsión (diciembre). Carlos 2026-08 sin días ni ausencia no existe: ya tiene vacaciones.
meses['2026-11'].rafa.dias = [3, 10, 24];
meses['2026-11'].carlos.dias = [4, 11, 18, 25];
meses['2026-12'].rafa.dias = [1, 9, 15, 22];
meses['2026-12'].carlos.dias = [2, 10, 16, 23];

const datos = { version: 1, actualizado: '2026-11-12', meses: Object.fromEntries(Object.keys(meses).sort().map((c) => [c, meses[c]])) };

rmSync(destino, { recursive: true, force: true });
mkdirSync(join(destino, 'datos'), { recursive: true });
cpSync(join(RAIZ, 'app'), join(destino, 'app'), { recursive: true });
writeFileSync(join(destino, 'datos/continuidades.json'), `${JSON.stringify(datos, null, 2)}\n`);
console.log('Demo montada en', destino, '·', Object.keys(datos.meses).length, 'meses ficticios');
