// Pantallas de la app. Los cálculos están en calculo.js y el texto del escrito en escrito.js.

import {
  INICIO, PERSONAS, NOMBRES_MES, ABREV_MES, claveMes, partirClave, nombreMes, rangoMeses,
  diaSemana, registro, debitoMensual, acumuladoAnio, debitoAnual, acumuladoTotal, abonadoHasta,
  resumen, aniosDisponibles, claveDeHoy, mesTerminado, mesSiguiente, MAX_DIAS,
} from './calculo.js?v=1.2';
import { aplicarMes, mensajeCommit, validarMes } from './datos.js?v=1.2';
import {
  repositorio, leerToken, guardarToken, olvidarToken, leerDatos, guardarDatos, comprobarToken, ErrorConflicto,
} from './github.js?v=1.2';
import {
  CORREO, SALUDOS, generarEscrito, asuntoEscrito, enlaceCorreo, nombrePdf, propuestaEscrito,
} from './escrito.js?v=1.2';
import { crearPdf } from './pdf.js?v=1.2';
import { VERSION, ANIO, AUTOR, HISTORIAL } from './version.js?v=1.2';

const URL_DATOS = '../datos/continuidades.json';

const estado = {
  datos: null,
  hoy: new Date(),
  mesResumen: null,
  anioHistorico: 'todos',
  anioInforme: null,
  escrito: null, // opciones del formulario del escrito
  token: null, // token de GitHub (solo en este dispositivo)
  sha: null, // versión del archivo en GitHub que se ha cargado
  edicion: null, // borrador del mes que se está editando
  avisoCarga: '',
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

// ---------- Escrito ----------

function vistaEscrito() {
  estado.escrito ??= propuestaEscrito(estado.datos, estado.hoy);
  const o = estado.escrito;
  const meses = rangoMeses(INICIO, mesSiguiente(ultimoMes())).reverse()
    .map((c) => `<option value="${c}"${c === o.primerMes ? ' selected' : ''}>${nombreMes(c)}</option>`).join('');
  const num = [1, 2, 3, 4].map((n) => `<option${n === o.numMeses ? ' selected' : ''}>${n}</option>`).join('');
  const saludos = SALUDOS.map((x) => `<option${x === o.saludo ? ' selected' : ''}>${x}</option>`).join('');
  const texto = generarEscrito(estado.datos, o, estado.hoy);
  const compartir = puedeCompartirArchivos();

  return `
    <h2>Escrito a Gerencia</h2>
    <div class="formulario">
      <label>Primer mes <select id="esc-primer">${meses}</select></label>
      <label>Número de meses <select id="esc-num">${num}</select></label>
      <label>Saludo <select id="esc-saludo">${saludos}</select></label>
      <label class="casilla"><input type="checkbox" id="esc-prev"${o.prevision ? ' checked' : ''}> El último mes es previsión</label>
    </div>
    <dl class="correo">
      <div><dt>Para</dt><dd>${CORREO.para.join(', ')}</dd></div>
      <div><dt>CCO</dt><dd>${CORREO.cco.join(', ')}</dd></div>
      <div><dt>Asunto</dt><dd id="esc-asunto">${esc(asuntoEscrito(o))}</dd></div>
    </dl>
    <textarea id="esc-texto" class="texto-escrito" readonly rows="18">${esc(texto)}</textarea>
    <div class="botones">
      <button class="boton" id="btn-copiar" type="button">Copiar texto</button>
      <button class="boton" id="btn-correo" type="button">Abrir correo</button>
      <button class="boton secundario" id="btn-pdf" type="button">Guardar PDF</button>
      ${compartir ? '<button class="boton secundario" id="btn-compartir" type="button">Compartir PDF (Drive)</button>' : ''}
    </div>
    <p id="esc-aviso" class="aviso" role="status"></p>
    <p class="nota">El correo se envía desde tu cuenta corporativa (${CORREO.de}).
      El PDF se archiva en Google Drive: <b>Mi unidad › Control Continuidades › Escritos › ${partirClave(o.primerMes).anio}</b>${
      compartir ? '. En el móvil, pulsa «Compartir PDF» y elige Drive.' : '.'}</p>`;
}

function puedeCompartirArchivos() {
  try {
    const prueba = new File(['x'], 'prueba.pdf', { type: 'application/pdf' });
    return !!navigator.canShare?.({ files: [prueba] }) && matchMedia('(pointer: coarse)').matches;
  } catch { return false; }
}

function aviso(texto, error = false) {
  const el = document.getElementById('esc-aviso');
  if (!el) return;
  el.textContent = texto;
  el.classList.toggle('error', error);
}

async function copiarTexto() {
  const texto = generarEscrito(estado.datos, estado.escrito, estado.hoy);
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const ta = document.getElementById('esc-texto');
    ta.select();
    document.execCommand('copy');
  }
  aviso('Texto copiado. Ya puedes pegarlo en el correo.');
}

