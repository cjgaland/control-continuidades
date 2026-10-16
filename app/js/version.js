// Versión de la app e historial de cambios (se muestra en la portada y en Ayuda).
// Para publicar una versión nueva: node scripts/nueva-version.mjs 1.2 "Qué cambia"

export const VERSION = '1.2';
export const ANIO = 2026;
export const AUTOR = 'Carlos J. Galán Doval';

export const HISTORIAL = [
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
