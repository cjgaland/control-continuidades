// Lógica de cálculo de las continuidades (sin nada de interfaz).
// Reglas: docs/reglas-de-calculo.md
//
// Los meses se identifican con una clave "AAAA-MM" (por ejemplo "2026-10").
// "hoy" puede ser un objeto Date o un texto "AAAA-MM-DD"; si no se pasa, se usa la fecha actual.

export const INICIO = '2024-08';

export const PERSONAS = {
  rafa: { clave: 'rafa', nombre: 'Rafa', completo: 'Rafael J. Romero de Castilla Gil', cupo: 5 },
  carlos: { clave: 'carlos', nombre: 'Carlos', completo: 'Carlos J. Galán Doval', cupo: 4 },
};

export const MAX_DIAS = 5;

export const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const ABREV_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// ---------- Fechas y claves de mes ----------

export function claveMes(anio, mes) {
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

export function partirClave(clave) {
  const [a, m] = clave.split('-').map(Number);
  return { anio: a, mes: m };
}

export function mesSiguiente(clave, n = 1) {
  const { anio, mes } = partirClave(clave);
  const total = anio * 12 + (mes - 1) + n;
  return claveMes(Math.floor(total / 12), (total % 12) + 1);
}

// Lista de claves desde "desde" hasta "hasta", ambas incluidas.
export function rangoMeses(desde, hasta) {
  const lista = [];
  for (let c = desde; c <= hasta; c = mesSiguiente(c)) lista.push(c);
  return lista;
}

export function nombreMes(clave) {
  const { anio, mes } = partirClave(clave);
  return `${NOMBRES_MES[mes - 1]} ${anio}`;
}

export function diasEnMes(anio, mes) {
  return new Date(anio, mes, 0).getDate();
}

export function diaSemana(anio, mes, dia) {
  return DIAS_SEMANA[new Date(anio, mes - 1, dia).getDay()];
}

function aFecha(hoy) {
  if (hoy instanceof Date) return hoy;
  if (typeof hoy === 'string') {
    const [a, m, d] = hoy.split('-').map(Number);
    return new Date(a, m - 1, d);
  }
  return new Date();
}

export function claveDeHoy(hoy) {
  const f = aFecha(hoy);
  return claveMes(f.getFullYear(), f.getMonth() + 1);
}

// Un mes está terminado cuando ya ha llegado el día 1 del mes siguiente.
export function mesTerminado(clave, hoy) {
  return clave < claveDeHoy(hoy);
}

// ---------- Acceso a los datos ----------

export function registro(datos, clave, persona) {
  const r = datos?.meses?.[clave]?.[persona];
  return {
    dias: Array.isArray(r?.dias) ? [...r.dias].sort((a, b) => a - b) : [],
    ausencia: r?.ausencia ?? null,
    abonado: r?.abonado === true,
  };
}

// ---------- Débitos ----------

export function debitoMensual(datos, clave, persona, hoy) {
  if (clave < INICIO) return 0;
  const r = registro(datos, clave, persona);
  if (r.ausencia === 'vacaciones' || r.ausencia === 'baja') return 0;
  if (r.dias.length === 0 && !mesTerminado(clave, hoy)) return 0;
  return PERSONAS[persona].cupo - r.dias.length;
}

function sumar(datos, desde, hasta, persona, hoy) {
  const ini = desde < INICIO ? INICIO : desde;
  if (hasta < ini) return 0;
  return rangoMeses(ini, hasta).reduce((s, c) => s + debitoMensual(datos, c, persona, hoy), 0);
}

// Suma de los débitos del año hasta ese mes (incluido).
export function acumuladoAnio(datos, clave, persona, hoy) {
  const { anio } = partirClave(clave);
  return sumar(datos, claveMes(anio, 1), clave, persona, hoy);
}

// Suma de los 12 débitos del año.
export function debitoAnual(datos, anio, persona, hoy) {
  return sumar(datos, claveMes(anio, 1), claveMes(anio, 12), persona, hoy);
}

// Suma de todos los débitos desde agosto de 2024 hasta ese mes (incluido).
export function acumuladoTotal(datos, clave, persona, hoy) {
  return sumar(datos, INICIO, clave, persona, hoy);
}

// Último mes (cronológico) marcado como abonado, o null.
export function abonadoHasta(datos, persona) {
  const claves = Object.keys(datos?.meses ?? {}).sort();
  let ultimo = null;
  for (const c of claves) if (registro(datos, c, persona).abonado) ultimo = c;
  return ultimo;
}

// Todo lo que muestra la pantalla Resumen para una persona en un mes.
export function resumen(datos, persona, clave, hoy) {
  const { anio } = partirClave(clave);
  return {
    persona,
    clave,
    debitoMes: debitoMensual(datos, clave, persona, hoy),
    acumuladoAnio: acumuladoAnio(datos, clave, persona, hoy),
    debitoAnual: debitoAnual(datos, anio, persona, hoy),
    acumuladoTotal: acumuladoTotal(datos, clave, persona, hoy),
    abonadoHasta: abonadoHasta(datos, persona),
  };
}

// Años con datos (o desde el inicio hasta el año de "hoy"), para filtros.
export function aniosDisponibles(datos, hoy) {
  const claves = Object.keys(datos?.meses ?? {});
  const ultimo = [claveDeHoy(hoy), ...claves].sort().at(-1);
  const anios = [];
  for (let a = partirClave(INICIO).anio; a <= partirClave(ultimo).anio; a++) anios.push(a);
  return anios;
}

// ---------- Validación ----------

// Devuelve una lista de errores (vacía si todo está bien).
export function validarRegistro(anio, mes, r) {
  const errores = [];
  const dias = r?.dias ?? [];
  const max = diasEnMes(anio, mes);
  if (dias.length > MAX_DIAS) errores.push(`Como máximo ${MAX_DIAS} días por mes.`);
  for (const d of dias) {
    if (!Number.isInteger(d) || d < 1 || d > max) {
      errores.push(`El día ${d} no existe en ${nombreMes(claveMes(anio, mes))}.`);
    }
  }
  const repetidos = dias.filter((d, i) => dias.indexOf(d) !== i);
  for (const d of new Set(repetidos)) errores.push(`El día ${d} está repetido.`);
  if (r?.ausencia && !['vacaciones', 'baja'].includes(r.ausencia)) {
    errores.push(`Ausencia no válida: ${r.ausencia}.`);
  }
  if (r?.ausencia && dias.length > 0) {
    errores.push('Un mes completo de vacaciones o baja no puede tener días anotados.');
  }
  return errores;
}

// ---------- Resumen del año (para el informe) ----------

// Estado de cada mes para la tira de colores del informe:
// 'fuera' (antes de agosto de 2024), 'ausencia', 'abonado', 'pendiente', 'prevision' o 'vacio'.
export function estadoMes(datos, clave, persona, hoy) {
  if (clave < INICIO) return 'fuera';
  const r = registro(datos, clave, persona);
  if (r.ausencia) return 'ausencia';
  if (r.abonado) return 'abonado';
  if (r.dias.length === 0) return 'vacio';
  return clave > claveDeHoy(hoy) ? 'prevision' : 'pendiente';
}

// Totales del año de una persona: días solicitados frente al cupo y meses abonados/pendientes.
export function resumenAnual(datos, anio, persona, hoy) {
  let solicitados = 0;
  let cupo = 0;
  const estados = [];
  for (let m = 1; m <= 12; m++) {
    const clave = claveMes(anio, m);
    const r = registro(datos, clave, persona);
    const estado = estadoMes(datos, clave, persona, hoy);
    estados.push(estado);
    if (estado === 'fuera' || estado === 'ausencia') continue;
    solicitados += r.dias.length;
    if (r.dias.length > 0 || mesTerminado(clave, hoy)) cupo += PERSONAS[persona].cupo;
  }
  const cuenta = (e) => estados.filter((x) => x === e).length;
  return {
    solicitados,
    cupo,
    abonados: cuenta('abonado'),
    pendientes: cuenta('pendiente') + cuenta('prevision'),
    prevision: cuenta('prevision'),
    estados,
  };
}