function abrirCorreo() {
  const o = estado.escrito;
  location.href = enlaceCorreo(asuntoEscrito(o), generarEscrito(estado.datos, o, estado.hoy));
}

async function pdfDelEscrito() {
  const o = estado.escrito;
  const fecha = estado.hoy.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const blob = await crearPdf(generarEscrito(estado.datos, o, estado.hoy), [
    ['De', CORREO.de],
    ['Para', CORREO.para.join(', ')],
    ['CCO', CORREO.cco.join(', ')],
    ['Asunto', asuntoEscrito(o)],
    ['Fecha', fecha],
  ]);
  return { blob, nombre: nombrePdf(o, estado.hoy) };
}

async function guardarPdf() {
  aviso('Preparando el PDF…');
  try {
    const { blob, nombre } = await pdfDelEscrito();
    // En Chrome/Edge del ordenador se puede elegir la carpeta (la de Google Drive) y la recuerda.
    if (window.showSaveFilePicker) {
      try {
        const h = await window.showSaveFilePicker({
          suggestedName: nombre, id: 'escritos', startIn: 'documents',
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        });
        const w = await h.createWritable();
        await w.write(blob);
        await w.close();
        aviso(`Guardado: ${nombre}`);
        return;
      } catch (err) {
        if (err.name === 'AbortError') { aviso(''); return; }
      }
    }
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    aviso(`Descargado: ${nombre}. Muévelo a la carpeta Escritos de Google Drive.`);
  } catch (err) {
    aviso(err.message, true);
  }
}

async function compartirPdf() {
  aviso('Preparando el PDF…');
  try {
    const { blob, nombre } = await pdfDelEscrito();
    const archivo = new File([blob], nombre, { type: 'application/pdf' });
    await navigator.share({ files: [archivo], title: nombre });
    aviso('');
  } catch (err) {
    if (err.name !== 'AbortError') aviso(err.message, true);
    else aviso('');
  }
}

// ---------- Editar (solo con token) ----------

function borradorDelMes(clave) {
  const reg = (p) => {
    const r = registro(estado.datos, clave, p);
    const dias = r.dias.map(String);
    while (dias.length < MAX_DIAS) dias.push('');
    return { dias, ausencia: r.ausencia, abonado: r.abonado };
  };
  return { clave, registros: { rafa: reg('rafa'), carlos: reg('carlos') }, sucio: false, guardando: false };
}

function registrosDelBorrador() {
  const out = {};
  for (const [p, r] of Object.entries(estado.edicion.registros)) {
    out[p] = {
      dias: r.ausencia ? [] : r.dias.filter((d) => d.trim() !== '').map(Number),
      ausencia: r.ausencia,
      abonado: r.abonado,
    };
  }
  return out;
}

function textoSemana(clave, valor) {
  const d = Number(valor);
  if (valor.trim() === '') return '';
  const { anio, mes } = partirClave(clave);
  if (!Number.isInteger(d) || d < 1 || d > new Date(anio, mes, 0).getDate()) return '¡no existe!';
  return diaSemana(anio, mes, d);
}

