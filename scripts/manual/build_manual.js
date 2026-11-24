'use strict';
// Manual de «Control de Continuidades» (generador basado en la skill app-user-manual).
// Genera dos .docx: el de consulta y el del modo edición (incluye todo lo anterior más lo exclusivo, con banda de color).
//   NODE_PATH="$(npm root -g)" node build_manual.js <carpeta_destino>
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  BorderStyle, PageNumber, Header, Footer, TabStopType, LeaderType, ImageRun,
} = require('docx');
const crearHelpers = require('./docx_helpers');

const CAP = path.join(__dirname, 'capturas');
const img = (f) => path.join(CAP, f);

const APP = {
  nombreCorto: 'Control de Continuidades',
  organizacion: ['Unidad de Calidad y Seguridad del Paciente', 'Hospital Comarcal de Montilla', 'Área de Gestión Sanitaria Sur de Córdoba'],
  autor: 'Carlos J. Galán Doval',
  version: '1.3',
  fecha: 'noviembre 2026',
};
const PALETA = {
  principalOsc: '1F3864', principal: '2F5597', principalClaro: 'D9E2F3',
  verde: '2E7D32', verdeClaro: 'E3F1E4', ambar: 'B5651D', ambarClaro: 'FBE7D2',
  gris: '6B7280', grisClaro: 'F3F4F6', texto: '1D2433', rolExtra: '6A3FA0', rolExtraClaro: 'F1EAFB',
};
const FUENTE = 'Calibri';
const H = crearHelpers(PALETA, FUENTE);
const ROL = 'quien tiene el Modo edición';

let figura = 0;
const fig = (file, texto, ancho = 600) => ({ file: img(file), pie: `Figura ${++figura}. ${texto}`, ancho });

