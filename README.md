# MatrizSolve — edición modular

Aplicación web educativa para construir, analizar y resolver sistemas de ecuaciones lineales.

## Requisitos
- Navegador moderno (Chrome, Edge o Firefox).
- Conexión a Internet para cargar Tailwind CSS, Lucide y MathJax desde sus CDN.
- No requiere Node.js, compilación, instalación de paquetes ni claves API para el funcionamiento matemático local.

## Abrir en VS Code
Doble clic en `MatrizSolve.code-workspace` (o en `Abrir_en_VSCode.bat`). Luego:
- **F5** → ejecuta `main.py` y abre la app en el navegador.
- **Ctrl+Shift+B** → inicia el servidor.
- **Terminal → Run Task → Correr pruebas** → `node --test`.
Al abrir, VS Code sugerirá instalar las extensiones recomendadas (Python, Live Server).

## Ejecutar (Python)
```bash
cd MatrizSolve_v2
python main.py          # abre http://localhost:8000 en el navegador
python main.py 9000     # otro puerto
```
Equivalente manual: `python -m http.server 8000` y abrir `http://localhost:8000`.
También funciona abriendo `index.html` directamente con doble clic.

## Pruebas automáticas (Node 18+)
```bash
node --test tests/engine.test.js
```

## Arquitectura
```text
index.html · main.py · css/styles.css
js/core/            ← matemática pura, SIN DOM (se prueba sola)
├── numbers.js          fracciones, formato, sanitización, escapeHTML
├── equation-parser.js  texto "2x + y = 5" → coeficientes
├── row-reduction.js    rowReduce + solveSystem(A, b, nombres)
└── matrix-ops.js       determinante, rango, producto, menores
js/                 ← estado, interfaz y presentación (usan el DOM)
├── 01-state.js · 02-interface.js · 03-input.js · 04-tutor.js
├── 05-linear-algebra.js   envoltorio solveCurrentSystem + conclusión HTML
├── 06-methods.js          pasos de Gauss, Gauss-Jordan, Cramer, inversa, Sarrus
└── 07-results.js          pestañas, preajustes, diagnóstico, comparación
tests/engine.test.js
```

## Decisiones para evitar roturas
- Los módulos JavaScript se cargan como scripts clásicos, no como ES modules. Esto conserva las funciones globales utilizadas por atributos `onclick` existentes.
- El orden numérico de los archivos es intencional. No reordenar los `<script>` sin revisar dependencias.
- El código original se distribuyó por límites de funciones, sin reescribir los algoritmos.
- Las bibliotecas externas se mantienen por CDN, evitando dependencias nuevas.

## Comprobación técnica
Se debe ejecutar `node --check` sobre cada archivo JavaScript y realizar una prueba funcional en navegador con:
1. Sistema compatible determinado.
2. Sistema compatible indeterminado.
3. Sistema incompatible.
4. Sistema con pivote inicial nulo.
5. Sistema rectangular.
6. Cramer e inversa en matrices cuadradas invertibles.
7. Intento de Cramer/inversa en matrices no invertibles.
8. Entrada de fracciones y números negativos.

## Limitaciones conocidas
El tutor existente es local y basado en reglas; no es una IA generativa conectada. No se añaden servicios externos ni credenciales. La precisión del motor sigue dependiendo de la implementación numérica original y sus tolerancias.
