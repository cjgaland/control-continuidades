# Prompt para arrancar el proyecto en Claude Code

Abre Claude Code en la carpeta **Control Continuidades** del escritorio y pega el texto que hay entre las líneas.

---

Hola. Este es mi proyecto de control de las continuidades asistenciales que hacemos Rafa y yo en el Hospital Comarcal de Montilla. Antes de hacer nada, lee `CLAUDE.md` y todo lo que hay en `docs/`. Ahí están las reglas de cálculo, el formato del escrito que envío a Gerencia, dónde se guarda cada cosa y las cifras de control.

**Objetivo:** sustituir mi Excel por una app web sencilla, en HTML, CSS y JavaScript sin frameworks, publicada con GitHub Pages. Tengo que poder **consultar y editar desde el móvil y desde el ordenador**. Rafa solo consulta. Los datos están en `datos/continuidades.json`. Al guardar, la app los escribe directamente en GitHub con un token personal que solo tendré yo, tal como explica `CLAUDE.md`. Los escritos en PDF se archivan en mi Google Drive, en `Mi unidad/Control Continuidades/Escritos/<año>/`, que ya está creado.

**Qué tiene que hacer la app:**
1. **Resumen:** para cada persona, débito del mes, acumulado del año, débito anual, acumulado total desde agosto de 2024 y hasta qué mes se le ha abonado.
2. **Histórico:** todos los meses desde agosto de 2024, con filtro por año.
3. **Informe anual:** vista imprimible por año, parecida a cada hoja del Excel.
4. **Alta y edición mensual (solo con mi token):** elegir mes y año, y para cada persona anotar hasta 5 días, marcar si el mes completo fue de vacaciones o baja y marcar "abonado" (por separado para Rafa y para mí). Tiene que validar que la fecha existe y que no hay días repetidos, y mostrar el día de la semana. Al guardar, hace el commit en GitHub.
5. **Escrito:** elegir el primer mes, el número de meses (de 1 a 4), si el último es previsión y el saludo. Genera el texto exactamente como en `docs/modelo-escrito.md`, con estos botones:
   - "Copiar texto".
   - "Abrir correo": un `mailto:` con Para pedromanuel.castro.sspa@juntadeandalucia.es y soledad.delgado.sspa@juntadeandalucia.es, CCO rjavier.romero.sspa@juntadeandalucia.es, asunto y cuerpo. Lo envío yo desde carlosjavier.galan.sspa@juntadeandalucia.es.
   - "Guardar PDF": crea `AAAA-MM-DD_Escrito_<meses>.pdf`. En el móvil tiene que poder compartirse a Drive con el menú "Compartir".
6. **Ajustes:** pegar u olvidar el token de edición, con una explicación paso a paso de cómo crearlo en GitHub.

El diseño tiene que pensarse **primero para el móvil** y usar los colores del Excel.

**Cómo quiero que trabajes:**
- Primero preséntame un plan breve (pantallas, archivos y fases) y espera a que te dé el visto bueno.
- **Preparación del equipo**, guiándome paso a paso:
  - comprueba que tengo `git`, `gh` y Homebrew, y que `gh` tiene sesión iniciada;
  - instálame Google Drive para escritorio (`brew install --cask google-drive`) y dime cómo iniciar sesión con mi cuenta;
  - después, localiza la carpeta `Control Continuidades/Escritos` dentro de Google Drive en mi Mac.
- **Antes de publicar nada**, pregúntame el nombre del repositorio y confirma conmigo lo de la privacidad de GitHub Pages que explica `CLAUDE.md`.
- Pon la lógica de cálculo en `app/js/calculo.js`, separada de la interfaz, con tests que comprueben las cifras de control de `docs/reglas-de-calculo.md` (Rafa: 7 en 2024, 32 en 2025 y 60 acumulados a octubre de 2026). No des una fase por terminada si los tests no pasan.
- Cuando la app esté publicada, guíame para crear el token de GitHub (de grano fino, solo para este repositorio, con permiso Contents: Read and write) y para configurarlo en mi Mac y en mi móvil. Haz una prueba de guardado real.
- Haz commits pequeños con mensajes claros en castellano. No hagas push sin decírmelo, y haz siempre `git pull` antes de empezar, porque los datos también cambian desde la app.
- Háblame en castellano y en lenguaje claro. No soy programador profesional.

---

## Para después, cuando ya funcione
- Compartir con Rafa la carpeta de Drive `Control Continuidades` como lector, y mandarle el enlace de la app.
- Opcional: si un día Rafa también quiere editar, se le crea su propio token, o se estudia otro sistema de acceso.