const CAPITULOS = [
  {
    titulo: '1. Qué es y para qué sirve',
    intro: '«Control de Continuidades» lleva la cuenta de las **continuidades asistenciales extra** que hacen Rafa y Carlos en el Hospital Comarcal de Montilla. Sustituye al Excel que se usaba hasta octubre de 2026 y prepara sola el **escrito mensual** para Gerencia. Todos los datos que ves en este manual son **inventados**: sirven solo para enseñar cómo funciona.',
    bloques: [
      { h: 'El acuerdo en dos líneas', parrafos: [
        'Por un acuerdo con Gerencia, a **Rafa** le corresponden **5** continuidades al mes y a **Carlos** **4**. El control empezó en **agosto de 2024**.',
        'Cada día que no se hace una continuidad del cupo queda «pendiente»: es lo que la aplicación llama **débito**. La aplicación lo calcula sola a partir de los días que se anotan.'] },
      { h: 'Qué puedes hacer con ella', lista: [
        'Ver cómo va **un mes**: días hechos, débito y hasta qué mes se ha abonado (pantalla **Resumen**).',
        'Repasar **todos los meses** desde agosto de 2024 (pantalla **Histórico**).',
        'Ver, descargar o imprimir el **informe del año** en PDF (pantalla **Informe**).',
        'Leer el **escrito mensual** a Gerencia tal como se enviará (pantalla **Escrito**).',
      ] },
      { h: 'Consultar y editar: dos formas de entrar', parrafos: [
        'Cualquier persona que abra el enlace **consulta**: lo ve todo, pero no puede cambiar nada. No hay que identificarse ni configurar nada.',
        'Solo quien tiene el **token de edición** (hoy, Carlos) puede anotar días, marcar abonos y guardar. Ese es el **Modo edición** y tiene su propio manual.'],
        soloEn: { titulo: 'Este manual es el del Modo edición', lineas: ['Incluye todo lo de consulta y, además, los capítulos 10 a 14 y algunos apartados sueltos marcados con una banda morada como esta.'] } },
    ],
  },
  {
    titulo: '2. Abrir la aplicación y la portada',
    bloques: [
      { h: 'Cómo se abre', parrafos: ['Es una página web: se abre desde el navegador (Chrome, Safari, Edge…) en el ordenador o en el móvil, con el enlace que te haya pasado Carlos. Guárdala en **Favoritos** o en la pantalla de inicio del móvil (capítulo 3).'] },
      { h: 'La portada', parrafos: ['Al entrar ves la portada: qué es la aplicación y cuándo se actualizaron los datos por última vez (por ejemplo, «Datos actualizados el 12/11/2026»). Desde ahí se llega a la **Ayuda** con el botón **?** de arriba a la derecha.'],
        imagen: fig('c01_portada.png', 'La portada (ordenador). Arriba, el botón Portal y el botón ? de Ayuda; en la barra, las pantallas.') },
      { h: 'La cabecera: el botón Portal', parrafos: ['En la franja azul de arriba, a la derecha, hay dos botones: **⌂ Portal** y **?** (Ayuda). Esta versión de la aplicación es la **1.8**.',
        '**⌂ Portal** abre, en **otra pestaña**, el Portal de la Unidad de Calidad: la página que reúne todas las herramientas de la Unidad (Actividad, Dietas, Permisos, Continuidades…). La aplicación sigue abierta donde estaba, así que puedes volver sin perder nada. El Portal está protegido con acceso por correo: si tu correo no tiene permiso, verás la pantalla de inicio de sesión de Cloudflare y no podrás pasar.'],
        imagen: fig('c10_cabecera.png', 'La cabecera con el botón Portal (a la izquierda del ?).', 560) },
      { h: 'Las pestañas', parrafos: ['Las pantallas se cambian con las pestañas: **Resumen**, **Histórico**, **Informe**, **Escrito** y **Ajustes**. En el ordenador están arriba; en el móvil, abajo, siempre a mano. Quien tiene el Modo edición ve además la pestaña **Editar**.'] },
      { h: 'El aviso «Actualizar»', parrafos: [
        'La aplicación mira cada minuto si hay datos nuevos o una versión nueva. Si la dejas abierta y alguien guarda un cambio, arriba aparece una franja con el texto **«Se han guardado datos nuevos»** (o «Hay una versión nueva de la app») y el botón **Actualizar**.',
        'Púlsalo y la página se recarga con lo último. No pierdes nada: lo que ves siempre sale de los datos guardados.'],
        tip: { titulo: 'Para ver lo último al momento', lineas: ['Si te avisaron de que ya se ha guardado algo y no lo ves, pulsa **Actualizar** o recarga la página. Si no sale ningún aviso, tarda como mucho un minuto. También puedes ir a **Ayuda** y pulsar **Buscar actualizaciones** (capítulo 9).'] } },
    ],
  },
  {
    titulo: '3. En el ordenador y en el móvil',
    intro: 'Es la misma aplicación y los mismos datos en los dos sitios. Solo cambia cómo se reparte la pantalla.',
    bloques: [
      { h: 'En el ordenador', parrafos: ['Cada pantalla cabe entera sin tener que bajar la página: las pestañas van arriba, el informe se reparte en tres columnas, el escrito deja el texto a toda altura y Rafa y Carlos aparecen lado a lado.'] },
      { h: 'En el móvil', parrafos: ['Las pantallas se leen de arriba abajo, con tarjetas, y las pestañas quedan fijas abajo. Los botones son grandes para pulsarlos con el dedo.'],
        imagenes: [fig('m01_resumen.png', 'Resumen en el móvil.', 185), fig('m02_historico.png', 'Histórico en el móvil.', 185), fig('m03_escrito.png', 'Escrito en el móvil.', 185)] },
      { h: 'Dejarla en la pantalla de inicio', parrafos: ['No hace falta instalar nada de ninguna tienda. Puedes dejar un icono y se abre como una aplicación más:'], lista: [
        '**iPhone o iPad (Safari):** pulsa **Compartir** (el cuadrado con una flecha hacia arriba) y elige **Añadir a pantalla de inicio**.',
        '**Android (Chrome):** pulsa el menú de los tres puntos y elige **Instalar aplicación** o **Añadir a pantalla de inicio**.',
        '**Ordenador:** pulsa **Ctrl + D** (en Mac, **Cmd + D**) para guardarla en Favoritos.',
      ] },
    ],
  },
  {
    titulo: '4. Cómo se calculan las cifras',
    intro: 'Antes de ver las pantallas conviene entender de dónde salen los números. Son pocas reglas y siempre las mismas.',
    bloques: [
      { h: 'El cupo y el débito del mes', parrafos: [
        'El **cupo** es lo que corresponde hacer cada mes: 5 a Rafa y 4 a Carlos.',
        'El **débito del mes** es lo que falta para llegar al cupo. Si Rafa hace 3 días en un mes, su débito es 2. Si no hace ninguno, 5.',
        'Si alguien hace **más** días que su cupo (por ejemplo, Carlos hace 5), no debe nada: le sale a favor y esos días **restan** del total acumulado. En pantalla se escriben con un **+** y en verde.'] },
      { h: 'Cómo leer los colores', lista: [
        '**Rojo**: se debe esa cantidad.',
        '**0** sin color: está al día.',
        '**+1 en verde**: se han hecho de más.'] },
      { h: 'Qué meses cuentan', lista: [
        'Los meses **anteriores a agosto de 2024** no cuentan.',
        'Un mes **ya terminado** cuenta siempre, aunque no tenga ningún día anotado: genera el débito completo.',
        'Un mes **que no ha terminado** cuenta en cuanto tiene algún día anotado. Mientras no tenga ninguno, no cuenta todavía.',
        'Un **mes completo de vacaciones o de baja** no genera débito: no se trabaja, así que no se pueden hacer continuidades.'] },
      { h: 'Los acumulados', parrafos: ['La aplicación suma el débito de varios meses de tres formas:'], lista: [
        '**Acumulado del año**: suma de los meses del año hasta el mes que miras.',
        '**Débito anual**: suma de los doce meses del año.',
        '**Acumulado total**: suma de todos los meses desde agosto de 2024. En los escritos a Gerencia aparece en negativo, por ejemplo «Acumulados 2024/26 -63».'],
        aviso: { titulo: 'Un mes vacío no pone la cuenta a cero', lineas: ['El débito se arrastra: un mes sin días no «borra» lo anterior, lo aumenta. Solo baja cuando se hacen más días que el cupo.'] } },
      { h: 'Qué es «abonado»', parrafos: [
        'Cuando Gerencia da el visto bueno y Nóminas paga los días de un mes, ese mes queda **abonado**. Cada persona tiene su propia marca: a uno se le puede haber abonado un mes y al otro todavía no.',
        '**«Abonado hasta»** es el último mes marcado como abonado. En el Histórico y en el Informe se ve con una marca ✓.'] },
      { h: 'Qué es una «previsión»', parrafos: ['Es un mes **que todavía no ha terminado**, con los días que se piensan hacer según el cuadrante. Se anota por adelantado para que Gerencia lo conozca y lo valore. La aplicación lo avisa con la palabra **previsión** y, cuando el mes pase, deja de serlo sin que tengas que hacer nada.'] },
      { h: 'Qué comprueba la aplicación', parrafos: ['Cada persona puede tener de 0 a 5 días por mes, sin repetir ninguno, y el día tiene que existir (no hay 31 de noviembre). El día de la semana se calcula solo; nadie lo escribe a mano.'] },
    ],
  },
  {
    titulo: '5. Resumen',
    intro: 'Es la pantalla para ver «cómo vamos» en un mes, de un vistazo y para las dos personas.',
    bloques: [
      { h: 'Qué muestra', parrafos: ['Arriba eliges el **Mes**. Al abrir, sale el mes actual. Debajo hay una tarjeta para Rafa y otra para Carlos con:'], lista: [
        '**Débito acumulado total**: lo que se debe desde agosto de 2024 hasta ese mes (el número grande).',
        '**Débito del mes**, **Acumulado del año** y **Débito anual**.',
        '**Días en el mes**, y debajo los días concretos con su día de la semana (por ejemplo, «3 mar», 3 martes).',
        '**Abonado hasta**: el último mes abonado de esa persona.'],
        imagen: fig('c02_resumen.png', 'Resumen de noviembre de 2026 (datos de demostración).') },
      { h: 'Ver otro mes y las previsiones', parrafos: ['Cambia el selector **Mes** para ver cualquier mes desde agosto de 2024. Los meses futuros llevan al lado la nota **(previsión)**.'],
        imagen: fig('c03_resumen_prevision.png', 'Diciembre de 2026, todavía por llegar: aparece como previsión.'),
        tip: { titulo: 'Para una consulta rápida', lineas: ['Con el móvil, abre la aplicación y mira solo el número grande de tu tarjeta: es lo que se te debe en total a día de hoy.'] } },
    ],
  },
  {
    titulo: '6. Histórico',
    intro: 'Todos los meses, uno debajo de otro, con los días de cada persona y sus débitos.',
    bloques: [
      { h: 'Cómo está organizado', parrafos: ['Cada mes es una tarjeta con Rafa y Carlos. Por persona verás los días (con la abreviatura del día de la semana), el **Débito mes**, el **Acum. del año** y el **Acum. total**. Los meses completos de vacaciones o baja lo dicen con esas palabras. Una marca **✓** verde junto al nombre indica que ese mes está **abonado**. Los meses por llegar llevan la etiqueta **previsión**.',
        'Para distinguir a cada uno de un vistazo, la parte de **Rafa** tiene el fondo **azul claro** y la de **Carlos**, **crema**. Los días van en *cursiva* y los débitos, en **rojo**. La leyenda está arriba, junto al selector de año.'] },
      { h: 'Filtrar por año', parrafos: ['El selector **Año** reduce la lista a un año. Con «Todos» salen los meses desde agosto de 2024, empezando por el más reciente.'],
        imagen: fig('c04_historico.png', 'Histórico del año 2025: en agosto, Rafa estuvo de vacaciones.'),
        tip: { titulo: 'Buscar cuándo se abonó algo', lineas: ['Recorre el Histórico buscando las marcas ✓: la última de cada persona es su «Abonado hasta».'] } },
    ],
  },
  {
    titulo: '7. Informe anual',
    intro: 'El informe reúne todo un año en el formato de la hoja del Excel de siempre, y se puede guardar o imprimir en PDF.',
    bloques: [
      { h: 'Qué contiene', parrafos: ['Elige el **Año** arriba. En pantalla de ordenador el informe se reparte en tres columnas:'], lista: [
        '**Una tabla por persona** con los doce meses: días, total, débito del mes, débito acumulado y si está abonado (✓).',
        '**Una tabla de totales**: débito anual del año anterior y del actual, acumulado total desde agosto de 2024 y «Abonado hasta».',
        '**El resumen del año** de cada uno: días solicitados frente al cupo, meses abonados y meses pendientes.'],
        imagen: fig('c05_informe.png', 'Informe anual 2026 en el ordenador, con sus tres columnas.') },
      { h: 'El resumen del año y la tira de colores', parrafos: [
        'Cada persona tiene tres cifras: los días **solicitados** frente al cupo del año, los **meses abonados** y los **meses pendientes** de abono (indicando cuántos son previsión).',
        'Debajo, una **tira de doce casillas**, una por mes (E, F, M…), con un color según su estado:'],
        lista: ['**Verde**: abonado.', '**Naranja**: pendiente de abono.', '**Naranja claro con borde discontinuo**: previsión (el mes aún no ha terminado).', '**Azul**: vacaciones o baja.', '**Gris**: sin días.'],
        imagen: fig('c06_informe_resumen.png', 'El resumen del año: cifras de cada persona, tira de colores y leyenda.', 500),
        aviso: { titulo: 'Por qué el cupo del año puede ser menor de 60', lineas: ['Los meses de vacaciones o baja no cuentan para el cupo. Por eso, si Carlos estuvo un mes de vacaciones, su cupo del año aparece como 44 en vez de 48.'] } },
      { h: 'Ver, descargar e imprimir el PDF', lista: [
        '**Ver PDF** abre el informe listo para verlo: en el ordenador, en otra pestaña (desde ahí se imprime); en el iPad o el iPhone, dentro de la aplicación, en una ventana con «Guardar / descargar» y «Cerrar». **Descargar PDF**, en el iPad o el iPhone, abre la hoja de Compartir (Guardar en Archivos…).',
        '**Descargar PDF** lo guarda con el nombre «AAAA-MM-DD_Informe_AAAA.pdf» (la fecha de hoy y el año del informe).',
        'En el móvil el botón se llama **Ver / compartir PDF** y abre el menú de compartir del teléfono (Imprimir, Guardar en Drive…).'],
        aviso: { titulo: 'Hace falta conexión', lineas: ['El PDF lo prepara el navegador con una herramienta que se descarga en ese momento. Sin conexión a internet puede fallar: vuelve a probar cuando la tengas.'] } },
    ],
  },
  {
    titulo: '8. El escrito mensual a Gerencia',
    intro: 'Cada mes se manda a Sole (Dirección Médica), a Pedro (Gerencia) y a Rafa Benítez un correo con los días de continuidades, para que los valoren y los pasen a Nóminas. Esta pantalla lo escribe sola con los datos guardados.',
    bloques: [
      { h: 'Qué ves', parrafos: ['A la izquierda están las opciones y los datos del correo; a la derecha, el texto completo. En el móvil, todo seguido.'], lista: [
        '**Primer mes** y **Número de meses** (de 1 a 4): qué meses se incluyen. Al abrir, la aplicación propone sola desde el primer mes sin abonar hasta el mes siguiente.',
        '**Saludo**: «Buenos días» por la mañana y «Buenas tardes» por la tarde (se puede cambiar).',
        '**El último mes es previsión**: marcada, el texto dice «y la previsión de…».',
        '**Para**, **CCO** y **Asunto**: los destinatarios y el título del correo. En «Para» van Pedro, Sole y Rafa Benítez; Rafa Romero va en copia oculta (CCO).'],
        imagen: fig('c07_escrito.png', 'El escrito de octubre a diciembre de 2026, con diciembre como previsión.') },
      { h: 'Cómo se lee el texto', parrafos: [
        'Empieza con el saludo y una frase que dice qué meses se informan y **hasta qué mes se ha abonado**. Si a los dos se les abonó hasta el mismo mes, lo dice una vez; si no, lo dice por separado para cada uno.',
        'Después, un bloque por mes. En la línea de **Rafa** pone los días **solicitados**, el **débito mensual** y los **acumulados** (por ejemplo, «Solicitados 4 (Débito mensual -1; Acumulados 2024/26 -61)»), y debajo los días con su día de la semana. Carlos lleva el mismo formato; solo escribe «Carlos:» a secas cuando su débito del mes y su acumulado son 0.',
        'Un mes de vacaciones o baja sale como «vacaciones el mes completo (sin débito)».',
        'Para que se lea mejor, los **meses** van en **negrita** y las cifras de **débito**, en **rojo** (las hechas de más, en verde). Ese formato se conserva al copiar el texto y en el PDF.'],
        tip: { titulo: 'Los signos', lineas: ['En el escrito el débito se escribe en **negativo** (-1 es «se debe 1») y las horas hechas de más con **+**. Es el formato que usaba el Excel.'] } },
      { h: 'Los botones', lista: [
        '**Copiar texto**: copia el texto **con su formato** (meses en negrita y débitos en rojo) para pegarlo en el correo. Si el programa donde pegas no admite formato, se pega como texto normal.',
        '**Abrir correo**: abre tu programa de correo con el mensaje ya rellenado (Para, CCO, Asunto y texto).',
        '**Guardar PDF**: descarga el escrito en PDF con el nombre «AAAA-MM-DD_Escrito_meses.pdf».',
        '**Compartir PDF (Drive)**: solo aparece en dispositivos que lo permiten (sobre todo el móvil); abre el menú de compartir para enviar el PDF a Google Drive.'],
        aviso: { titulo: 'La aplicación no envía el correo', lineas: ['Prepara el mensaje, pero lo envía cada persona desde su programa de correo. Si «Abrir correo» no hace nada, usa **Copiar texto** y pega el texto en un correo nuevo (ver las preguntas frecuentes).'] } },
      { soloRol: ROL, h: 'Preparar y enviar el escrito de cada mes', pasos: [
        'Anota en **Editar** los días del mes y la previsión del siguiente (capítulo 11).',
        'Marca como **Abonado** los meses que ya se han pagado (capítulo 13) y guarda: el escrito lo cuenta en su primera frase.',
        'Ve a **Escrito**. Comprueba el primer mes, el número de meses y que el último esté marcado como previsión.',
        'Lee el texto entero. Si algo no cuadra, corrige en **Editar** y vuelve: el escrito se actualiza solo.',
        'Pulsa **Abrir correo** y envíalo desde tu cuenta corporativa (o **Copiar texto** y pégalo en un correo nuevo).',
        'Pulsa **Guardar PDF** y archívalo en Google Drive: **Mi unidad › Control Continuidades › Escritos › año**. En el móvil, pulsa **Compartir PDF (Drive)** y elige Drive.'],
        tip: { titulo: 'El mejor momento', lineas: ['Se hace cada mes entre el 15 y el 25, cuando sale el cuadrante de trabajo.'] } },
    ],
  },
  {
    titulo: '9. Ajustes, manual y versión',
    bloques: [
      { h: 'Qué hay en Ajustes', parrafos: ['Para quien consulta, Ajustes recuerda que la aplicación es **de consulta** y que **no hace falta configurar nada**, y ofrece el botón para ver este manual. Debajo hay un apartado plegado, «Modo edición · Solo para Carlos», que no necesitas abrir.'],
        imagen: fig('c08_ajustes.png', 'Ajustes en modo consulta.') },
      { h: 'Ver y guardar el manual', pasos: ['Abre **Ajustes** (o la **Ayuda**, con el botón ?).', 'Pulsa **Ver manual (PDF)**. El manual se abre **dentro de la propia aplicación**, en una ventana que ocupa la pantalla.', 'Desplázate por las páginas para leerlo. Arriba tienes **Guardar / descargar** (para quedarte con una copia) y **Cerrar** (para volver exactamente donde estabas).', 'En iPad e iPhone, **Guardar / descargar** abre la hoja de **Compartir** del sistema: elige **Guardar en Archivos**, enviarlo por correo, etc.'],
        imagen: fig('c12_visor_manual.png', 'El manual abierto dentro de la aplicación, con los botones Guardar / descargar y Cerrar.'),
        aviso: { titulo: 'Si el botón dice «El manual estará disponible en breve»', lineas: ['Significa que el PDF aún no está publicado. Vuelve a probar más tarde.'] } },
      { h: 'Versión instalada y «Buscar actualizaciones»', parrafos: ['En la **Ayuda**, en el apartado «Avisos de cambios», figura la **versión instalada** (ahora **v2.0**) junto al botón **Buscar actualizaciones**. Púlsalo para comprobar **en ese momento** si hay una versión nueva, sin esperar al aviso automático.',
        'Si no la hay, aparece **«Tienes la última versión (v1.8)»**. Si la hay, sale arriba el aviso de siempre con el botón **Actualizar**; púlsalo y la aplicación se recarga con lo último. Si no hay conexión, avisa de que no se ha podido comprobar y puedes intentarlo más tarde.',
        'Aunque no pulses nada, la aplicación ya mira sola cada minuto y al volver a la pestaña. El botón sirve para salir de dudas al instante.'],
        imagen: fig('c11_buscar_version.png', 'La versión instalada y el botón Buscar actualizaciones, con el resultado debajo.', 460),
        },
      { h: 'El historial de versiones', parrafos: ['Al final de la Ayuda y de la portada está el número de versión de la aplicación y la lista de lo que ha cambiado en cada una.'] },
      { soloRol: ROL, h: 'Dónde se activa el Modo edición', parrafos: ['El token se pega también en Ajustes, en el apartado plegable **Modo edición**. Se explica paso a paso en el capítulo 10. Con el token puesto, Ajustes enseña un ✅ y el botón **Cerrar sesión / olvidar token**, y el botón **Ver manual (PDF)** abre el **manual del Modo edición**.'],
        imagen: fig('e02_ajustes_con_token.png', 'Ajustes con el Modo edición activado.') },
    ],
  },
  {
    soloRol: ROL, titulo: '10. Activar el Modo edición (token)',
    intro: 'Para anotar datos hace falta un **token de GitHub**: una clave larga que da permiso para guardar en el repositorio de la aplicación y nada más. Se crea una vez por dispositivo y se guarda solo en ese navegador.',
    bloques: [
      { soloRol: ROL, h: 'Crear el token (una vez por dispositivo)', pasos: [
        'Desde el ordenador, entra en GitHub › **Settings › Developer settings › Personal access tokens › Fine-grained tokens › Generate new token**. Si Chrome traduce la página, pulsa «Mostrar original»: la traducción estropea el formulario.',
        'En **Token name** pon un nombre, por ejemplo «Continuidades - Mac» o «Continuidades - móvil».',
        'En **Expiration** elige como máximo 1 año. Al caducar, la aplicación sigue consultándose pero no guarda: se crea otro igual.',
        'En **Repository access** elige **Only select repositories** y marca solo el repositorio de la aplicación.',
        'En **Permissions** pulsa **Add permissions**, elige **Contents** y ponlo en **Read and write**. Nada más.',
        'Pulsa **Generate token** y copia el texto que empieza por «github_pat_». GitHub solo lo enseña una vez.'],
        aviso: { titulo: 'Trátalo como una contraseña', lineas: ['No lo escribas en correos ni lo compartas. Para el móvil, créalo en el ordenador, pásalo de forma privada (por ejemplo, AirDrop a Notas), pégalo en la aplicación y borra la nota.'] } },
      { soloRol: ROL, h: 'Pegarlo en la aplicación', pasos: [
        'Abre **Ajustes** y despliega **Modo edición**.',
        'Pega el token en el campo **Token de GitHub** (los caracteres salen ocultos).',
        'Pulsa **Guardar token**. La aplicación comprueba que puede escribir; si es correcto, dice «Token correcto» y aparece la pestaña **Editar**.'],
        imagen: fig('e01_ajustes_token.png', 'Ajustes: el apartado Modo edición, con el campo del token (el de la imagen es falso).'),
        tip: { titulo: 'Cómo saber que estás en Modo edición', lineas: ['Arriba, junto al botón ?, aparece la etiqueta **Modo edición**, y en la barra, la pestaña **Editar**.'] } },
      { soloRol: ROL, h: 'Cerrar sesión', parrafos: ['En un ordenador o móvil que no sea tuyo, o si dejas de usarlo, pulsa **Cerrar sesión / olvidar token** en Ajustes. Si pierdes un dispositivo, además **revoca el token** en GitHub.'],
        imagen: fig('e03_resumen_modo_edicion.png', 'Con el token activado aparece «Modo edición» arriba y la pestaña Editar.') },
    ],
  },
  {
    soloRol: ROL, titulo: '11. Editar: anotar los días de un mes',
    intro: 'La pestaña **Editar** sirve para dar de alta los días de un mes (o corregirlos). Es el trabajo de cada mes.',
    bloques: [
      { soloRol: ROL, h: 'La pantalla', parrafos: ['Arriba eliges el **Mes**; los meses sin datos llevan la nota «(vacío)». Puedes elegir cualquiera desde agosto de 2024 hasta dos meses por delante. Rafa y Carlos tienen cada uno su tarjeta, lado a lado en el ordenador.'],
        imagen: fig('e04_editar.png', 'Editar noviembre de 2026: una tarjeta por persona con sus cinco casillas de día.') },
      { soloRol: ROL, h: 'Dar de alta un mes', pasos: [
        'Elige el **Mes** en el selector.',
        'En la tarjeta de cada persona, escribe el **número de día** en las casillas (hasta cinco). No hace falta que estén en orden: al guardar se ordenan.',
        'Mira el día de la semana que aparece al lado de cada número. Si es un fin de semana o un día que no toca, corrígelo.',
        'Cuando todo esté bien, pulsa **Guardar en GitHub**.'],
        imagen: fig('e06_editar_con_dias.png', 'Diciembre de 2026 (previsión) con los días escritos: el botón Guardar ya está disponible.'),
        tip: { titulo: 'Anota también la previsión', lineas: ['Entre el 15 y el 25 de cada mes, cuando sale el cuadrante, anota los días del mes y los del siguiente. El siguiente saldrá como previsión en el escrito.'] } },
      { soloRol: ROL, h: 'Si algo está mal', parrafos: ['La aplicación avisa en rojo y **no deja guardar** mientras haya un error: un día que no existe en ese mes (con «¡no existe!» junto al número), un día repetido, o más de cinco días.'],
        imagen: fig('e07_editar_errores.png', 'Dos avisos: el día 31 no existe en noviembre y el día 4 de Carlos está repetido.') },
      { soloRol: ROL, h: 'Guardar, deshacer y cambiar de mes', lista: [
        '**Guardar en GitHub** guarda los datos de verdad. Solo está activo cuando has cambiado algo y no hay errores. Sale «Guardado» con el nombre del cambio (por ejemplo, «Datos: alta diciembre 2026»).',
        '**Deshacer cambios** vuelve a como estaba la última vez que se guardó.',
        'Si cambias de mes o de pantalla con cambios sin guardar, la aplicación **pregunta** antes de descartarlos.',
        'La aplicación publicada se actualiza en uno o dos minutos. Quien tenga la página abierta verá el aviso **Actualizar**.'],
        imagen: fig('e10_guardado.png', 'Después de guardar: mensaje de confirmación.'),
        aviso: { titulo: 'Si dice que los datos han cambiado', lineas: ['Significa que alguien (o tú desde otro dispositivo) guardó mientras tú editabas. La aplicación recarga los datos nuevos y **no sobrescribe nada**. Revisa el mes y vuelve a guardar.'] } },
      { soloRol: ROL, h: 'Corregir un mes ya guardado', parrafos: ['Elige ese mes y cambia las casillas: para quitar un día, vacíala. Si dejas un mes sin ningún día, ni ausencia, ni abono, el mes se elimina de los datos.'] },
    ],
  },
  {
    soloRol: ROL, titulo: '12. Vacaciones y bajas de mes completo',
    bloques: [
      { soloRol: ROL, h: 'Cuándo usarlo', parrafos: ['Si una persona está **todo el mes** de vacaciones o de baja, no puede hacer continuidades, así que ese mes **no genera débito** (capítulo 4). Se indica en «Mes completo».'] },
      { soloRol: ROL, h: 'Cómo se marca', pasos: [
        'En **Editar**, elige el mes.',
        'En la tarjeta de la persona, abre **Mes completo** y elige **Vacaciones (sin débito)** o **Baja (sin débito)**.',
        'Si ya había días anotados, la aplicación pregunta si los borra: al aceptar, se vacían las casillas.',
        'Pulsa **Guardar en GitHub**.'],
        imagen: fig('e08_editar_vacaciones.png', 'Agosto de 2026: Carlos de vacaciones el mes completo; sus casillas quedan desactivadas.'),
        aviso: { titulo: 'Solo para el mes entero', lineas: ['Si solo faltas unos días, **no** marques vacaciones: simplemente anota los días que sí hiciste y el débito se calcula solo.'] } },
      { soloRol: ROL, h: 'Volver a «Trabajado»', parrafos: ['Para deshacerlo, vuelve a elegir **Trabajado (se cuentan los días)** y anota los días.'] },
    ],
  },
  {
    soloRol: ROL, titulo: '13. Marcar un mes como abonado',
    bloques: [
      { soloRol: ROL, h: 'Cuándo', parrafos: ['Cuando Gerencia confirma que se han abonado los días de un mes (o varios), hay que reflejarlo. Esa marca decide la frase «han sido abonadas todas hasta…» del escrito y las casillas verdes del informe.'] },
      { soloRol: ROL, h: 'Cómo', pasos: [
        'En **Editar**, elige el mes abonado.',
        'Marca la casilla **Abonado** de la persona a la que se le ha abonado (cada una tiene la suya).',
        'Repite con los meses anteriores que falten por marcar.',
        'Pulsa **Guardar en GitHub**.'],
        imagen: fig('e09_editar_abonado.png', 'Octubre de 2026 con Abonado marcado en las dos tarjetas.'),
        tip: { titulo: 'Un mes cada vez', lineas: ['La marca es por mes y por persona. «Abonado hasta» es el último mes marcado, así que conviene marcar los meses en orden.'] } },
    ],
  },
  {
    soloRol: ROL, titulo: '14. Editar desde el móvil',
    bloques: [
      { soloRol: ROL, h: 'Es igual, en vertical', parrafos: ['En el móvil, Editar muestra primero la tarjeta de Rafa y debajo la de Carlos. Los números de día usan el teclado numérico. Para guardar, baja hasta el botón **Guardar en GitHub**.'],
        imagenes: [fig('em01_editar.png', 'Editar en el móvil.', 185), fig('em02_ajustes.png', 'Ajustes con Modo edición en el móvil.', 185)],
        tip: { titulo: 'Comprueba antes de guardar', lineas: ['En el móvil es fácil equivocarse de casilla. Mira los días de la semana que aparecen junto a cada número antes de guardar.'] } },
    ],
  },
];