function vistaEditar() {
  if (!estado.token) return '<h2>Editar</h2><p class="vacio">Para editar, pega tu token en Ajustes.</p>';
  estado.edicion ??= borradorDelMes(claveDeHoy(estado.hoy));
  const ed = estado.edicion;
  const meses = rangoMeses(INICIO, mesSiguiente(ultimoMes(), 2)).reverse()
    .map((c) => `<option value="${c}"${c === ed.clave ? ' selected' : ''}>${nombreMes(c)}${estado.datos.meses[c] ? '' : ' (vacío)'}</option>`).join('');

  const bloques = Object.keys(PERSONAS).map((p) => {
    const r = ed.registros[p];
    const campos = r.dias.map((v, i) => `
      <div class="campo-dia">
        <input type="number" inputmode="numeric" min="1" max="31" placeholder="—" value="${esc(v)}"
          data-p="${p}" data-i="${i}" class="ed-dia" aria-label="${PERSONAS[p].nombre}, día ${i + 1}"${r.ausencia ? ' disabled' : ''}>
        <span class="sem" id="sem-${p}-${i}">${r.ausencia ? '' : textoSemana(ed.clave, v)}</span>
      </div>`).join('');
    return `
      <fieldset class="tarjeta editor">
        <legend>${PERSONAS[p].nombre} <small>cupo ${PERSONAS[p].cupo}</small></legend>
        <div class="dias-editor">${campos}</div>
        <label>Mes completo
          <select class="ed-ausencia" data-p="${p}">
            <option value=""${!r.ausencia ? ' selected' : ''}>Trabajado (se cuentan los días)</option>
            <option value="vacaciones"${r.ausencia === 'vacaciones' ? ' selected' : ''}>Vacaciones (sin débito)</option>
            <option value="baja"${r.ausencia === 'baja' ? ' selected' : ''}>Baja (sin débito)</option>
          </select>
        </label>
        <label class="casilla"><input type="checkbox" class="ed-abonado" data-p="${p}"${r.abonado ? ' checked' : ''}> Abonado</label>
        <ul class="errores" id="err-${p}"></ul>
      </fieldset>`;
  }).join('');

  return `
    <h2>Alta y edición mensual</h2>
    <div class="barra">
      <label for="ed-mes">Mes</label>
      <select id="ed-mes">${meses}</select>
    </div>
    <div class="tarjetas">${bloques}</div>
    <div class="botones">
      <button class="boton" id="btn-guardar" type="button">Guardar en GitHub</button>
      <button class="boton secundario" id="btn-deshacer" type="button">Deshacer cambios</button>
    </div>
    <p id="ed-aviso" class="aviso" role="status"></p>
    <p class="nota">Al guardar se hace un commit en GitHub. La app publicada se actualiza en uno o dos minutos.</p>`;
}

function refrescarEditor() {
  const ed = estado.edicion;
  if (!ed || !document.getElementById('btn-guardar')) return;
  const errores = validarMes(ed.clave, registrosDelBorrador());
  let hay = false;
  for (const p of Object.keys(PERSONAS)) {
    ed.registros[p].dias.forEach((v, i) => {
      const s = document.getElementById(`sem-${p}-${i}`);
      const t = ed.registros[p].ausencia ? '' : textoSemana(ed.clave, v);
      s.textContent = t;
      s.classList.toggle('mal', t === '¡no existe!');
    });
    document.getElementById(`err-${p}`).innerHTML = errores[p].map((e) => `<li>${esc(e)}</li>`).join('');
    if (errores[p].length) hay = true;
  }
  const b = document.getElementById('btn-guardar');
  b.disabled = hay || !ed.sucio || ed.guardando;
  b.textContent = ed.guardando ? 'Guardando…' : 'Guardar en GitHub';
  document.getElementById('btn-deshacer').disabled = !ed.sucio || ed.guardando;
}

function avisoEditor(texto, error = false) {
  const el = document.getElementById('ed-aviso');
  if (!el) return;
  el.textContent = texto;
  el.classList.toggle('error', error);
}

