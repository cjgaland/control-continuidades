// Manual de usuario descargable: los PDF viven en app/ayuda/ (se generan con scripts/manual/generar.sh).
// Las rutas son relativas a app/index.html, así funcionan en GitHub Pages (…/control-continuidades/app/).

import { verEnVentana } from './visor.js?v=1.9';

export const RUTA_MANUAL_CONSULTA = 'ayuda/Manual_Control_Continuidades.pdf';
export const RUTA_MANUAL_EDICION = 'ayuda/Manual_Control_Continuidades_Edicion.pdf';

// En Modo edición (hay token) se ofrece el manual de edición, que incluye todo el de consulta.
export function rutaManual(conEdicion) {
  return conEdicion ? RUTA_MANUAL_EDICION : RUTA_MANUAL_CONSULTA;
}

/**
 * ¿Existe ya el PDF del manual? Si una ruta no existe, el servidor puede responder 200 con otra página (HTML);
 * por eso no basta con mirar el código: el tipo de contenido tiene que ser PDF.
 * `pedir` es fetch (se inyecta para poder probarlo).
 */
export async function manualDisponible(ruta, pedir = fetch) {
  try {
    const r = await pedir(ruta, { method: 'HEAD', cache: 'no-store' });
    return !!r.ok && /pdf/i.test(r.headers.get('content-type') || '');
  } catch {
    return false;
  }
}

// HTML del bloque de descarga. `idCaja` es el contenedor donde se pinta el resultado de la comprobación.
export function htmlManual(idCaja, conEdicion) {
  return `<p class="nota">${conEdicion
    ? 'Manual del modo edición: todo lo de consulta y, además, cómo anotar los meses, abonar y generar el escrito.'
    : 'Manual con todos los pasos explicados, con imágenes y preguntas frecuentes.'}</p>
    <div id="${idCaja}"><span class="nota">Comprobando el manual…</span></div>`;
}

// Rellena la caja con el botón de descarga (o un aviso si el PDF aún no está publicado).
export function pintarManual(idCaja, conEdicion) {
  const ruta = rutaManual(conEdicion);
  manualDisponible(ruta).then((hay) => {
    const caja = document.getElementById(idCaja);
    if (!caja) return; // se ha cambiado de pantalla mientras se comprobaba
    // Se abre DENTRO de la app (en el iPad, abrir el PDF «fuera» dejaba la app de pantalla de inicio sin vuelta atrás).
    caja.innerHTML = hay
      ? '<button type="button" class="boton">Ver manual (PDF)</button>'
      : '<p class="nota">El manual estará disponible en breve.</p>';
    caja.querySelector('button')?.addEventListener('click', () => verEnVentana(
      conEdicion ? 'Manual (Modo edición)' : 'Manual de uso', ruta, ruta.split('/').pop()));
  });
}
