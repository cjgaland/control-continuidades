// Versión de la app e historial de cambios (se muestra en la portada y en Ayuda).
// Para publicar una versión nueva: node scripts/nueva-version.mjs 1.2 "Qué cambia"

export const VERSION = '1.8';
export const ANIO = 2026;
export const AUTOR = 'Carlos J. Galán Doval';

export const HISTORIAL = [
  {
    version: '1.8',
    fecha: '15-11-2026',
    cambios: 'Ayuda: botón «Buscar actualizaciones» para comprobar en el momento si hay versión nueva. El manual se ve dentro de la app (en el iPad ya no se cierra al volver).',
  },
  {
    version: '1.7',
    fecha: '14-11-2026',
    cambios: 'Enlace al Portal de la Unidad en la cabecera',
  },
  {
    version: '1.6',
    fecha: '14-11-2026',
    cambios: 'Manual de usuario en PDF (consulta y modo edición): se descarga desde Ayuda y Ajustes',
  },
  {
    version: '1.5',
    fecha: '14-11-2026',
    cambios: 'En ordenador, cada pantalla cabe entera sin desplazar la página: pestañas arriba, informe en tres columnas, escrito con el texto a toda altura y Rafa y Carlos lado a lado al editar',
  },
  {
    version: '1.4',
    fecha: '16-10-2026',
    cambios: 'Resumen del año en el Informe (pantalla y PDF): días solicitados frente al cupo, meses abonados, meses pendientes (indicando los de previsión) y una tira de colores con el estado de cada mes.',
  },
  {
    version: '1.3',
    fecha: '16-10-2026',
    cambios: 'Informe anual en PDF: «Ver PDF» para verlo e imprimirlo y «Descargar PDF» para guardarlo (en el móvil, «Ver / compartir PDF»). Sustituye al botón «Imprimir».',
  },
  {
    version: '1.2',
    fecha: '16-10-2026',
    cambios: 'Portada más limpia, sin botones repetidos (ya están abajo). En Ajustes, la parte del token queda plegada y marcada «Solo para Carlos»; quien solo consulta ve que no hace falta configurar nada.',
  },
  {
    version: '1.1',
    fecha: '16-10-2026',
    cambios: 'Icono propio para instalarla en el móvil, portada con la descripción de la app, aviso cuando hay datos '
      + 'nuevos o una versión nueva (con botón «Actualizar»), y esta ayuda con el historial de versiones.',
  },
  {
    version: '1.0',
    fecha: '16-10-2026',
    cambios: 'Primera versión: sustituye al Excel. Resumen, histórico, informe anual imprimible, escrito a Gerencia '
      + '(copiar, correo y PDF), alta y edición mensual con guardado en GitHub y ajustes del token.',
  },
];
