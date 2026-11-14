#!/bin/bash
# Genera los dos manuales (Word y PDF) con el índice numerado. Uso, desde la raíz del proyecto: bash scripts/manual/generar.sh
set -e
SOFFICE="/Applications/LibreOffice.app/Contents/MacOS/soffice"
M=scripts/manual; C=$M/capturas
N1=Manual_Control_Continuidades; N2=Manual_Control_Continuidades_Edicion
rm -f $C/paginas_*.json
construir() { NODE_PATH="$(npm root -g)" node $M/build_manual.js docs; mkdir -p app/ayuda; "$SOFFICE" --headless --convert-to pdf --outdir app/ayuda docs/$N1.docx docs/$N2.docx >/dev/null; }
construir   # primera pasada: sin números de página
python3 $M/paginas_indice.py app/ayuda/$N1.pdf $C/indice_consulta.json $C/paginas_consulta.json
python3 $M/paginas_indice.py app/ayuda/$N2.pdf $C/indice_edicion.json $C/paginas_edicion.json
construir   # segunda pasada: índice con números
cp app/ayuda/$N1.pdf app/ayuda/$N2.pdf docs/
