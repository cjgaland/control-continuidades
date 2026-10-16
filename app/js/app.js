// Pantallas de la app. Los cálculos están en calculo.js y el texto del escrito en escrito.js.

import {
  INICIO, PERSONAS, NOMBRES_MES, ABREV_MES, claveMes, partirClave, nombreMes, rangoMeses,
  diaSemana, registro, debitoMensual, acumuladoAnio, debitoAnual, acumuladoTotal, abonadoHasta,
  resumen, aniosDisponibles, claveDeHoy, mesTerminado,
} from './calculo.js';

const URL_DATOS = '../datos/continuidades.json';

const estado = {
  datos: null,
  hoy: new Date(),
  mesResumen: null,
  anioHistorico: 'todos',
  anioInforme: null,
};

const $contenido = document.getElementById('contenido');

// ---------- Utilidades de presentación ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Débito como en el Excel: positivo = se debe (rojo); negativo = hechas de más (verde, con +).
function deb(n) {
  if (n > 0) return `<span class="debe">${n}</span>`;
  if (n < 0) return `<span class="favor" title="Hechas de más">+${-n}</span>`;
  return '0';
}

function mesConDe(clave) {
  if (!clave) return 'ninguno todavía';
  const { anio, mes } = partirClave(clave);
  return `${NOMBRES_MES[mes - 1]} de ${anio}`;
}

const abrevSemana = (a, m, d) => diaSemana(a, m, d).slice(0, 3);

function textoAusencia(a) {
  return a === 'vacaciones' ? 'Vacaciones el mes completo' : 'Baja el mes completo';
}

// Último mes a mostrar: el mayor entre el mes actual y el último con datos.
function ultimoMes() {
  const claves = Object.keys(estado.datos.meses).sort();
  const hoy = claveDeHoy(estado.hoy);
  return claves.length && claves.at(-1) > hoy ? claves.at(-1) : hoy;
}

function opcionesMes(seleccionado) {
  return rangoMeses(INICIO, ultimoMes()).reverse()
    .map((c) => `<option value="${c}"${c === seleccionado ? ' selected' : ''}>${nombreMes(c)}</option>`).join('');
}

function opcionesAnio(seleccionado, conTodos) {
  const anios = aniosDisponibles(estado.datos, estado.hoy).reverse();
  return (conTodos ? `<option value="todos"${seleccionado === 'todos' ? ' selected' : ''}>Todos</option>` : '')
    + anios.map((a) => `<option value="${a}"${String(a) === String(seleccionado) ? ' selected' : ''}>${a}</option>`).join('');
}

// ---------- Resumen ----------

function vistaResumen() {
  const clave = estado.mesResumen ?? claveDeHoy(estado.hoy);
  const { anio } = partirClave(clave);
  const tarjetas = Object.keys(PERSONAS).map((p) => {
    const r = resumen(estado.datos, p, clave, estado.hoy);
    const reg = registro(estado.datos, clave, p);
    const dias = reg.ausencia
      ? `<li class="aus">${textoAusencia(reg.ausencia)}</li>`
      : reg.dias.map((d) => `<li>${d} ${abrevSemana(anio, partirClave(clave).mes, d)}</li>`).join('')
        || '<li class="aus">Sin días anotados</li>';
    return `
      <article class="tarjeta">
        <header><strong>${PERSONAS[p].nombre}</strong><small>${esc(PERSONAS[p].completo)} · cupo ${PERSONAS[p].cupo} al mes</small></header>
        <div class="cuerpo">
          <dl class="cifras">
            <div class="cifra grande"><dt>Débito acumulado total</dt><dd>${deb(r.acumuladoTotal)}<span class="nota">desde agosto de 2024 hasta ${nombreMes(clave)}</span></dd></div>
            <div class="cifra"><dt>Débito del mes</dt><dd>${deb(r.debitoMes)}</dd></div>
            <div class="cifra"><dt>Acumulado ${anio}</dt><dd>${deb(r.acumuladoAnio)}<span class="nota">enero – ${NOMBRES_MES[partirClave(clave).mes - 1].toLowerCase()}</span></dd></div>
            <div class="cifra"><dt>Débito anual ${anio}</dt><dd>${deb(r.debitoAnual)}</dd></div>
            <div class="cifra"><dt>Días en ${NOMBRES_MES[partirClave(clave).mes - 1].toLowerCase()}</dt><dd>${reg.ausencia ? '—' : reg.dias.length}</dd></div>
          </dl>
          <ul class="dias">${dias}</ul>
          <p class="abonado-hasta">Abonado hasta: <b>${mesConDe(r.abonadoHasta)}</b></p>
        </div>
      </article>`;
  }).join('');

  return `
    <h2>Resumen</h2>
    <div class="barra">
      <label for="sel-mes">Mes</label>
      <select id="sel-mes">${opcionesMes(clave)}</select>
      ${!mesTerminado(clave, estado.hoy) && clave !== claveDeHoy(estado.hoy) ? '<span class="nota">(previsión)</span>' : ''}
    </div>
    <div class="tarjetas">${tarjetas}</div>`;
}

