// Ver PDF e imágenes DENTRO de la app y guardar archivos sin salir de ella.
// Por qué: en el iPad/iPhone, con la app añadida a la pantalla de inicio, abrir un archivo «en otra pestaña»
// lo abre en la propia app sin botón de volver, y al cerrarlo se cierra la app entera.
// - Los PDF se dibujan con pdf.js (Safari en iPad solo enseña la primera página de un PDF incrustado).
// - Guardar: en iPad/iPhone se usa la hoja de «Compartir» del sistema (Guardar en Archivos, Mail…);
//   en el ordenador, la descarga de siempre.

let pdfjs;
async function cargarPdfjs() {
  if (!pdfjs) {
    pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  }
  return pdfjs;
}

/** ¿iPhone, iPad o iPod? (el iPad moderno dice ser un Mac, pero tiene pantalla táctil). */
export function esIOS(nav = globalThis.navigator) {
  if (!nav) return false;
  return /iPad|iPhone|iPod/.test(nav.userAgent || '') || (/Macintosh/.test(nav.userAgent || '') && (nav.maxTouchPoints || 0) > 1);
}

/** Dibuja todas las páginas del PDF dentro de `contenedor`, a medida que se van viendo (ahorra memoria en el iPad). */
export async function pintarPdf(bytes, contenedor) {
  const lib = await cargarPdfjs();
  const doc = await lib.getDocument({ data: bytes, isEvalSupported: false }).promise;
  const ancho = Math.max(280, Math.min(contenedor.clientWidth || 800, 1000));
  const nitidez = Math.min(globalThis.devicePixelRatio || 1, 2);
  const pendientes = new Map();
  const observador = 'IntersectionObserver' in globalThis
    ? new IntersectionObserver((entradas) => entradas.forEach((e) => { if (e.isIntersecting) pendientes.get(e.target)?.(); }), { root: contenedor, rootMargin: '1200px 0px' })
    : null;
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const base = pagina.getViewport({ scale: 1 });
    const escala = ancho / base.width;
    const hueco = document.createElement('div');
    hueco.className = 'pagina-pdf';
    hueco.style.aspectRatio = `${base.width} / ${base.height}`;
    hueco.setAttribute('aria-label', `Página ${n} de ${doc.numPages}`);
    hueco.innerHTML = `<span style="display:grid;place-items:center;height:100%;color:#64748b;font:14px system-ui,sans-serif">Cargando página ${n}…</span>`;
    contenedor.append(hueco);
    const dibujar = async () => {
      pendientes.delete(hueco); observador?.unobserve(hueco);
      const vp = pagina.getViewport({ scale: escala * nitidez });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
      await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      // Se pasa a imagen y se suelta el lienzo: el iPad aguanta mucho mejor muchas páginas así.
      const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.88));
      canvas.width = 0; canvas.height = 0;
      const img = new Image();
      img.alt = `Página ${n}`;
      img.src = URL.createObjectURL(blob);
      hueco.replaceChildren(img);
    };
    // Las dos primeras se dibujan ya; el resto, cuando se acercan a la vista.
    if (observador && n > 2) { pendientes.set(hueco, dibujar); observador.observe(hueco); } else dibujar().catch(() => { hueco.textContent = 'No se pudo dibujar esta página.'; });
  }
  return doc.numPages;
}

