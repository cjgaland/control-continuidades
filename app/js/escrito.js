// Generación del escrito mensual a Gerencia (sin nada de interfaz).
// Formato: docs/modelo-escrito.md

import {
  PERSONAS, NOMBRES_MES, ABREV_MES, partirClave, nombreMes, mesSiguiente, diaSemana,
  registro, debitoMensual, acumuladoTotal, abonadoHasta, claveDeHoy, INICIO,
} from './calculo.js?v=1.4';

export const CORREO = {
  de: 'carlosjavier.galan.sspa@juntadeandalucia.es',
  para: ['pedromanuel.castro.sspa@juntadeandalucia.es', 'soledad.delgado.sspa@juntadeandalucia.es'],
  cco: ['rjavier.romero.sspa@juntadeandalucia.es'],
};

export const SALUDOS = ['Buenos días', 'Buenas tardes'];

// Débito con signo para el escrito: 0 → "0", 3 → "-3", -1 → "+1".
export function formatoDebito(n) {
  if (n === 0) return '0';
  return n > 0 ? `-${n}` : `+${-n}`;
}

// "Agosto de 2026"
function mesConDe(clave) {
  const { anio, mes } = partirClave(clave);
  return `${NOMBRES_MES[mes - 1]} de ${anio}`;
}

// Une una lista en castellano: "A", "A y B", "A, B y C".
function unir(lista) {
  if (lista.length <= 1) return lista.join('');
  return `${lista.slice(0, -1).join(', ')} y ${lista.at(-1)}`;
}

export function clavesDelEscrito(primerMes, numMeses) {
  return Array.from({ length: numMeses }, (_, i) => mesSiguiente(primerMes, i));
}

function frasePeriodo(claves, prevision, conArticulo) {
  const nombres = claves.map(nombreMes);
  if (!prevision) return unir(nombres);
  const prev = `${conArticulo ? 'la ' : ''}previsión de ${nombres.at(-1)}`;
  return unir([...nombres.slice(0, -1), prev]);
}

function fraseAbonado(datos) {
  const r = abonadoHasta(datos, 'rafa');
  const c = abonadoHasta(datos, 'carlos');
  if (!r && !c) return '';
  if (r === c) return ` Os confirmamos que han sido abonadas todas hasta ${mesConDe(r)}.`;
  const tramo = (persona, clave) => (clave ? `hasta ${mesConDe(clave)}` : 'todavía ninguna');
  return ` Os confirmamos que a Rafa se le han abonado todas ${tramo('rafa', r)} y a Carlos ${tramo('carlos', c)}.`;
}

function bloquePersona(datos, clave, persona, hoy) {
  const nombre = PERSONAS[persona].nombre;
  const r = registro(datos, clave, persona);
  if (r.ausencia) {
    return [`${nombre}: ${r.ausencia} el mes completo (sin débito).`];
  }
  const { anio, mes } = partirClave(clave);
  const deb = debitoMensual(datos, clave, persona, hoy);
  const acum = acumuladoTotal(datos, clave, persona, hoy);
  const aa = String(anio).slice(-2);
  const cabecera = persona === 'carlos' && deb === 0 && acum === 0
    ? `${nombre}:`
    : `${nombre}: Solicitados ${r.dias.length} (Débito mensual ${formatoDebito(deb)}; Acumulados 2024/${aa} ${formatoDebito(acum)})`;
  const vinetas = r.dias.map((d) => `    • Día ${d}, ${diaSemana(anio, mes, d)}.`);
  return [cabecera, ...vinetas];
}

// opciones: { primerMes: "AAAA-MM", numMeses: 1..4, prevision: bool, saludo: "Buenos días" | "Buenas tardes" }
export function generarEscrito(datos, opciones, hoy) {
  const { primerMes, numMeses, prevision, saludo } = opciones;
  const claves = clavesDelEscrito(primerMes, numMeses);

  const intro = claves.length === 1 && prevision
    ? `Esta es la previsión de las continuidades de ${nombreMes(claves[0])}.`
    : `Esta es la información de las continuidades de ${frasePeriodo(claves, prevision, true)}.`;

  const lineas = [
    `${saludo}, Sole y Pedro:`,
    '',
    `${intro}${fraseAbonado(datos)} Gracias.`,
  ];
  for (const clave of claves) {
    lineas.push('', nombreMes(clave));
    lineas.push(...bloquePersona(datos, clave, 'rafa', hoy));
    lineas.push(...bloquePersona(datos, clave, 'carlos', hoy));
  }
  return lineas.join('\n');
}

export function asuntoEscrito(opciones) {
  const claves = clavesDelEscrito(opciones.primerMes, opciones.numMeses);
  return `Continuidades Área de Calidad: ${frasePeriodo(claves, opciones.prevision, false)}`;
}

export function enlaceCorreo(asunto, cuerpo) {
  const q = (s) => encodeURIComponent(s.replace(/\r?\n/g, '\r\n'));
  return `mailto:${CORREO.para.join(',')}?bcc=${CORREO.cco.join(',')}&subject=${q(asunto)}&body=${q(cuerpo)}`;
}

// "2026-10-16_Escrito_Sep-Oct-Nov_2026.pdf" o "..._Escrito_Dic-2026_Ene-2027.pdf"
export function nombrePdf(opciones, hoy) {
  const claves = clavesDelEscrito(opciones.primerMes, opciones.numMeses);
  const f = hoy instanceof Date ? hoy : new Date(`${hoy}T12:00:00`);
  const fecha = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
  const partes = claves.map(partirClave);
  const mismoAnio = partes.every((p) => p.anio === partes[0].anio);
  const meses = mismoAnio
    ? `${partes.map((p) => ABREV_MES[p.mes - 1]).join('-')}_${partes[0].anio}`
    : partes.map((p) => `${ABREV_MES[p.mes - 1]}-${p.anio}`).join('_');
  return `${fecha}_Escrito_${meses}.pdf`;
}

// Propuesta para el formulario: desde el mes siguiente al último abonado (el más antiguo de los dos)
// hasta el mes siguiente al actual, que va como previsión. Máximo 4 meses.
export function propuestaEscrito(datos, hoy) {
  const abonados = ['rafa', 'carlos'].map((p) => abonadoHasta(datos, p));
  const base = abonados.some((c) => !c) ? null : abonados.sort()[0];
  const actual = claveDeHoy(hoy);
  const ultimo = mesSiguiente(actual);
  let primerMes = base ? mesSiguiente(base) : INICIO;
  if (primerMes > ultimo) primerMes = ultimo;
  let numMeses = 1;
  while (mesSiguiente(primerMes, numMeses) <= ultimo) numMeses++;
  if (numMeses > 4) {
    primerMes = mesSiguiente(ultimo, -3);
    numMeses = 4;
  }
  const f = hoy instanceof Date ? hoy : new Date();
  return {
    primerMes,
    numMeses,
    prevision: mesSiguiente(primerMes, numMeses - 1) > actual,
    saludo: f.getHours() < 14 ? 'Buenos días' : 'Buenas tardes',
  };
}