async function guardarMes() {
  const ed = estado.edicion;
  const registros = registrosDelBorrador();
  const errores = validarMes(ed.clave, registros);
  if (Object.values(errores).some((e) => e.length)) return;
  ed.guardando = true;
  refrescarEditor();
  avisoEditor('Guardando en GitHub…');
  const mensaje = mensajeCommit(estado.datos, ed.clave);
  const nuevos = aplicarMes(estado.datos, ed.clave, registros, new Date());
  try {
    estado.sha = await guardarDatos(estado.token, nuevos, estado.sha, mensaje);
    estado.datos = nuevos;
    estado.escrito = null;
    estado.edicion = borradorDelMes(ed.clave);
    pintar();
    avisoEditor(`Guardado («${mensaje}»).`);
  } catch (err) {
    ed.guardando = false;
    if (err instanceof ErrorConflicto) {
      await recargarDesdeGitHub();
      estado.edicion = borradorDelMes(ed.clave);
      pintar();
    } else {
      refrescarEditor();
    }
    avisoEditor(err.message, true);
  }
}

function cambiarMesEditor(clave) {
  if (estado.edicion?.sucio && !confirm('Hay cambios sin guardar en este mes. ¿Descartarlos?')) {
    document.getElementById('ed-mes').value = estado.edicion.clave;
    return;
  }
  estado.edicion = borradorDelMes(clave);
  pintar();
}

function entradaEditor(e) {
  const t = e.target;
  const ed = estado.edicion;
  if (!ed || !t.dataset.p) return false;
  const r = ed.registros[t.dataset.p];
  if (t.classList.contains('ed-dia')) r.dias[Number(t.dataset.i)] = t.value;
  else if (t.classList.contains('ed-abonado')) r.abonado = t.checked;
  else if (t.classList.contains('ed-ausencia')) {
    r.ausencia = t.value || null;
    if (r.ausencia && r.dias.some((d) => d !== '') && !confirm('Se borrarán los días anotados de este mes. ¿Seguir?')) {
      t.value = '';
      r.ausencia = null;
      return true;
    }
    if (r.ausencia) r.dias = r.dias.map(() => '');
    ed.sucio = true;
    pintar();
    return true;
  } else return false;
  ed.sucio = true;
  refrescarEditor();
  return true;
}

// ---------- Ajustes ----------

function vistaAjustes() {
  const { owner, repo } = repositorio();
  const conToken = !!estado.token;
  const formulario = conToken
    ? `<p>✅ Este dispositivo tiene guardado un token de edición${estado.avisoCarga ? '' : ' y se puede editar'}.</p>
       <button class="boton secundario" id="btn-olvidar" type="button">Cerrar sesión / olvidar token</button>`
    : `<p>Para editar en este dispositivo, pega aquí el token de GitHub de Carlos.</p>
       <label class="campo">Token de GitHub
         <input type="password" id="aj-token" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…">
       </label>
       <button class="boton" id="btn-token" type="button">Guardar token</button>`;
  return `
    <h2>Ajustes</h2>
    ${conToken ? '' : `
    <section class="tarjeta"><div class="cuerpo">
      <p>👀 Esta app es de <b>consulta</b>: no hace falta configurar nada. Los datos se actualizan solos
        y, si hay cambios, sale un aviso con el botón «Actualizar».</p>
    </div></section>`}

    <details class="tarjeta plegable"${conToken || estado.avisoCarga ? ' open' : ''}>
      <summary>🔒 Modo edición <small>Solo para Carlos</small></summary>
      <div class="cuerpo">
        <p class="nota">Repositorio: ${esc(owner)}/${esc(repo)}</p>
        ${formulario}
        <p id="aj-aviso" class="aviso" role="status">${estado.avisoCarga ? esc(estado.avisoCarga) : ''}</p>
        <p class="nota">El token se guarda solo en este navegador (no va a GitHub ni al código).
          Si pierdes el móvil o el ordenador, revócalo en GitHub y crea otro.</p>

        <details class="guia">
          <summary>Cómo crear el token (una vez por dispositivo)</summary>
          <ol>
            <li>Desde el ordenador, entra en <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com › Settings › Developer settings › Personal access tokens › <b>Fine-grained tokens</b> › Generate new token</a>. Si Chrome traduce la página, pulsa «Mostrar original»: la traducción estropea el formulario.</li>
            <li><b>Token name</b>: por ejemplo <code>Continuidades - Mac</code> o <code>Continuidades - móvil</code>.</li>
            <li><b>Expiration</b>: como máximo 1 año. Al caducar, la app sigue consultándose, pero no guarda: se crea otro igual.</li>
            <li><b>Repository access</b>: <i>Only select repositories</i> → <b>${esc(repo)}</b>. Solo ese.</li>
            <li><b>Permissions</b> → <i>Add permissions</i> → <b>Contents</b> → <i>Read and write</i>. Nada más (Metadata se pone solo).</li>
            <li>Pulsa <b>Generate token</b> y copia el texto que empieza por <code>github_pat_</code>. GitHub solo lo enseña una vez.</li>
            <li>Pégalo arriba y pulsa <b>Guardar token</b>. Aparecerá la pestaña <b>Editar</b>.</li>
          </ol>
          <p class="nota">Para el móvil: créalo en el ordenador, pásalo de forma privada (AirDrop a Notas, por ejemplo),
            pégalo aquí y borra la nota.</p>
        </details>
      </div>
    </details>`;
}

