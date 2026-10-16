# Modelo del escrito mensual a Gerencia

## Cuándo se hace

Cada mes, más o menos entre el **15 y el 25**, cuando sale el cuadrante de trabajo, Carlos anota los días
de continuidades del mes y envía un correo a Gerencia. En el correo informa hasta qué mes se ha abonado
y envía los días de los meses pendientes, más la **previsión** del mes siguiente, para que los valoren y,
si los aprueban, los pasen a Nóminas.

## Correo

| Campo | Valor |
|---|---|
| De | Carlos J. Galán Doval — carlosjavier.galan.sspa@juntadeandalucia.es (cuenta corporativa) |
| Para | Pedro M. Castro Cobos (Gerente del Área de Gestión Sanitaria Sur de Córdoba) — pedromanuel.castro.sspa@juntadeandalucia.es |
| Para | Soledad Delgado Zafra (Directora Médica del Área) — soledad.delgado.sspa@juntadeandalucia.es |
| CCO | Rafa — rjavier.romero.sspa@juntadeandalucia.es |
| Asunto (propuesta) | `Continuidades Área de Calidad: Septiembre 2026, Octubre 2026 y previsión de Noviembre 2026` |

En el texto se les llama **"Sole y Pedro"**.

## Estructura del texto

```
{Buenos días | Buenas tardes}, Sole y Pedro:

Esta es la información de las continuidades de {Mes1 Año}, {Mes2 Año} y la previsión de {MesN Año}. Os confirmamos que han sido abonadas todas hasta {Mes Año}. Gracias.

{Mes Año}
Rafa: Solicitados {n} (Débito mensual {-d}; Acumulados 2024/{AA} {-acum})
    • Día {d}, {día de la semana}.
    • ...
Carlos:
    • Día {d}, {día de la semana}.
    • ...

{siguiente mes...}
```

### Reglas del texto
- De 1 a 4 meses por escrito. El último puede ser **previsión** ("y la previsión de …").
- Si a Rafa y a Carlos se les ha abonado hasta meses distintos:
  "Os confirmamos que a Rafa se le han abonado todas hasta {X} y a Carlos hasta {Y}."
- Línea de Carlos: solo "Carlos:" si su débito mensual y su acumulado son 0. Si no, el mismo formato que la de Rafa.
- Mes de vacaciones o baja: `Rafa: vacaciones el mes completo (sin débito).`
- Débito 0 se escribe `0`; los débitos positivos se escriben con signo menos (`-3`); si hay superávit, `+1`.
- `AA` = las dos últimas cifras del año del mes. Antes ponía siempre "2024/25", que ya no era correcto.
- Días de la semana en minúscula y en castellano: lunes, martes, miércoles, jueves, viernes, sábado, domingo.
- Cada viñeta termina en punto.

## Ejemplo (generado con los datos reales, mismo envío que el del 15-10-2026)

```
Buenos días, Sole y Pedro:

Esta es la información de las continuidades de Septiembre 2026, Octubre 2026 y la previsión de Noviembre 2026. Os confirmamos que han sido abonadas todas hasta Agosto de 2026. Gracias.

Septiembre 2026
Rafa: Solicitados 2 (Débito mensual -3; Acumulados 2024/26 -56)
    • Día 2, miércoles.
    • Día 15, martes.
Carlos:
    • Día 24, jueves.
    • Día 25, viernes.
    • Día 28, lunes.
    • Día 30, miércoles.

Octubre 2026
Rafa: Solicitados 1 (Débito mensual -4; Acumulados 2024/26 -60)
    • Día 27, martes.
Carlos:
    • Día 6, martes.
    • Día 13, martes.
    • Día 20, martes.
    • Día 27, martes.

Noviembre 2026
Rafa: Solicitados 4 (Débito mensual -1; Acumulados 2024/26 -61)
    • Día 3, martes.
    • Día 6, viernes.
    • Día 16, lunes.
    • Día 17, martes.
Carlos:
    • Día 4, miércoles.
    • Día 10, martes.
    • Día 17, martes.
    • Día 24, martes.
```
(En el escrito real del 15-10-2026 noviembre tenía errores; este es el texto correcto.)

## Ejemplos reales enviados

En `docs/ejemplos-escritos/` están los PDF de cuatro escritos enviados de verdad (2025 y 2026).
Sirven de **referencia de estilo**, pero tienen errores hechos a mano que la app debe evitar:
días de la semana equivocados, "Solicitados" que no cuadra con los días de la lista
y un "Día 31" en noviembre.
