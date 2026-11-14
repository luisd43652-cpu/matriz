# Arquitectura de MatrizSolve

## Principio
Separación por responsabilidad con JavaScript clásico y carga ordenada. Se priorizó una refactorización estructural de bajo riesgo frente a reescribir el motor matemático.

## Capas
- `js/core/`: funciones puras (entran datos, salen datos). No leen `rows`, `cols`, `matrixA` ni el DOM. Se prueban con `node --test`.
- `js/*.js`: leen el estado global, llaman al núcleo y pintan HTML.

## Flujo general
1. `index.html` define estructura y carga dependencias visuales.
2. `01-state.js` inicializa estado y controlador.
3. `02-interface.js` y `03-input.js` administran interacción y entradas.
4. `04-tutor.js` procesa la ayuda local.
5. `05-linear-algebra.js` contiene reducción y clasificación.
6. `06-methods.js` genera procedimientos por método.
7. `07-results.js` contiene diagnósticos, utilidades, comparación y vistas.

## Contrato de integración
Los scripts se ejecutan en el orden declarado en `index.html`. Se mantienen las declaraciones globales para que el HTML existente pueda invocar funciones mediante `onclick`. No convertir los archivos a `type="module"` sin migrar también los controladores HTML a `addEventListener`.

## Cambios futuros recomendados
- Incorporar pruebas unitarias independientes para operaciones matriciales.
- Migrar gradualmente los `onclick` inline a listeners.
- Extraer un núcleo matemático puro separado del DOM.
- Añadir aritmética racional exacta y pruebas de regresión antes de cambiar algoritmos.
- Incorporar backend seguro solo cuando exista un proveedor de IA y una clave configurada en servidor.
