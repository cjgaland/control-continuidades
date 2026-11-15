# Manuales de usuario (Word y PDF)

Genera `docs/Manual_Control_Continuidades.docx` (consulta) y `docs/Manual_Control_Continuidades_Edicion.docx` (todo lo anterior más lo exclusivo
del Modo edición, marcado con una banda morada), y sus PDF con el mismo nombre en `app/ayuda/` (los que enlaza el botón «Ver manual (PDF)»
de Ayuda y de Ajustes) y en `docs/`. Las capturas son de una carpeta de DEMOSTRACIÓN con datos inventados; **nunca** se hacen con
`datos/continuidades.json` real (el repositorio es público).

Necesita: `npm install -g docx`, LibreOffice, Google Chrome, Python con PyMuPDF (`fitz`) y Node 20+.

## 1. Demostración (carpeta aparte; `$D` p. ej. una carpeta temporal)
1. `node scripts/manual/semilla_demo.mjs $D` → copia `app/` a `$D/app` y crea `$D/datos/continuidades.json` ficticio (Rafa y Carlos, 2024-2026; abonado de Rafa hasta sept-2026 y de Carlos hasta oct-2026).
2. `node scripts/manual/servidor_demo.mjs $D 8830` (puerto libre; deja el servidor en marcha).
3. Si la demo se montó antes de generar los PDF, copia `app/ayuda/*.pdf` a `$D/app/ayuda/` para que el botón «Ver manual (PDF)» salga activo (el visor necesita también `app/vendor/pdfjs`, que la demo ya copia con `app/`).

## 2. Capturas
1. Chrome sin ventana: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9228 "--remote-allow-origins=*" --user-data-dir=<carpeta temporal> about:blank`
2. Desde `scripts/manual`:
   `DEMO_DIR=$D OUT_DIR=capturas node capturar.mjs pasos_consulta.json`
   `DEMO_DIR=$D OUT_DIR=capturas node capturar.mjs pasos_edicion.json`
   Ordenador 1440×900 y móvil 390×844 (los pasos se describen en la cabecera de `capturar.mjs`). Salen en `scripts/manual/capturas/` (ignorada por git).
   - Para el Modo edición se guarda un token FALSO en el `localStorage` del Chrome temporal. `capturar.mjs` intercepta toda la red: solo deja pasar el servidor local,
     contesta a `api.github.com` con los datos ficticios y simula el PUT de «Guardar» (no sale nada a internet); lo demás se bloquea.
3. Al terminar, parar el servidor y Chrome.

## 3. Word y PDF
`bash scripts/manual/generar.sh` (desde la raíz). Dos pasadas: genera Word y PDF, calcula la página de cada apartado (`paginas_indice.py`) y vuelve a
generar con el índice numerado (texto normal, no campo de Word, para que salga igual al convertir con LibreOffice). El contenido (capítulos, FAQ,
`soloRol` para lo exclusivo del Modo edición) está en `build_manual.js`; los bloques de construcción, en `docx_helpers.js`.
`pagina_pdf.py` convierte páginas de un PDF a PNG para revisarlas. `package.json` fuerza CommonJS en esta carpeta.

Tras regenerar, `npm test` comprueba que los PDF existen en `app/ayuda/`. Los PDF se publican: `.gitignore` bloquea `*.pdf` salvo `app/ayuda/*.pdf` y `docs/Manual_*.pdf`.
