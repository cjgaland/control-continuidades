# Reglas de cálculo de las continuidades

Acuerdo personal de Rafa y Carlos con la Gerencia del Área de Gestión Sanitaria Sur de Córdoba.
Inicio del control: **agosto de 2024**.

## Personas y cupo mensual

| Clave | Nombre completo | Nombre corto | Cargo | Cupo mensual |
|---|---|---|---|---|
| `rafa` | Rafael J. Romero de Castilla Gil | Rafa | Responsable de la Unidad de Calidad y Seguridad del Paciente | **5** continuidades |
| `carlos` | Carlos J. Galán Doval | Carlos | Área de Calidad y Seguridad del Paciente | **4** continuidades |

## Débito mensual (por persona y mes)

Para cada persona y mes:

1. **Mes anterior a agosto de 2024** → débito 0 (no se contabiliza).
2. **Mes completo de vacaciones o baja** (`ausencia` = `"vacaciones"` o `"baja"`) → débito 0. No se trabaja, así que no se pueden hacer continuidades.
3. **Mes ya terminado o con algún día anotado** → débito = `cupo − nº de días realizados`.
   - Un mes ya terminado **sin ningún día** genera el débito completo (5 Rafa / 4 Carlos).
     Ejemplo real: agosto de 2025, Rafa no pudo hacer ninguna → se le deben 5.
   - Si alguien hace más días que su cupo, el débito sale negativo y **resta** del acumulado.
4. **Mes futuro sin días anotados** → débito 0 (aún no cuenta).

"Mes terminado" = el día 1 del mes siguiente ya ha llegado (fecha de hoy).

## Acumulados

- **Débito acumulado del año** hasta un mes = suma de los débitos mensuales del año hasta ese mes.
  Nunca se pone a cero porque un mes quede vacío.
- **Débito anual** = suma de los 12 débitos mensuales del año.
- **Débito acumulado total** = suma de todos los débitos desde agosto de 2024.
  En los escritos se expresa en negativo: `Acumulados 2024/26 -60`.

## Abonado

- Cada persona tiene su propia marca de **abonado** por mes: a uno se le puede haber abonado y al otro no.
- "Abonado hasta" de una persona = el último mes (en orden cronológico) que tiene marcado `abonado: true`.

## Validaciones

- Cada mes admite de 0 a 5 días por persona.
- El día tiene que existir en ese mes (no hay 31 de noviembre). Si no existe, se avisa y no se acepta.
- El día de la semana se calcula a partir de la fecha; nunca se escribe a mano.
- No puede haber días repetidos en el mismo mes y persona.

## Cifras de control (para tests)

Con los datos de `datos/continuidades.json` y fecha de hoy 16-10-2026:

| | 2024 | 2025 | 2026 (ene–oct) | Acumulado a oct-2026 |
|---|---|---|---|---|
| Rafa | 7 | 32 | 21 | **60** |
| Carlos | 0 | 0 | 0 | **0** |

Detalle Rafa 2025 por mes (ene→dic): 1, 3, 2, 1, 3, 3, 4, **5** (agosto, sin días), 4, 2, 3, 1.

> Nota: el 16-10-2026 se corrigió en el Excel un "31" de noviembre de 2026 de Rafa que no existía. Noviembre de 2026 queda con 4 días (3, 6, 16 y 17).