const FAQ = [
  { p: '¿Qué es el botón Portal?', r: 'El botón «⌂ Portal» de la cabecera abre, en otra pestaña, el Portal de la Unidad de Calidad, con todas las herramientas de la Unidad (Actividad, Dietas, Permisos, Continuidades…). Está protegido con acceso por correo: si tu correo no tiene permiso, saldrá la pantalla de inicio de sesión de Cloudflare. Esta aplicación sigue abierta en su pestaña.' },
  { p: '¿Qué es el débito?', r: 'Es lo que falta para llegar al cupo del mes: el cupo menos los días hechos. Si Rafa (cupo 5) hace 3 días, su débito del mes es 2. Los débitos se suman mes a mes en los acumulados. Rojo significa que se debe; un número con + en verde, que se han hecho de más.' },
  { p: '¿Por qué un mes sale como «previsión»?', r: 'Porque todavía no ha terminado. Se anotan por adelantado los días que se piensan hacer para que Gerencia los conozca. Cuando el mes acaba, deja de ser previsión sin que nadie tenga que hacer nada.' },
  { p: '¿Qué significa «abonado»?', r: 'Que Gerencia ha dado el visto bueno y los días de ese mes ya se han pagado. Cada persona tiene su propia marca (✓). «Abonado hasta» es el último mes abonado de cada una.' },
  { p: '¿Qué pasa si alguien está de vacaciones o de baja?', r: 'Si es el mes completo, ese mes no genera débito y no cuenta para el cupo del año; sale como «Vacaciones el mes completo». Si faltan solo unos días, no se marca nada especial: se anotan los días que sí se hicieron.' },
  { p: 'Un mes ya pasado sin ningún día anotado, ¿qué cuenta?', r: 'Cuenta el débito completo (5 a Rafa, 4 a Carlos), salvo que sea un mes de vacaciones o baja. Un mes que aún no ha terminado y no tiene ningún día anotado todavía no cuenta.' },
  { p: '¿Por qué hay números con un + en verde?', r: 'Son días hechos de más. Si alguien hace más días que su cupo, no debe nada y el exceso resta del total acumulado. En el escrito a Gerencia también se escriben con +.' },
  { p: '¿Cómo se actualiza la aplicación?', r: 'Sola. Cada minuto mira si hay datos o una versión nueva y, si la hay, sale arriba una franja con el botón Actualizar. Púlsalo y se recarga con lo último. No hace falta instalar nada.' },
  { p: '¿Cómo sé si tengo la última versión de la aplicación?', r: 'Ve a Ayuda y pulsa «Buscar actualizaciones», junto a «Versión instalada». Si todo está al día, dice «Tienes la última versión (v1.8)». Si no, sale arriba el aviso con el botón Actualizar.' },
  { p: 'Pulso «Ver manual (PDF)» y no se descarga nada. ¿Es normal?', r: 'Sí. El manual se abre dentro de la propia aplicación, en una ventana con los botones «Guardar / descargar» y «Cerrar». Se hizo así porque, con la aplicación en la pantalla de inicio del iPad, abrir el PDF fuera la dejaba sin forma de volver. Ahora, al pulsar Cerrar, estás justo donde lo dejaste. Si quieres una copia, pulsa «Guardar / descargar»: en iPad e iPhone se abre la hoja de Compartir (Guardar en Archivos…) y en el ordenador se descarga el archivo.' },
  { p: 'Me dijeron que ya estaba guardado y no lo veo.', r: 'Los cambios tardan uno o dos minutos en publicarse. Pulsa Actualizar si aparece el aviso o recarga la página. Si sigues sin verlo, vuelve a abrirla pasado un rato.' },
  { p: '¿Por qué no veo la pestaña Editar?', r: 'Porque la edición es solo para quien tiene el token de GitHub de Carlos. Es lo normal: la aplicación está pensada para que el resto solo consulte. No es un fallo ni hay nada que configurar.' },
  { p: 'El botón «Abrir correo» no hace nada. ¿Qué hago?', r: 'Depende de que tu ordenador o móvil tenga un programa de correo configurado para abrir enlaces de correo. Si no, pulsa «Copiar texto», abre un correo nuevo, pega el texto y escribe a mano los destinatarios y el asunto, que están en la propia pantalla del escrito.' },
  { p: 'El escrito no sale con los meses que esperaba.', r: 'Cambia «Primer mes» y «Número de meses» (de 1 a 4). Si el último mes debe salir como previsión, marca la casilla «El último mes es previsión». Al abrir, la aplicación propone sola los meses desde el primero sin abonar.' },
  { p: 'El PDF del informe no se genera.', r: 'El navegador necesita descargar una herramienta para crearlo, así que hace falta conexión a internet. Vuelve a probar con conexión. En el móvil, el botón se llama «Ver / compartir PDF».' },
  { p: '¿Por qué el débito acumulado total es mucho mayor que el del año?', r: 'Porque mide cosas distintas. El **débito anual** solo cuenta los meses de ese año. El **acumulado total** suma todos los años desde agosto de 2024, cuando empezó el control. Por ejemplo, si en 2025 quedaron 32 continuidades sin hacer y en 2026 llevamos 22, el acumulado total es 54.' },
  { p: 'La aplicación dice que no puede cargar los datos.', r: 'Casi siempre es falta de conexión. Comprueba tu conexión y recarga. Si sigue igual, avisa a Carlos.' },
  { p: '¿Quién puede cambiar los datos?', r: 'Solo quien tiene el token de edición (hoy, Carlos). La seguridad la pone el token: sin él, nadie puede escribir, aunque tenga el enlace.' },
];
const FAQ_ROL_EXTRA = [
  { p: 'No me deja guardar: el botón está gris.', r: 'El botón solo se activa cuando has cambiado algo y no hay errores en rojo. Revisa si hay un día que no existe, repetido o más de cinco días, y corrígelo. Si no has cambiado nada, no hay nada que guardar.' },
  { p: 'Al guardar sale «Los datos han cambiado en GitHub».', r: 'Se han guardado datos desde otro sitio mientras editabas. La aplicación ya ha recargado lo nuevo y no ha sobrescrito nada: revisa el mes y vuelve a guardar.' },
  { p: 'Sale «El token no es válido o ha caducado».', r: 'Los tokens caducan (como mucho al año). La aplicación sigue sirviendo para consultar, pero no guarda. Crea un token nuevo con los mismos permisos (capítulo 10) y pégalo en Ajustes; antes puedes pulsar «Cerrar sesión / olvidar token».' },
  { p: 'He perdido el móvil o el ordenador donde estaba mi token.', r: 'Revoca ese token en GitHub (Settings › Developer settings › Fine-grained tokens) y crea otro para el dispositivo nuevo. Mientras tanto, nadie puede escribir sin la clave.' },
  { p: 'Me equivoqué al guardar un mes. ¿Cómo lo corrijo?', r: 'Vuelve a Editar, elige ese mes, cambia las casillas y guarda de nuevo. Para quitar un día, deja la casilla vacía.' },
  { p: '¿Qué marco primero: los días o el abonado?', r: 'Da igual el orden, pero guarda las dos cosas antes de abrir el escrito: el texto usa los días de cada mes y el «Abonado hasta» de cada persona.' },
];

