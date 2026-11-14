// Capturas reales con Chrome sin ventana + DevTools (basado en capture_screenshots.js de la skill app-user-manual).
// Uso: DEMO_DIR=<carpeta_demo> OUT_DIR=capturas APP_URL=http://127.0.0.1:8830 CDP_URL=http://localhost:9228 node capturar.mjs pasos_consulta.json
//
// SEGURIDAD: la pestaña intercepta TODAS las peticiones de red. Solo se deja pasar lo que va al servidor local de la demostración.
// Las llamadas a api.github.com (Modo edición con token FALSO) se contestan aquí mismo con los datos ficticios de
// DEMO_DIR/datos/continuidades.json; el PUT de «Guardar» se simula (no sale nada a internet). Cualquier otra petición se aborta.
//
// Cada paso del JSON puede llevar:
//   { viewport: {w, h, movil} }          tamaño de pantalla (se mantiene hasta el siguiente)
//   { url: "/app/#resumen", espera }     abre una dirección de la app (desde cero)
//   { js: "...", espera }                ejecuta código en la página (puede usar await)
//   { foto: "nombre", selector?, margen?, altoMax? }   guarda nombre.png (la pantalla, o solo el elemento)
import fs from 'node:fs';
import path from 'node:path';
const CDP = process.env.CDP_URL || 'http://localhost:9228', BASE = process.env.APP_URL || 'http://127.0.0.1:8830';
const OUT = process.env.OUT_DIR, DEMO = process.env.DEMO_DIR;
if (!OUT || !DEMO || !process.argv[2]) { console.error('Uso: DEMO_DIR=<demo> OUT_DIR=<carpeta> node capturar.mjs <pasos.json>'); process.exit(1); }
const ORIGEN_LOCAL = new URL(BASE).origin;
fs.mkdirSync(OUT, { recursive: true });
const datosDemo = fs.readFileSync(path.join(DEMO, 'datos/continuidades.json'));
let id = 0;
const enviar = (ws, method, params = {}) => new Promise((res, rej) => {
  const n = ++id;
  const f = (ev) => { const d = JSON.parse(ev.data); if (d.id === n) { ws.removeEventListener('message', f); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } };
  ws.addEventListener('message', f); ws.send(JSON.stringify({ id: n, method, params }));
});
const evaluar = async (ws, expression) => {
  const r = await enviar(ws, 'Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result?.value;
};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (obj, estado = 200) => ({ responseCode: estado, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(JSON.stringify(obj)).toString('base64') });

const t = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
await enviar(ws, 'Page.enable'); await enviar(ws, 'Runtime.enable'); await enviar(ws, 'DOM.enable');
await enviar(ws, 'Fetch.enable', { patterns: [{ urlPattern: '*' }] });

let bloqueadas = 0;
ws.addEventListener('message', async (ev) => {
  const d = JSON.parse(ev.data);
  if (d.method === 'Page.javascriptDialogOpening') enviar(ws, 'Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
  if (d.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = d.params;
  const u = new URL(request.url);
  try {
    if (u.origin === ORIGEN_LOCAL || u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'about:') {
      await enviar(ws, 'Fetch.continueRequest', { requestId });
    } else if (u.hostname === 'api.github.com') {
      if (request.method === 'OPTIONS') await enviar(ws, 'Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: '*' }] });
      else if (/\/contents\/datos\/continuidades\.json/.test(u.pathname)) {
        if (request.method === 'PUT') await enviar(ws, 'Fetch.fulfillRequest', { requestId, ...json({ content: { sha: 'sha-demo-2' } }) }); // simulado: no sale nada
        else await enviar(ws, 'Fetch.fulfillRequest', { requestId, ...json({ content: datosDemo.toString('base64'), sha: 'sha-demo-1' }) });
      } else if (/^\/repos\/[^/]+\/[^/]+$/.test(u.pathname)) await enviar(ws, 'Fetch.fulfillRequest', { requestId, ...json({ permissions: { push: true } }) });
      else { bloqueadas++; await enviar(ws, 'Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }); }
    } else { bloqueadas++; await enviar(ws, 'Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }); }
  } catch (e) { console.log('error al contestar', request.url, String(e).slice(0, 200)); }
});

for (const p of JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))) {
  if (p.viewport) await enviar(ws, 'Emulation.setDeviceMetricsOverride', { width: p.viewport.w, height: p.viewport.h, deviceScaleFactor: 2, mobile: !!p.viewport.movil });
  if (p.url) { await enviar(ws, 'Page.navigate', { url: 'about:blank' }); await dormir(400); await enviar(ws, 'Page.navigate', { url: BASE + p.url });
    await dormir(p.espera ?? 1800); }
  if (p.js) { await evaluar(ws, p.js); await dormir(p.espera ?? 500); }
  if (p.foto) {
    let clip;
    if (p.selector) {
      const r = await evaluar(ws, `const e = document.querySelector(${JSON.stringify(p.selector)}); e.scrollIntoView({block:'start'}); await new Promise(r=>setTimeout(r,300)); const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height };`);
      const m = p.margen ?? 8;
      clip = { x: Math.max(0, r.x - m), y: Math.max(0, r.y - m), width: r.w + 2 * m, height: Math.min(r.h + 2 * m, p.altoMax || 4000), scale: 2 };
    }
    const shot = await enviar(ws, 'Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) });
    fs.writeFileSync(path.join(OUT, `${p.foto}.png`), Buffer.from(shot.data, 'base64'));
    console.log('guardada', p.foto);
  }
}
console.log('peticiones externas bloqueadas:', bloqueadas);
await fetch(`${CDP}/json/close/${t.id}`).catch(() => {});
ws.close();