/** Muestra un PDF o una imagen (Blob) en `contenedor`. Devuelve una función que libera la memoria. */
/** Tipo real del archivo mirando sus primeros bytes (algunos servidores lo anuncian como «octet-stream»). */
export async function tipoReal(blob) {
  const t = (blob.type || '').split(';')[0].trim();
  if (t === 'application/pdf' || (t.startsWith('image/') && t !== 'image/heic' && t !== 'image/heif')) return t;
  const b = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const empieza = (...x) => x.every((v, i) => b[i] === v);
  if (empieza(0x25, 0x50, 0x44, 0x46)) return 'application/pdf';        // %PDF
  if (empieza(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (empieza(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (empieza(0x47, 0x49, 0x46)) return 'image/gif';
  return t;
}

export async function mostrarArchivo(blob, contenedor) {
  contenedor.innerHTML = '<p class="meta">Cargando…</p>';
  const tipo = await tipoReal(blob);
  if (tipo.startsWith('image/') && !/heic|heif/i.test(tipo)) {
    const url = URL.createObjectURL(blob);
    contenedor.innerHTML = '';
    const img = new Image(); img.src = url; img.alt = 'Documento adjunto'; img.className = 'imagen-adjunta';
    contenedor.append(img);
    return () => URL.revokeObjectURL(url);
  }
  if (tipo === 'application/pdf') {
    contenedor.innerHTML = '';
    await pintarPdf(new Uint8Array(await blob.arrayBuffer()), contenedor);
    return () => contenedor.querySelectorAll('img').forEach((i) => URL.revokeObjectURL(i.src));
  }
  contenedor.innerHTML = '<p class="meta">Este tipo de archivo no se puede ver aquí. Usa «Guardar» para abrirlo con otra aplicación.</p>';
  return () => {};
}

/**
 * Guarda un archivo. En iPad/iPhone abre la hoja de Compartir (desde ahí: «Guardar en Archivos», Mail, AirDrop…);
 * si el sistema no lo permite en ese momento, `pedirToque` enseña un botón y se reintenta con ese toque.
 * En el ordenador, descarga normal.
 */
export async function guardarArchivo(blob, nombre, { pedirToque } = {}) {
  const archivo = new File([blob], nombre, { type: blob.type || 'application/octet-stream' });
  if (esIOS() && navigator.canShare?.({ files: [archivo] })) {
    const compartir = () => navigator.share({ files: [archivo], title: nombre });
    try { await compartir(); return; } catch (e) {
      if (e?.name === 'AbortError') return; // el usuario cerró la hoja
      if (e?.name === 'NotAllowedError' && pedirToque) { await pedirToque(nombre, compartir); return; }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ---------- Ventana propia (para apps donde el archivo se abre desde otra ventana, p. ej. una ficha) ----------
// Color: el principal de cada app (--azul en Permisos y Dietas, --pri en Actividad); se puede fijar con --color-version.
const COLOR = 'var(--color-version, var(--azul, var(--pri, #0a7a3d)))';
const ESTILOS_VENTANA = `
.visor-ventana { width: min(1000px, 100vw); max-width: 100vw; height: 100dvh; max-height: 100dvh; margin: 0 auto; padding: 0; border: 0; background: #dfe4ea; }
.visor-ventana[open] { display: flex; flex-direction: column; }
.visor-ventana::backdrop { background: #0008; }
.visor-ventana .vv-barra { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; padding-top: calc(8px + env(safe-area-inset-top)); background: #fff; border-bottom: 1px solid #d9dce6; font: 15px/1.3 system-ui, -apple-system, sans-serif; }
.visor-ventana .vv-barra strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.visor-ventana .vv-barra span { display: flex; gap: 8px; flex: none; }
.visor-ventana button { font: inherit; font-weight: 600; min-height: 40px; padding: 8px 14px; border-radius: 8px; cursor: pointer; background: #fff; color: ${COLOR}; border: 1px solid ${COLOR}; }
.visor-ventana button.vv-guardar { background: ${COLOR}; color: #fff; border: 0; }
.visor-ventana button:disabled { opacity: .5; cursor: default; }
.visor-ventana .vv-cuerpo { flex: 1; min-height: 0; overflow: auto; -webkit-overflow-scrolling: touch; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 10px; }
.visor-ventana .pagina-pdf { width: 100%; max-width: 1000px; background: #fff; box-shadow: 0 2px 10px #0003; flex: none; }
.visor-ventana .pagina-pdf img, .visor-ventana .imagen-adjunta { display: block; width: 100%; height: auto; background: #fff; }
.visor-ventana .imagen-adjunta { max-width: 1000px; }
.visor-ventana .vv-error { background: #fdecea; color: #b3261e; padding: 10px 14px; border-radius: 8px; }`;

/**
 * Abre `ruta` (PDF o imagen) en una ventana propia, por encima de cualquier otra, con «Guardar / descargar» y «Cerrar».
 * Al cerrarla se vuelve exactamente a donde se estaba.
 */
export async function verEnVentana(titulo, ruta, nombre) {
  if (!document.getElementById('estilos-visor-ventana')) {
    const st = document.createElement('style'); st.id = 'estilos-visor-ventana'; st.textContent = ESTILOS_VENTANA; document.head.append(st);
  }
  const d = document.createElement('dialog');
  d.className = 'visor-ventana';
  d.innerHTML = '<div class="vv-barra"><strong></strong><span><button type="button" class="vv-guardar" disabled>Guardar / descargar</button>'
    + '<button type="button" class="vv-cerrar">Cerrar</button></span></div><div class="vv-cuerpo"><p>Cargando…</p></div>';
  d.querySelector('strong').textContent = titulo;
  let liberar = () => {};
  let cerrada = false;
  const limpiar = () => { if (cerrada) return; cerrada = true; liberar(); d.remove(); };
  d.addEventListener('close', limpiar); // también al cerrar con la tecla Esc
  d.querySelector('.vv-cerrar').onclick = () => { if (d.open) d.close(); limpiar(); };
  document.body.append(d);
  d.showModal();
  const cuerpo = d.querySelector('.vv-cuerpo');
  try {
    const r = await fetch(ruta, { cache: 'no-store' });
    if (!r.ok) throw new Error('No se pudo abrir el archivo.');
    const blob = await r.blob();
    if (cerrada) return;
    liberar = await mostrarArchivo(blob, cuerpo);
    if (cerrada) liberar();
    const guardar = d.querySelector('.vv-guardar');
    guardar.disabled = false;
    guardar.onclick = () => guardarArchivo(blob, nombre);
  } catch (e) {
    cuerpo.innerHTML = '<p class="vv-error"></p>';
    cuerpo.firstChild.textContent = e?.message || 'No se pudo abrir el archivo.';
  }
}

/** «Descargar» un archivo del servidor: en el ordenador lo descarga; en iPad/iPhone lo abre en la ventana (desde ahí, Guardar). */
export async function descargarDocumento(ruta, nombre) {
  if (esIOS()) return verEnVentana(nombre, ruta, nombre);
  const r = await fetch(ruta, { cache: 'no-store' });
  if (!r.ok) throw new Error('No se pudo descargar el archivo.');
  return guardarArchivo(await r.blob(), nombre);
}
