// Servidor estático para la demostración: node servidor_demo.mjs <carpeta_demo> [puerto]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, resolve } from 'node:path';
const RAIZ = resolve(process.argv[2]);
const PUERTO = Number(process.argv[3] || 8830);
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json' };
createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = normalize(join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  try {
    const cuerpo = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': `${TIPOS[extname(archivo)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(cuerpo);
  } catch { res.writeHead(404); res.end('No encontrado'); }
}).listen(PUERTO, '127.0.0.1', () => console.log(`Demo en http://127.0.0.1:${PUERTO}/app/`));