/* ---------------- Ensamblaje ---------------- */
function bloqueContenido(b, incluirSoloRol, capSolo = false) {
  if (b.soloRol && !incluirSoloRol) return [];
  const out = [H.h3(b.h)];
  (b.parrafos || []).forEach((p) => out.push(H.parrafo(p)));
  (b.lista || []).forEach((l) => out.push(H.bullet(l)));
  const inst = ++instanciaNumeracion;
  (b.pasos || []).forEach((l) => out.push(H.numerado(l, inst)));
  if (b.pasos) out.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  if (b.tablaDatos) out.push(H.tabla(b.tablaDatos.cabeceras, b.tablaDatos.filas, b.tablaDatos.anchos), new Paragraph({ spacing: { after: 160 }, children: [] }));
  if (b.imagen) out.push(...H.imagenConPie(b.imagen.file, b.imagen.pie, b.imagen.ancho || 560));
  if (b.imagenes) {
    const pequenas = b.imagenes.every((im) => (im.ancho || 560) <= 270);
    if (pequenas) out.push(...H.imagenesEnFila(b.imagenes, b.imagenes[0].ancho));
    else b.imagenes.forEach((im) => out.push(...H.imagenConPie(im.file, im.pie, im.ancho || 560)));
  }
  if (b.tip) out.push(...H.tip(b.tip.titulo, b.tip.lineas));
  if (b.aviso) out.push(...H.aviso(b.aviso.titulo, b.aviso.lineas));
  if (b.soloEn && incluirSoloRol) out.push(...H.bandaRol(ROL, b.soloEn.lineas));
  if (b.soloRol && !capSolo) return [out[0], ...H.bandaRol(b.soloRol, ['Este apartado solo aparece en el manual del Modo edición.']), ...out.slice(1)];
  return out;
}
let instanciaNumeracion = 0;
const indice = []; // entradas del índice, como texto normal (compatible con cualquier visor)
function capitulo(cap, incluirSoloRol) {
  if (cap.soloRol && !incluirSoloRol) return [];
  const bloques = (cap.bloques || []).filter((b) => !b.soloRol || incluirSoloRol);
  if (!bloques.length) return [];
  indice.push({ nivel: 1, texto: cap.titulo });
  const out = [H.h1(cap.titulo)];
  if (cap.intro) out.push(H.parrafo(cap.intro));
  if (cap.soloRol) out.push(...H.bandaRol(cap.soloRol, ['Este capítulo solo aparece en el manual del Modo edición.']));
  bloques.forEach((b) => { indice.push({ nivel: 2, texto: b.h }); out.push(...bloqueContenido(b, incluirSoloRol, !!cap.soloRol)); });
  return out;
}
function anexoFaq(incluirSoloRol) {
  const preguntas = incluirSoloRol ? [...FAQ, ...FAQ_ROL_EXTRA] : FAQ;
  indice.push({ nivel: 1, texto: 'Anexo. Preguntas frecuentes' });
  const out = [H.h1('Anexo. Preguntas frecuentes')];
  preguntas.forEach((f, i) => out.push(...H.preguntaFrecuente(i + 1, f.p, f.r)));
  return out;
}
function portada(tituloManual) {
  const t = (text, o = {}) => new TextRun({ text, font: FUENTE, ...o });
  // Icono de la app (el PNG de mayor resolución: 512 px).
  const icono = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'img', 'icono-512.png'));
  return [
    new Paragraph({ spacing: { before: 1000, after: 300 }, alignment: AlignmentType.CENTER,
      children: [new ImageRun({ type: 'png', data: icono, transformation: { width: 150, height: 150 }, altText: { title: 'Icono', description: 'Icono de la aplicación', name: 'icono' } })] }),
    new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: PALETA.principalOsc, space: 20 } },
      children: [t(APP.nombreCorto, { bold: true, size: 52, color: PALETA.principalOsc })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 1800 }, children: [t(tituloManual, { size: 40, color: PALETA.principal, bold: true })] }),
    ...APP.organizacion.map((o, i) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [t(o, { size: i === 0 ? 24 : 22, color: i === 2 ? PALETA.gris : PALETA.texto, bold: !i })] })),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1400 }, children: [t(`Versión ${APP.version} · ${APP.fecha}`, { size: 22, bold: true, color: PALETA.principalOsc })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [t(`Autor: ${APP.autor}`, { size: 22, color: PALETA.texto })] }),
    new Paragraph({ children: [new H.PageBreak()] }),
  ];
}

