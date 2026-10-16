// PDF del escrito con jsPDF (se carga desde cdnjs solo cuando hace falta).

const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const JSPDF_SRI = 'sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==';

let carga = null;

function cargarJsPDF() {
  if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  carga ??= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = JSPDF_URL;
    s.integrity = JSPDF_SRI;
    s.crossOrigin = 'anonymous';
    s.referrerPolicy = 'no-referrer';
    s.onload = () => ok(window.jspdf.jsPDF);
    s.onerror = () => { carga = null; mal(new Error('No se ha podido cargar el generador de PDF. ¿Hay conexión a internet?')); };
    document.head.appendChild(s);
  });
  return carga;
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
