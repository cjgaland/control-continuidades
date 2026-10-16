// PDF del escrito con jsPDF (se carga desde cdnjs solo cuando hace falta).

const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const JSPDF_SRI = 'sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==';

// Plugin de tablas para el informe anual (compatible con jsPDF 2.5.1).
const TABLAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
const TABLAS_SRI = 'sha512-2/YdOMV+YNpanLCF5MdQwaoFRVbTmrJ4u4EpqS/USXAQNUDgI5uwYi6J98WVtJKcfe1AbgerygzDFToxAlOGEQ==';

const cargas = {};

function cargarScript(url, sri) {
  cargas[url] ??= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = url;
    s.integrity = sri;
    s.crossOrigin = 'anonymous';
    s.referrerPolicy = 'no-referrer';
    s.onload = ok;
    s.onerror = () => { delete cargas[url]; mal(new Error('No se ha podido cargar el generador de PDF. ¿Hay conexión a internet?')); };
    document.head.appendChild(s);
  });
  return cargas[url];
}

async function cargarJsPDF(conTablas = false) {
  await cargarScript(JSPDF_URL, JSPDF_SRI);
  if (conTablas) await cargarScript(TABLAS_URL, TABLAS_SRI);
  return window.jspdf.jsPDF;
}

// cabecera: [['Para', '...'], ['CCO', '...'], ['Asunto', '...'], ['Fecha', '...']]
export async function crearPdf(texto, cabecera) {
  const JsPDF = await cargarJsPDF();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const margen = 20;
  const ancho = 210 - 2 * margen;
  const limite = 297 - margen;
  let y = margen;

  const salto = (alto) => {
    if (y + alto > limite) { doc.addPage(); y = margen; }
  };

  doc.setFontSize(9);
  for (const [etiqueta, valor] of cabecera) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${etiqueta}:`, margen, y);
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(valor, ancho - 18);
    doc.text(lineas, margen + 18, y);
    y += 4.2 * lineas.length;
  }
  doc.setDrawColor(31, 56, 100);
  doc.line(margen, y, margen + ancho, y);
  y += 8;

  doc.setFontSize(11);
  const alto = 5.4;
  const cabecerasMes = /^(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre) \d{4}$/;
  for (const linea of texto.split('\n')) {
    if (linea === '') { y += alto * 0.6; continue; }
    const vineta = linea.startsWith('    • ');
    const negrita = cabecerasMes.test(linea);
    doc.setFont('helvetica', negrita ? 'bold' : 'normal');
    const x = vineta ? margen + 8 : margen;
    const partes = doc.splitTextToSize(vineta ? linea.trimStart() : linea, ancho - (x - margen));
    salto(alto * partes.length);
    doc.text(partes, x, y);
    y += alto * partes.length;
  }
  return doc.output('blob');
}

// ---------- Informe anual ----------

const MARINO = [31, 56, 100];
const CLARO = [217, 226, 243];
const CLARO_2 = [238, 243, 250];
const ROJO = [192, 0, 0];
const VERDE = [46, 125, 50];

// Colorea en rojo los débitos (> 0) y en verde los "a favor" (+n), como en la pantalla.
function colorDebito(celda) {
  const t = String(celda.cell.raw ?? '');
  if (/^[1-9]\d*$/.test(t)) celda.cell.styles.textColor = ROJO;
  else if (t.startsWith('+')) celda.cell.styles.textColor = VERDE;
}

const COLORES_ESTADO = {
  abonado: { fondo: VERDE, texto: [255, 255, 255] },
  pendiente: { fondo: [230, 149, 0], texto: [255, 255, 255] },
  prevision: { fondo: [251, 227, 179], texto: [138, 83, 0] },
  ausencia: { fondo: [109, 143, 199], texto: [255, 255, 255] },
  vacio: { fondo: [214, 219, 227], texto: [107, 114, 128] },
  fuera: { fondo: [255, 255, 255], texto: [192, 198, 208] },
};
const NOMBRES_ESTADO = { abonado: 'Abonado', pendiente: 'Pendiente', prevision: 'Previsión', ausencia: 'Vacaciones o baja', vacio: 'Sin días' };
const INICIALES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function dibujarResumen(doc, p, anio, x, y, ancho) {
  const r = p.resumen;
  doc.setFillColor(...CLARO_2);
  doc.setDrawColor(201, 211, 230);
  doc.roundedRect(x, y, ancho, 32, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MARINO);
  doc.text(`${p.corto} · ${anio}`, x + 3, y + 5);

  const cifras = [
    { n: String(r.solicitados), t: `solicitados de ${r.cupo} de cupo`, color: MARINO },
    { n: String(r.abonados), t: 'meses abonados', color: VERDE },
    { n: String(r.pendientes), t: r.prevision ? `pendientes (${r.prevision} previsión)` : 'meses pendientes', color: r.pendientes ? [178, 106, 0] : MARINO },
  ];
  const anchoCifra = (ancho - 6 - 4) / 3;
  cifras.forEach((c, i) => {
    const cx = x + 3 + i * (anchoCifra + 2);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cx, y + 7, anchoCifra, 12, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...c.color);
    doc.text(c.n, cx + anchoCifra / 2, y + 12.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(c.t, cx + anchoCifra / 2, y + 16.8, { align: 'center' });
  });

  const anchoMes = (ancho - 6 - 11 * 1) / 12;
  r.estados.forEach((e, i) => {
    const mx = x + 3 + i * (anchoMes + 1);
    const col = COLORES_ESTADO[e];
    doc.setFillColor(...col.fondo);
    doc.setDrawColor(e === 'fuera' || e === 'prevision' ? 214 : 255, e === 'fuera' || e === 'prevision' ? 180 : 255, e === 'fuera' || e === 'prevision' ? 120 : 255);
    doc.roundedRect(mx, y + 22, anchoMes, 7, 1, 1, e === 'fuera' || e === 'prevision' ? 'FD' : 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...col.texto);
    doc.text(INICIALES[i], mx + anchoMes / 2, y + 26.6, { align: 'center' });
  });
}

function dibujarLeyenda(doc, centro, y) {
  const elementos = Object.entries(NOMBRES_ESTADO);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const anchos = elementos.map(([, t]) => 5 + doc.getTextWidth(t) + 6);
  let x = centro - anchos.reduce((a, b) => a + b, 0) / 2;
  elementos.forEach(([e, t], i) => {
    const col = COLORES_ESTADO[e];
    doc.setFillColor(...col.fondo);
    doc.roundedRect(x, y - 2.8, 3.5, 3.5, 0.6, 0.6, 'F');
    doc.setTextColor(107, 114, 128);
    doc.text(t, x + 5, y);
    x += anchos[i];
  });
}

// informe: { titulo, subtitulo, totales: { cabecera: [...], filas: [[...]] },
//            personas: [{ nombre, filas: [[mes, dias, total, debito, acumulado, abonado]], pie: 'Débito anual 2026: 22' }],
//            pieDePagina: '...' }
export async function crearPdfInforme(informe) {
  const JsPDF = await cargarJsPDF(true);
  const doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const ancho = 297;
  const margen = 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...MARINO);
  doc.text(informe.titulo, ancho / 2, 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(informe.subtitulo, ancho / 2, 19.5, { align: 'center' });

  const estiloBase = {
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.2, lineColor: [201, 211, 230], lineWidth: 0.2, halign: 'center', valign: 'middle', textColor: [29, 36, 51] },
    headStyles: { fillColor: MARINO, textColor: 255, fontStyle: 'bold' },
  };

  doc.autoTable({
    ...estiloBase,
    startY: 23,
    margin: { left: (ancho - 130) / 2 },
    tableWidth: 130,
    head: [informe.totales.cabecera],
    body: informe.totales.filas,
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', fillColor: CLARO_2, cellWidth: 70 } },
    didParseCell: (c) => { if (c.section === 'body' && c.column.index > 0) colorDebito(c); },
  });

  const inicioTablas = doc.lastAutoTable.finalY + 5;
  const anchoTabla = (ancho - 2 * margen - 6) / 2;
  let finTablas = inicioTablas;
  informe.personas.forEach((p, i) => {
    doc.autoTable({
      ...estiloBase,
      startY: inicioTablas,
      margin: { left: margen + i * (anchoTabla + 6) },
      tableWidth: anchoTabla,
      head: [
        [{ content: p.nombre, colSpan: 6 }],
        ['Mes', 'Días', 'Total', 'Débito mes', 'Débito acum.', 'Abonado'],
      ],
      body: p.filas,
      foot: [[{ content: p.pie, colSpan: 6 }]],
      footStyles: { fillColor: MARINO, textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', fillColor: CLARO_2, cellWidth: 22 },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { cellWidth: 12 }, 3: { cellWidth: 16 }, 4: { cellWidth: 18 }, 5: { cellWidth: 15 },
      },
      didParseCell: (c) => {
        if (c.section === 'head' && c.row.index === 1) { c.cell.styles.fillColor = CLARO; c.cell.styles.textColor = MARINO; }
        if (c.section === 'body' && (c.column.index === 3 || c.column.index === 4)) colorDebito(c);
        if (c.section === 'body' && c.column.index === 5 && c.cell.raw === 'Sí') c.cell.styles.textColor = VERDE;
      },
    });
    finTablas = Math.max(finTablas, doc.lastAutoTable.finalY);
  });

  // Resumen del año: cifras y una tira con el estado de cada mes.
  const yRes = finTablas + 5;
  informe.personas.forEach((p, i) => {
    dibujarResumen(doc, p, informe.anio, margen + i * (anchoTabla + 6), yRes, anchoTabla);
  });
  dibujarLeyenda(doc, ancho / 2, yRes + 37);

  doc.setFontSize(7.5);
  doc.setTextColor(154, 161, 173);
  doc.text(informe.pieDePagina, ancho / 2, 210 - 6, { align: 'center' });
  return doc.output('blob');
}