function construirDocumento({ tituloManual, incluirSoloRol, clave }) {
  figura = 0; indice.length = 0; instanciaNumeracion = 0;
  const cuerpo = [];
  CAPITULOS.forEach((cap) => cuerpo.push(...capitulo(cap, incluirSoloRol)));
  cuerpo.push(...anexoFaq(incluirSoloRol));
  // Índice como texto normal (los campos de índice salen vacíos al convertir a PDF sin Word).
  // Páginas: las calcula paginas_indice.py sobre el PDF de la pasada anterior (si no existe, el índice sale sin números).
  const fichero = path.join(CAP, `paginas_${clave}.json`);
  const paginas = fs.existsSync(fichero) ? JSON.parse(fs.readFileSync(fichero, 'utf8')) : [];
  fs.writeFileSync(path.join(CAP, `indice_${clave}.json`), JSON.stringify(indice));
  const tocParrafos = indice.map((e, i) => new Paragraph({ spacing: { before: e.nivel === 1 ? 100 : 0, after: 20 }, indent: { left: e.nivel === 1 ? 0 : 400 },
    tabStops: [{ type: TabStopType.RIGHT, position: 9000, leader: LeaderType.DOT }],
    children: [new TextRun({ text: e.texto + (paginas[i] ? `\t${paginas[i]}` : ''), font: FUENTE, bold: e.nivel === 1, size: e.nivel === 1 ? 23 : 20, color: e.nivel === 1 ? PALETA.principalOsc : PALETA.texto })] }));
  const children = [
    ...portada(tituloManual),
    new Paragraph({ children: [new TextRun({ text: 'Índice', bold: true, size: 34, color: PALETA.principalOsc, font: FUENTE })], spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: PALETA.principal, space: 6 } } }),
    ...tocParrafos,
    ...cuerpo,
  ];
  return new Document({
    creator: APP.autor, title: `${APP.nombreCorto} — ${tituloManual}`,
    styles: {
      default: { document: { run: { font: FUENTE, size: 22, color: PALETA.texto } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 34, bold: true, color: PALETA.principalOsc, font: FUENTE },
          paragraph: { spacing: { before: 320, after: 220 }, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: PALETA.principal, space: 6 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 27, bold: true, color: PALETA.principal, font: FUENTE }, paragraph: { spacing: { before: 260, after: 160 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, color: PALETA.principalOsc, font: FUENTE }, paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 2, keepNext: true } },
      ],
    },
    numbering: H.numeracion,
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `${APP.nombreCorto} · ${tituloManual}`, size: 16, color: PALETA.gris, font: FUENTE })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Página ', size: 16, color: PALETA.gris, font: FUENTE }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: PALETA.gris, font: FUENTE }),
          new TextRun({ text: ' de ', size: 16, color: PALETA.gris, font: FUENTE }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: PALETA.gris, font: FUENTE })] })] }) },
      children,
    }],
  });
}

async function main() {
  const OUT = process.argv[2] || '.';
  fs.mkdirSync(OUT, { recursive: true });
  const consulta = construirDocumento({ tituloManual: 'Manual de consulta', incluirSoloRol: false, clave: 'consulta' });
  fs.writeFileSync(path.join(OUT, 'Manual_Control_Continuidades.docx'), await Packer.toBuffer(consulta));
  const edicion = construirDocumento({ tituloManual: 'Manual del modo edición', incluirSoloRol: true, clave: 'edicion' });
  fs.writeFileSync(path.join(OUT, 'Manual_Control_Continuidades_Edicion.docx'), await Packer.toBuffer(edicion));
  console.log('Generados en', OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });
