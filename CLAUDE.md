# Control de Continuidades — Área de Calidad (Hospital Comarcal de Montilla)

## Qué es este proyecto
Control de las **continuidades asistenciales extra** que hacen **Rafa** (Rafael J. Romero de Castilla Gil,
responsable de la Unidad de Calidad y Seguridad del Paciente) y **Carlos** (Carlos J. Galán Doval)
en el Hospital Comarcal de Montilla (Área de Gestión Sanitaria Sur de Córdoba, SAS).
Por un acuerdo personal con Gerencia, a Rafa le corresponden **5** continuidades al mes y a Carlos **4**.
El control empezó en **agosto de 2024**. Hasta ahora se llevaba con un Excel (`excel/`), que se sustituye por una app web sencilla.

## Usuarios y forma de trabajar
- **Carlos** es el único que introduce datos (de momento). Edita **desde la propia app**, en el Mac o en el móvil, y usa Claude Code para el desarrollo.
- **Rafa** solo **consulta**: la app en modo lectura y los escritos archivados en Google Drive.
- Carlos no es programador profesional: habla con él en **castellano**, explica en lenguaje claro y no des por sabidos conceptos de git.

## Dónde vive cada cosa
| Qué | Dónde | Por qué |
|---|---|---|
| Código de la app, documentación y scripts | **GitHub** (repositorio de Carlos) | Control de versiones; Claude Code hace los commits y los push cuando Carlos lo pide |
| Datos (`datos/continuidades.json`) | **GitHub**, junto a la app | La app los carga al instante; un archivo pequeño (unos pocos KB) |
| App publicada | **GitHub Pages** | Para abrirla desde el móvil y el ordenador |
| **Archivo histórico de escritos (PDF)** | **Google Drive** de Carlos: `Mi unidad/Control Continuidades/Escritos/<año>/` | Mucho espacio y fácil de consultar desde la app de Drive; se comparte con Rafa como lector |

La app **no lee nada de Drive**, así que Drive no la ralentiza. Drive solo recibe los PDF ya terminados.

## Flujo mensual (entre el 15 y el 25 de cada mes, cuando sale el cuadrante)
1. Carlos abre la app (en el Mac o en el móvil), entra en modo edición y anota los días del mes (y la previsión del siguiente), las vacaciones o bajas de mes completo y lo que ya se ha abonado.
2. Al pulsar "Guardar", la app escribe `datos/continuidades.json` **directamente en GitHub** (un commit automático) mediante la API de GitHub.
3. La app genera el **escrito** (ver `docs/modelo-escrito.md`):
   - "Copiar texto" y "Abrir correo" (`mailto:` ya rellenado), que Carlos envía desde su cuenta corporativa.
   - "Guardar PDF": crea `AAAA-MM-DD_Escrito_<meses>.pdf`.
4. El PDF se archiva en Drive (`Escritos/<año>/`):
   - en el Mac, con Google Drive para escritorio, se guarda en la carpeta sincronizada;
   - en el móvil, se comparte o guarda en Drive con el menú "Compartir" del sistema (Web Share API) o se descarga y se sube.
5. GitHub Pages se actualiza solo en uno o dos minutos. Antes de trabajar con el código, Claude Code hace `git pull`, porque los datos cambian desde la app.

## Documentación (leer antes de programar)
- `docs/reglas-de-calculo.md` — cupos, débito mensual y acumulados, vacaciones y bajas, abonado, validaciones y **cifras de control para tests**.
- `docs/modelo-escrito.md` — formato exacto del escrito, destinatarios, ejemplo generado y errores que hay que evitar.
- `docs/ejemplos-escritos/*.pdf` — escritos reales enviados (referencia de estilo).
- `datos/continuidades.json` — **fuente de verdad** de los datos (extraída del Excel con `scripts/extraer_excel.py`).
- `excel/Continuidades_calidad_2024-2030.xlsx` — Excel histórico (solo como archivo; ya no se edita).

## Estructura del repositorio
```
app/        App web: index.html, css/, js/ (sin frameworks ni compilación)
datos/      continuidades.json — el único sitio donde se guardan los datos
docs/       Reglas, modelo del escrito y ejemplos
excel/      Excel histórico
scripts/    Utilidades (extraer_excel.py)
```
Los escritos en PDF **no** se guardan en el repositorio, van a Google Drive.

## Modelo de datos (`datos/continuidades.json`)
```json
{
  "version": 1,
  "meses": {
    "2026-10": {
      "rafa":   { "dias": [27],            "ausencia": null, "abonado": false },
      "carlos": { "dias": [6, 13, 20, 27], "ausencia": null, "abonado": false }
    }
  }
}
```
- `ausencia`: `null` | `"vacaciones"` | `"baja"` (mes completo, sin débito).
- Los débitos **no se guardan**: se calculan siempre a partir de los días.

## Modos de la app
- **Lectura** (por defecto, para todos): resumen, histórico, informe anual y escrito. Carga los datos por `fetch`.
  Para ver los cambios al momento, conviene leer el JSON con la API de GitHub o con `?t=<timestamp>`, para saltarse la caché de Pages.
- **Edición** (solo Carlos, en cualquier dispositivo): se activa en "Ajustes" pegando un **token de GitHub de grano fino**
  (*fine-grained personal access token*) con permiso **Contents: Read and write** **solo** sobre este repositorio.
  - El token se guarda únicamente en el `localStorage` de ese dispositivo y nunca en el repositorio. Tiene que haber un botón "Cerrar sesión / olvidar token".
  - Para guardar: `GET` del archivo (para obtener su `sha`), y después `PUT /repos/{owner}/{repo}/contents/datos/continuidades.json` con el contenido en base64 (UTF-8) y un mensaje del tipo "Datos: alta noviembre 2026".
    Si hay conflicto (409, el `sha` ha cambiado), avisa, recarga los datos y no sobrescribe.
  - Sin token, la interfaz de edición no aparece. La seguridad real la pone el token: sin él, nadie puede escribir.

## Decisiones técnicas
- **Vanilla HTML/CSS/JS**, sin frameworks ni build. Carlos está acostumbrado a este estilo.
- **Sin backend ni Firebase**: GitHub hace de almacenamiento (API REST de contenidos) y de hosting (Pages).
- **Mobile-first**: tiene que verse bien en el móvil. Diseño limpio con los colores del Excel (azul marino `#1F3864`, azul claro de cabeceras, rojo para los débitos).
- Toda la interfaz en castellano. Días de la semana calculados, nunca escritos a mano.
- Lógica de cálculo en un módulo puro (`app/js/calculo.js`) con tests que comprueben las cifras de control.
- PDF del escrito con jsPDF (fijar la versión desde una CDN, por ejemplo cdnjs) o con imprimir del navegador.
- El correo no se envía desde la app: un `mailto:` abre el correo ya rellenado (Para, CCO, Asunto y Cuerpo) y además hay un botón "Copiar texto".

## Privacidad
Con GitHub Pages, la app publicada (y el JSON que carga) puede verla **cualquiera que tenga el enlace**,
aunque el repositorio sea privado. Los datos son de baja sensibilidad (días de continuidad de dos
profesionales), pero esto **lo decide Carlos**: confírmalo con él antes de activar Pages.
Los PDF de los escritos no se publican, solo están en Drive.
El token de edición **nunca** va al código ni a un commit. Si se pierde un dispositivo, se revoca el token en GitHub.
