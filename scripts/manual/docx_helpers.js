'use strict';
/**
 * docx_helpers.js — Bloques de construcción probados para manuales de usuario elegantes con docx-js.
 * Requiere `docx` instalado global (`npm install -g docx`) y se ejecuta con:
 *   NODE_PATH="$(npm root -g)" node build_manual.js
 *
 * Uso: const H = require('./docx_helpers')(paleta, fuente);  // ver build_manual.js para un ejemplo completo.
 * `paleta` es un objeto de colores hex SIN '#' (ver PALETA_EJEMPLO abajo). No cambies el orden de
 * las claves top/left/bottom/right en los bordes — ver references/docx_gotchas.md, es importante.
 */
const fs = require('fs');
const path = require('path');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageBreak,
} = require('docx');

const PALETA_EJEMPLO = {
  // Colores de marca (ajusta a la app que documentes)
  principalOsc: '1F4E79', principal: '2E75B6', principalClaro: 'EAF2FB',
  verde: '2E8B57', verdeClaro: 'DCF0E4',      // Tips / trucos
  ambar: 'B5651D', ambarClaro: 'FBE7D2',      // Avisos importantes
  gris: '6B7280', grisClaro: 'F3F4F6',
  texto: '1F2933',
  rolExtra: '6A3FA0', rolExtraClaro: 'F1EAFB', // banda para un rol especial (Gestor, Admin...)
};

