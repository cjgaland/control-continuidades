// Prepara una versión nueva de la app:  node scripts/nueva-version.mjs 1.2 "Qué cambia en esta versión"
// - Cambia el número en app/js/version.js y añade la entrada al historial.
// - Cambia el ?v= de index.html y de los import, para que los navegadores descarguen los archivos nuevos.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [nueva, cambios] = process.argv.slice(2);
if (!/^\d+\.\d+$/.test(nueva ?? '') || !cambios) {
  console.error('Uso: node scripts/nueva-version.mjs 1.2 "Qué cambia en esta versión"');
  process.exit(1);
}
const APP = fileURLToPath(new URL('../app/', import.meta.url));
const rutaVersion = join(APP, 'js/version.js');
let v = readFileSync(rutaVersion, 'utf8');
const actual = v.match(/VERSION = '([^']+)'/)[1];
const hoy = new Date();
const fecha = `${String(hoy.getDate()).padStart(2, '0')}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${hoy.getFullYear()}`;
v = v.replace(`VERSION = '${actual}'`, `VERSION = '${nueva}'`)
  .replace(/ANIO = \d+/, `ANIO = ${hoy.getFullYear()}`)
  .replace('export const HISTORIAL = [\n', `export const HISTORIAL = [\n  {\n    version: '${nueva}',\n    fecha: '${fecha}',\n    cambios: ${JSON.stringify(cambios).replace(/"/g, "'")},\n  },\n`);
writeFileSync(rutaVersion, v);

const archivos = ['index.html', ...readdirSync(join(APP, 'js')).map((f) => `js/${f}`)];
for (const f of archivos) {
  const ruta = join(APP, f);
  const antes = readFileSync(ruta, 'utf8');
  const despues = antes.replaceAll(`?v=${actual}`, `?v=${nueva}`);
  if (despues !== antes) writeFileSync(ruta, despues);
}
console.log(`Versión ${actual} → ${nueva}. Revisa los cambios, pasa los tests (npm test) y haz el commit.`);