async function guardarTokenDesdeAjustes() {
  const input = document.getElementById('aj-token');
  const token = input.value.trim();
  const av = document.getElementById('aj-aviso');
  if (!token) return;
  av.classList.remove('error');
  av.textContent = 'Comprobando el token…';
  try {
    const repo = await comprobarToken(token);
    guardarToken(token);
    estado.token = token;
    await recargarDesdeGitHub();
    actualizarModo();
    pintar();
    document.getElementById('aj-aviso').textContent = `Token correcto: puedes editar ${repo}.`;
  } catch (err) {
    av.classList.add('error');
    av.textContent = err.message;
  }
}

function olvidarTokenDesdeAjustes() {
  if (!confirm('¿Olvidar el token en este dispositivo? Podrás volver a pegarlo cuando quieras.')) return;
  olvidarToken();
  estado.token = null;
  estado.sha = null;
  estado.edicion = null;
  estado.avisoCarga = '';
  actualizarModo();
  pintar();
}

// ---------- Portada ----------

const pie = () => `<p class="autoria">Diseñado y desarrollado por ${AUTOR} · v${VERSION} · ${ANIO}</p>`;

function vistaInicio() {
  const act = estado.datos.actualizado
    ? `Datos actualizados el ${estado.datos.actualizado.split('-').reverse().join('/')}.` : '';
  return `
    <section class="portada">
      <img src="img/icono-512.png" alt="" class="portada-logo" width="120" height="120">
      <h2>Control de Continuidades</h2>
      <p class="portada-sub">Área de Calidad y Seguridad del Paciente · Hospital Comarcal de Montilla</p>
      <p class="portada-texto">Registro de las <b>continuidades asistenciales extra</b> de Rafa (5 al mes) y Carlos (4 al mes)
        desde agosto de 2024: días realizados, <b>débitos</b> mensuales y acumulados, informe anual
        y el <b>escrito mensual a Gerencia</b> con los días y la previsión del mes siguiente.</p>
      <p class="nota">${act} <a href="#ayuda">Ayuda e historial de versiones</a></p>
      ${pie()}
    </section>`;
}

// ---------- Ayuda ----------