// ---------- Histórico ----------

function vistaHistorico() {
  const filtro = estado.anioHistorico;
  let claves = rangoMeses(INICIO, ultimoMes()).reverse();
  if (filtro !== 'todos') claves = claves.filter((c) => c.startsWith(`${filtro}-`));

  const tarjetas = claves.map((clave) => {
    const { anio, mes } = partirClave(clave);
    const futuro = clave > claveDeHoy(estado.hoy);
    const personas = Object.keys(PERSONAS).map((p) => {
      const reg = registro(estado.datos, clave, p);
      const dias = reg.ausencia
        ? textoAusencia(reg.ausencia)
        : reg.dias.map((d) => `${d} ${abrevSemana(anio, mes, d)}`).join(', ') || '—';
      return `
        <div class="persona">
          <b>${PERSONAS[p].nombre}${reg.abonado ? ' <span class="check" title="Abonado">✓</span>' : ''}</b>
          <div>${dias}</div>
          <div class="linea"><span>Débito mes</span><span>${deb(debitoMensual(estado.datos, clave, p, estado.hoy))}</span></div>
          <div class="linea"><span>Acum. ${anio}</span><span>${deb(acumuladoAnio(estado.datos, clave, p, estado.hoy))}</span></div>
          <div class="linea"><span>Acum. total</span><span>${deb(acumuladoTotal(estado.datos, clave, p, estado.hoy))}</span></div>
        </div>`;
    }).join('');
    return `
      <section class="mes">
        <h3>${nombreMes(clave)} <small>${futuro ? 'previsión' : ''}</small></h3>
        <div class="personas">${personas}</div>
      </section>`;
  }).join('');

  return `
    <h2>Histórico</h2>
    <div class="barra">
      <label for="sel-anio-h">Año</label>
      <select id="sel-anio-h">${opcionesAnio(filtro, true)}</select>
      <span class="nota">✓ = abonado</span>
    </div>
    <div class="lista-meses">${tarjetas || '<p class="vacio">No hay meses.</p>'}</div>`;
}

// ---------- Informe anual ----------

function tablaPersona(p, anio) {
  const d = estado.datos;
  const filas = [];
  for (let m = 1; m <= 12; m++) {
    const clave = claveMes(anio, m);
    const reg = registro(d, clave, p);
    const antes = clave < INICIO;
    const dias = antes ? '' : reg.ausencia
      ? `<em>${textoAusencia(reg.ausencia)}</em>`
      : reg.dias.map((x) => `<span class="nw">${x} ${abrevSemana(anio, m, x)}</span>`).join(' ');
    filas.push(`
      <tr>
        <td class="mes-nombre">${NOMBRES_MES[m - 1]}</td>
        <td class="dia-sem">${dias}</td>
        <td>${antes || reg.ausencia ? '' : reg.dias.length}</td>
        <td>${antes ? '' : deb(debitoMensual(d, clave, p, estado.hoy))}</td>
        <td>${antes ? '' : deb(acumuladoAnio(d, clave, p, estado.hoy))}</td>
        <td>${reg.abonado ? '<span class="check">✓</span>' : ''}</td>
      </tr>`);
  }
  return `
    <div class="desplazable"><table class="excel">
      <thead>
        <tr><th colspan="6">${esc(PERSONAS[p].completo)}</th></tr>
        <tr class="sub"><th>Mes</th><th>Días</th><th>Total</th><th>Débito mes</th><th>Débito acum.</th><th>Abon.</th></tr>
      </thead>
      <tbody>${filas.join('')}</tbody>
      <tfoot><tr><td colspan="3">Débito anual ${anio}</td><td colspan="3">${debitoAnual(d, anio, p, estado.hoy)}</td></tr></tfoot>
    </table></div>`;
}