function crearHelpers(paleta = PALETA_EJEMPLO, fuente = 'Calibri') {
  const C = paleta;
  const ANCHO_CONTENIDO = 9026; // DXA, A4 con márgenes de 1"

  /* ---------- Imagen con marco y pie de figura ----------
   * OJO: NO uses `border` en un Paragraph para enmarcar la imagen — docx-js reordena mal los
   * elementos de w:pBdr (bug de la librería, ver references/docx_gotchas.md) y el .docx sale
   * inválido. Aquí se usa una tabla de 1 celda como marco: los bordes de TABLA sí se serializan
   * en el orden correcto.
   */
  function imagenConPie(rutaImagen, pie, anchoPx = 560) {
    const data = fs.readFileSync(rutaImagen);
    // Dimensiones reales del PNG/JPG (cabecera IHDR/SOF) para no deformar la imagen.
    const { width, height } = dimensionesImagen(data);
    const alto = Math.round(anchoPx * (height / width));
    const ext = path.extname(rutaImagen).slice(1).toLowerCase().replace('jpeg', 'jpg');
    const pad = 160;
    const anchoImgDxa = Math.round(anchoPx * 15); // 1 "px" docx-js = 1/96"; 1440 DXA = 1"
    const anchoTabla = anchoImgDxa + pad * 2;
    return [
      new Table({
        alignment: AlignmentType.CENTER,
        width: { size: anchoTabla, type: WidthType.DXA },
        columnWidths: [anchoTabla],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'D9DEE4' },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'D9DEE4' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D9DEE4' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'D9DEE4' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [new TableRow({ children: [new TableCell({
          width: { size: anchoTabla, type: WidthType.DXA },
          margins: { top: pad, bottom: pad, left: pad, right: pad },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({
            type: ext, data, transformation: { width: anchoPx, height: alto },
            altText: { title: pie, description: pie, name: path.basename(rutaImagen) },
          })] })],
        })] })],
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 },
        children: [new TextRun({ text: pie, italics: true, size: 18, color: C.gris, font: fuente })] }),
    ];
  }

  /* ---------- Varias imágenes en una fila (p. ej. capturas del móvil), cada una con su pie ---------- */
  function imagenesEnFila(items, anchoPx = 250) {
    const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const ancho = Math.floor(ANCHO_CONTENIDO / items.length);
    return [new Table({
      width: { size: ancho * items.length, type: WidthType.DXA }, columnWidths: items.map(() => ancho),
      borders: { top: sinBorde, left: sinBorde, bottom: sinBorde, right: sinBorde, insideHorizontal: sinBorde, insideVertical: sinBorde },
      rows: [new TableRow({ cantSplit: true, children: items.map((it) => {
        const data = fs.readFileSync(it.file);
        const { width, height } = dimensionesImagen(data);
        const ext = path.extname(it.file).slice(1).toLowerCase().replace('jpeg', 'jpg');
        return new TableCell({ width: { size: ancho, type: WidthType.DXA }, borders: { top: sinBorde, left: sinBorde, bottom: sinBorde, right: sinBorde },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: ext, data, transformation: { width: anchoPx, height: Math.round(anchoPx * (height / width)) },
              altText: { title: it.pie, description: it.pie, name: path.basename(it.file) } })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 }, children: [new TextRun({ text: it.pie, italics: true, size: 18, color: C.gris, font: fuente })] }),
          ] });
      }) })],
    }), new Paragraph({ spacing: { after: 80 }, children: [] })];
  }

  /* ---------- Títulos y párrafos ---------- */
  function h1(texto) {
    return new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun(texto)] });
  }
  function h2(texto) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(texto)] }); }
  function h3(texto) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(texto)] }); }

  // Soporta **negrita** dentro del string, igual que un markdown ligero.
  function runsFormateados(texto, extra = {}) {
    const partes = texto.split(/(\*\*.+?\*\*)/g);
    return partes.filter(Boolean).map((p) => {
      if (p.startsWith('**') && p.endsWith('**')) return new TextRun({ text: p.slice(2, -2), bold: true, font: fuente, ...extra });
      return new TextRun({ text: p, font: fuente, ...extra });
    });
  }
  function parrafo(texto, extra = {}) { return new Paragraph({ spacing: { after: 160 }, children: runsFormateados(texto, extra) }); }
  function bullet(texto, ref = 'bullets') { return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: runsFormateados(texto) }); }
  function numerado(texto, instance = 1, ref = 'numeros') { return new Paragraph({ numbering: { reference: ref, level: 0, instance }, spacing: { after: 80 }, children: runsFormateados(texto) }); }

  /* ---------- Cajas de color (Tips, avisos, banda de rol) ----------
   * Igual que con las imágenes: se usa una tabla de 1 celda (no `border` de Paragraph) por el
   * mismo bug de docx-js. */
  function caja({ icono, titulo, color, colorClaro, lineas }) {
    const cellChildren = [
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `${icono}  ${titulo}`, bold: true, color, font: fuente, size: 22 })] }),
      ...lineas.map((l) => new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: '— ', color, font: fuente }), ...runsFormateados(l)] })),
    ];
    return new Table({
      width: { size: ANCHO_CONTENIDO, type: WidthType.DXA }, columnWidths: [ANCHO_CONTENIDO],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color }, left: { style: BorderStyle.SINGLE, size: 4, color },
        bottom: { style: BorderStyle.SINGLE, size: 4, color }, right: { style: BorderStyle.SINGLE, size: 4, color },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      rows: [new TableRow({ children: [new TableCell({
        width: { size: ANCHO_CONTENIDO, type: WidthType.DXA },
        shading: { fill: colorClaro, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        children: cellChildren,
      })] })],
    });
  }
  // Truco práctico (verde). Úsalo para atajos, "así te ahorras tiempo", etc.
  function tip(titulo, lineas) {
    return [caja({ icono: '💡', titulo: 'Truco: ' + titulo, color: C.verde, colorClaro: C.verdeClaro, lineas }), new Paragraph({ spacing: { after: 160 }, children: [] })];
  }
  // Aviso importante (ámbar). Para plazos, limitaciones, "ojo con esto".
  function aviso(titulo, lineas) {
    return [caja({ icono: '⚠️', titulo, color: C.ambar, colorClaro: C.ambarClaro, lineas }), new Paragraph({ spacing: { after: 160 }, children: [] })];
  }
  // Banda para diferenciar contenido exclusivo de un rol (Gestor, Admin...) dentro de un manual
  // que por lo demás es común a todos los roles. Cambia `rotuloRol` según el rol que documentes.
  function bandaRol(rotuloRol, lineas) {
    return [caja({ icono: '🔐', titulo: `Solo para ${rotuloRol}`, color: C.rolExtra, colorClaro: C.rolExtraClaro, lineas }), new Paragraph({ spacing: { after: 160 }, children: [] })];
  }
  // Una entrada de Preguntas Frecuentes: número en círculo azul + pregunta en negrita, respuesta debajo.
  // Úsalo dentro de un capítulo "Preguntas frecuentes" al FINAL del manual (ver build_manual.js).
  function preguntaFrecuente(numero, pregunta, respuesta) {
    return [
      new Paragraph({ spacing: { before: 160, after: 40 },
        children: [new TextRun({ text: `${numero}. `, bold: true, color: C.principal, font: fuente }), new TextRun({ text: pregunta, bold: true, font: fuente })] }),
      parrafo(respuesta),
    ];
  }

  /* ---------- Tablas de datos ---------- */
  function celda(texto, { header = false, ancho, color } = {}) {
    return new TableCell({
      width: { size: ancho, type: WidthType.DXA },
      shading: header ? { fill: C.principalOsc, type: ShadingType.CLEAR } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      borders: { top: { style: BorderStyle.SINGLE, size: 2, color: 'D9DEE4' }, left: { style: BorderStyle.SINGLE, size: 2, color: 'D9DEE4' },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: 'D9DEE4' }, right: { style: BorderStyle.SINGLE, size: 2, color: 'D9DEE4' } },
      children: [new Paragraph({ children: [new TextRun({ text: texto, bold: header, color: header ? 'FFFFFF' : (color || C.texto), font: fuente, size: 20 })] })],
    });
  }
  function tabla(cabeceras, filas, anchos) {
    const anchoTotal = anchos.reduce((a, b) => a + b, 0);
    return new Table({
      width: { size: anchoTotal, type: WidthType.DXA }, columnWidths: anchos,
      rows: [
        new TableRow({ tableHeader: true, children: cabeceras.map((c, i) => celda(c, { header: true, ancho: anchos[i] })) }),
        ...filas.map((f) => new TableRow({ children: f.map((c, i) => celda(c, { ancho: anchos[i] })) })),
      ],
    });
  }

  const numeracion = {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 560, hanging: 300 } } } }] },
      { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 560, hanging: 300 } } } }] },
    ],
  };

  return { h1, h2, h3, parrafo, bullet, numerado, runsFormateados, tip, aviso, bandaRol, tabla, imagenConPie, imagenesEnFila,
    preguntaFrecuente, ANCHO_CONTENIDO, PageBreak, numeracion, C, fuente };
}

// Lee el ancho/alto real de un PNG o JPEG desde sus bytes (sin dependencias).
function dimensionesImagen(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) { // PNG: IHDR siempre en el byte 16
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xFF && buf[1] === 0xD8) { // JPEG: buscar el primer marcador SOFn
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xFF) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xC0 && marker <= 0xC3) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  throw new Error('Formato de imagen no reconocido (usa PNG o JPEG).');
}

module.exports = crearHelpers;
module.exports.PALETA_EJEMPLO = PALETA_EJEMPLO;
module.exports.dimensionesImagen = dimensionesImagen;