function vistaAyuda() {
  const historial = HISTORIAL.map((h) => `<li><b>v${h.version} · ${h.fecha}</b> — ${esc(h.cambios)}</li>`).join('');
  return `
    <h2>Ayuda</h2>
    <section class="tarjeta ayuda"><div class="cuerpo">
      <h3>Para qué sirve</h3>
      <p>Sustituye al Excel de continuidades: guarda los días que hace cada uno, calcula lo que se debe
        (cupo de 5 para Rafa y 4 para Carlos) y prepara el escrito mensual para Gerencia.</p>

      <h3>Pantallas</h3>
      <ul>
        <li><b>Resumen</b>: débito del mes, acumulado del año, débito anual, acumulado total y hasta qué mes se ha abonado.</li>
        <li><b>Histórico</b>: todos los meses desde agosto de 2024, con filtro por año. ✓ = abonado.</li>
        <li><b>Informe</b>: el año en formato parecido a la hoja del Excel. Botón «Imprimir» (también sirve para guardar en PDF).</li>
        <li><b>Escrito</b>: el texto para Gerencia, con «Copiar texto», «Abrir correo» y «Guardar PDF» (en el móvil, «Compartir PDF» para mandarlo a Drive).</li>
        <li><b>Editar</b> (solo Carlos, con su token): anotar los días del mes, vacaciones o baja del mes completo y «abonado».</li>
      </ul>

      <h3>Cómo se calcula</h3>
      <ul>
        <li>Débito del mes = cupo − días hechos. Si se hacen más días que el cupo, sale a favor (+).</li>
        <li>Un mes ya terminado sin días cuenta el débito completo. Un mes futuro sin días no cuenta todavía.</li>
        <li>Vacaciones o baja del mes completo: sin débito.</li>
        <li>Los días de la semana se calculan solos; no se puede anotar un día que no existe ni repetirlo.</li>
      </ul>

      <h3>Avisos de cambios</h3>
      <p>Si mientras tienes la app abierta se guardan datos nuevos (por ejemplo, desde otro dispositivo) o se publica
        una versión nueva, aparece arriba un aviso con el botón <b>Actualizar</b>. Al pulsarlo se recarga con lo último.</p>

      <h3>Instalarla en el móvil</h3>
      <ul>
        <li><b>iPhone</b> (Safari): botón Compartir → «Añadir a pantalla de inicio».</li>
        <li><b>Android</b> (Chrome): menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».</li>
      </ul>

      <h3>Privacidad</h3>
      <p>Cualquiera con el enlace puede consultar la app. Solo se puede modificar con el token de Carlos,
        que se guarda únicamente en sus dispositivos. Los escritos en PDF se archivan en Google Drive, no aquí.</p>

      <h3>Historial de versiones</h3>
      <ul class="historial">${historial}</ul>
      ${pie()}
    </div></section>`;
}

// ---------- Aviso de cambios (datos nuevos o versión nueva) ----------

const COMPROBAR_CADA_MS = 60 * 1000;
const canonico = (datos) => JSON.stringify(datos);
let datosPublicadosAlCargar = null; // para quien consulta sin token