function vistaInforme() {
  const anio = Number(estado.anioInforme ?? partirClave(claveDeHoy(estado.hoy)).anio);
  const d = estado.datos;
  const filaTotal = (titulo, fn) => `<tr><td class="mes-nombre">${titulo}</td>${
    Object.keys(PERSONAS).map((p) => `<td>${deb(fn(p))}</td>`).join('')}</tr>`;
  const hoyTxt = estado.hoy.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return `
    <h2 class="solo-pantalla">Informe anual</h2>
    <div class="barra">
      <label for="sel-anio-i">Año</label>
      <select id="sel-anio-i">${opcionesAnio(anio, false)}</select>
      <button class="boton" id="btn-imprimir" type="button">Imprimir</button>
    </div>
    <div class="informe">
      <p class="titulo">Continuidades Extras Área de Calidad · ${anio}</p>
      <p class="subtitulo">Hospital Comarcal de Montilla · Área de Gestión Sanitaria Sur de Córdoba · a ${hoyTxt}</p>
      <table class="excel totales">
        <thead><tr><th></th>${Object.keys(PERSONAS).map((p) => `<th>${PERSONAS[p].nombre}</th>`).join('')}</tr></thead>
        <tbody>
          ${anio - 1 >= partirClave(INICIO).anio ? filaTotal(`Débito anual ${anio - 1}`, (p) => debitoAnual(d, anio - 1, p, estado.hoy)) : ''}
          ${filaTotal(`Débito anual ${anio}`, (p) => debitoAnual(d, anio, p, estado.hoy))}
          ${filaTotal(`Acumulado total (desde ago 2024)`, (p) => acumuladoTotal(d, claveMes(anio, 12), p, estado.hoy))}
          <tr><td class="mes-nombre">Abonado hasta</td>${Object.keys(PERSONAS).map((p) => {
            const c = abonadoHasta(d, p);
            return `<td>${c ? `${ABREV_MES[partirClave(c).mes - 1]} ${partirClave(c).anio}` : '—'}</td>`;
          }).join('')}</tr>
        </tbody>
      </table>
      <div class="informe-cuerpo">
        ${Object.keys(PERSONAS).map((p) => tablaPersona(p, anio)).join('')}
      </div>
    </div>`;
}

// ---------- Pantallas de las fases siguientes ----------

const vistaPendiente = (titulo) => `<h2>${titulo}</h2><p class="vacio">Esta pantalla llega en la siguiente fase.</p>`;

// ---------- Navegación ----------

const VISTAS = {
  resumen: vistaResumen,
  historico: vistaHistorico,
  informe: vistaInforme,
  escrito: () => vistaPendiente('Escrito'),
  ajustes: () => vistaPendiente('Ajustes'),
};

function vistaActual() {
  const v = location.hash.slice(1);
  return VISTAS[v] ? v : 'resumen';
}

function pintar() {
  const v = vistaActual();
  document.querySelectorAll('#pestanas a').forEach((a) => a.classList.toggle('activa', a.dataset.vista === v));
  $contenido.innerHTML = VISTAS[v]();
}

$contenido.addEventListener('change', (e) => {
  const id = e.target.id;
  if (id === 'sel-mes') estado.mesResumen = e.target.value;
  else if (id === 'sel-anio-h') estado.anioHistorico = e.target.value;
  else if (id === 'sel-anio-i') estado.anioInforme = e.target.value;
  else return;
  pintar();
});

$contenido.addEventListener('click', (e) => {
  if (e.target.id === 'btn-imprimir') window.print();
});

window.addEventListener('hashchange', pintar);

// ---------- Carga de datos ----------

async function cargarDatos() {
  // ?t= evita que el navegador o GitHub Pages devuelvan una copia antigua.
  const r = await fetch(`${URL_DATOS}?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`No se han podido cargar los datos (${r.status}).`);
  return r.json();
}

async function iniciar() {
  try {
    estado.datos = await cargarDatos();
    pintar();
  } catch (err) {
    $contenido.innerHTML = `<p class="error">${esc(err.message)}</p>`;
  }
}

iniciar();
