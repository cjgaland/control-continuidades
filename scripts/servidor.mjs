// Servidor local para probar la app: node scripts/servidor.mjs  →  http://127.0.0.1:8765/app/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PUERTO = Number(process.env.PORT || 8765);
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta === '/') { res.writeHead(302, { Location: '/app/' }); return res.end(); }
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = normalize(join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  try {
    const cuerpo = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': `${TIPOS[extname(archivo)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(cuerpo);
  } catch {
    res.writeHead(404); res.end('No encontrado');
  }
}).listen(PUERTO, '127.0.0.1', () => console.log(`App en http://127.0.0.1:${PUERTO}/app/`));
