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
  });

  doc.setFontSize(7.5);
  doc.setTextColor(154, 161, 173);
  doc.text(informe.pieDePagina, ancho / 2, 210 - 6, { align: 'center' });
  return doc.output('blob');
}
