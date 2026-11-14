# Plan de pruebas de regresión

Ejecutar estas pruebas después de cualquier modificación del motor.

| Caso | Datos de referencia | Resultado esperado |
|---|---|---|
| Solución única | `2x+y=5`, `x-y=1` | `x=2`, `y=1` |
| Infinitas soluciones | `x+y=2`, `2x+2y=4` | Una variable libre |
| Incompatible | `x+y=2`, `2x+2y=5` | Sin solución |
| Pivote nulo | `y=2`, `x+y=3` | Intercambio de filas y solución `x=1,y=2` |
| Rectangular | `x+y+z=3`, `x-y+z=1` | Familia paramétrica |
| Determinante cero | `[[1,2],[2,4]]` | Singular; inversa y Cramer no aplican |
| Fracciones | `x/2+y=2`, `x-y=0` | `x=y=4/3` |
| Negativos | `x+y=-1`, `x-y=3` | `x=1`, `y=-2` |

## Validación técnica automatizada
Desde la carpeta del proyecto:

```bash
for f in js/*.js; do node --check "$f" || exit 1; done
```

La comprobación de sintaxis no sustituye la prueba de interfaz en un navegador. Verificar también los botones de navegación, editor, resolución, copiar procedimiento, tema oscuro y tutor.