async function hayVersionNueva() {
  const r = await fetch(`js/version.js?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) return null;
  const m = (await r.text()).match(/VERSION = '([^']+)'/);
  return m && m[1] !== VERSION ? m[1] : null;
}

async function hayDatosNuevos() {
  if (estado.token && estado.sha) {
    const { sha } = await leerDatos(estado.token);
    return sha !== estado.sha;
  }
  const publicados = canonico(await cargarDatosPublicos());
  return datosPublicadosAlCargar !== null && publicados !== datosPublicadosAlCargar;
}

function mostrarAvisoCambios(texto) {
  document.getElementById('aviso-cambios-texto').textContent = texto;
  document.getElementById('aviso-cambios').hidden = false;
}

async function comprobarCambios() {
  if (document.hidden || !document.getElementById('aviso-cambios').hidden) return;
  try {
    const v = await hayVersionNueva();
    if (v) { mostrarAvisoCambios(`🔄 Hay una versión nueva de la app (v${v}).`); return; }
    if (await hayDatosNuevos()) mostrarAvisoCambios('🔄 Se han guardado datos nuevos.');
  } catch { /* sin conexión: se vuelve a intentar más tarde */ }
}

function actualizarApp() {
  if (estado.edicion?.sucio && !confirm('Hay cambios sin guardar en Editar. ¿Actualizar y perderlos?')) return;
  estado.edicion = null;
  location.reload();
}

function vigilarCambios() {
  setInterval(comprobarCambios, COMPROBAR_CADA_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) comprobarCambios(); });
  document.getElementById('btn-actualizar-app').addEventListener('click', actualizarApp);
}

// ---------- Navegación ----------

const VISTAS = {
  inicio: vistaInicio,
  ayuda: vistaAyuda,
  resumen: vistaResumen,
  historico: vistaHistorico,
  informe: vistaInforme,
  escrito: vistaEscrito,
  editar: vistaEditar,
  ajustes: vistaAjustes,
};

function vistaActual() {
  const v = location.hash.slice(1);
  if (v === 'editar' && !estado.token) return 'ajustes';
  return VISTAS[v] ? v : 'inicio';
}

function pintar() {
  const v = vistaActual();
  document.querySelectorAll('#pestanas a').forEach((a) => a.classList.toggle('activa', a.dataset.vista === v));
  $contenido.innerHTML = VISTAS[v]();
  if (v === 'editar') refrescarEditor();
}

function actualizarModo() {
  document.querySelectorAll('.solo-edicion').forEach((el) => { el.hidden = !estado.token; });
  document.getElementById('estado').textContent = estado.token ? 'Modo edición' : '';
}

$contenido.addEventListener('input', (e) => {
  if (e.target.classList.contains('ed-dia')) entradaEditor(e);
});

$contenido.addEventListener('change', (e) => {
  const id = e.target.id;
  if (id === 'sel-mes') estado.mesResumen = e.target.value;
  else if (id === 'sel-anio-h') estado.anioHistorico = e.target.value;
  else if (id === 'sel-anio-i') estado.anioInforme = e.target.value;
  else if (id === 'esc-primer') estado.escrito.primerMes = e.target.value;
  else if (id === 'esc-num') estado.escrito.numMeses = Number(e.target.value);
  else if (id === 'esc-saludo') estado.escrito.saludo = e.target.value;
  else if (id === 'esc-prev') estado.escrito.prevision = e.target.checked;
  else if (id === 'ed-mes') { cambiarMesEditor(e.target.value); return; }
  else if (e.target.classList.contains('ed-ausencia')) { entradaEditor(e); return; }
  else if (e.target.classList.contains('ed-abonado')) { entradaEditor(e); return; }
  else return;
  pintar();
});

$contenido.addEventListener('click', (e) => {
  const acciones = {
    'btn-imprimir': () => window.print(),
    'btn-copiar': copiarTexto,
    'btn-correo': abrirCorreo,
    'btn-pdf': guardarPdf,
    'btn-compartir': compartirPdf,
    'btn-guardar': guardarMes,
    'btn-deshacer': () => { estado.edicion = borradorDelMes(estado.edicion.clave); pintar(); },
    'btn-token': guardarTokenDesdeAjustes,
    'btn-olvidar': olvidarTokenDesdeAjustes,
  };
  acciones[e.target.id]?.();
});

window.addEventListener('hashchange', () => { pintar(); window.scrollTo(0, 0); });

window.addEventListener('beforeunload', (e) => {
  if (estado.edicion?.sucio) e.preventDefault();
});

// ---------- Carga de datos ----------

async function cargarDatosPublicos() {
  // ?t= evita que el navegador o GitHub Pages devuelvan una copia antigua.
  const r = await fetch(`${URL_DATOS}?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`No se han podido cargar los datos (${r.status}).`);
  return r.json();
}

// Con token se lee directamente de GitHub: datos al momento y el "sha" necesario para guardar.
async function recargarDesdeGitHub() {
  const { datos, sha } = await leerDatos(estado.token);
  estado.datos = datos;
  estado.sha = sha;
  estado.avisoCarga = '';
}

async function iniciar() {
  estado.token = leerToken();
  actualizarModo();
  try {
    if (estado.token) {
      try {
        await recargarDesdeGitHub();
      } catch (err) {
        estado.avisoCarga = `No se ha podido leer de GitHub con el token: ${err.message} Se muestran los datos publicados; para guardar, revisa el token.`;
        estado.datos = await cargarDatosPublicos();
        datosPublicadosAlCargar = canonico(estado.datos);
      }
    } else {
      estado.datos = await cargarDatosPublicos();
      datosPublicadosAlCargar = canonico(estado.datos);
    }
    pintar();
    vigilarCambios();
  } catch (err) {
    $contenido.innerHTML = `<p class="error">${esc(err.message)}</p>`;
  }
}

iniciar();
