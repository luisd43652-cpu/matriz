// MatrizSolve — módulo separado del archivo original.
// Se carga como script clásico para conservar compatibilidad con los onclick del HTML.

    function runGaussSteps() {
      renderReductionSteps('gauss');
    }
    function runGaussJordanSteps() {
      renderReductionSteps('gauss-jordan');
    }

    function rowArithmeticDisclosure(label, before, pivotValues, factor) {
      if (!showDetailedArithmetic) return '';
      const calculations = before.map((value, col) => `${escapeHTML(label)} columna ${col + 1}: ${formatNumber(value)} − (${formatNumber(factor)} × ${formatNumber(pivotValues[col])}) = ${formatNumber(value - factor * pivotValues[col])}`);
      return `<details open class="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2"><summary class="cursor-pointer font-semibold">Ver multiplicaciones de la fila</summary><div class="pt-2 space-y-1">${calculations.join('<br>')}</div></details>`;
    }

    function rowDivisionDisclosure(label, before, divisor) {
      if (!showDetailedArithmetic) return '';
      const calculations = before.map((value, col) => `${escapeHTML(label)} columna ${col + 1}: ${formatNumber(value)} ÷ ${formatNumber(divisor)} = ${formatNumber(value / divisor)}`);
      return `<details open class="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2"><summary class="cursor-pointer font-semibold">Ver división de cada elemento</summary><div class="pt-2 space-y-1">${calculations.join('<br>')}</div></details>`;
    }

    function determinantArithmeticDisclosure(mat, label) {
      if (!showDetailedArithmetic) return '';
      const work = sanitizeMatrix(mat);
      const n = work.length;
      let swaps = 0;
      const pivotValues = [];
      const operations = [];
      for (let col = 0; col < n; col++) {
        let pivotRow = col;
        for (let row = col + 1; row < n; row++) {
          if (Math.abs(work[row][col]) > Math.abs(work[pivotRow][col])) pivotRow = row;
        }
        if (work[pivotRow][col] === 0) {
          operations.push(`Columna ${col + 1}: no hay pivote no nulo; el determinante es 0.`);
          break;
        }
        if (pivotRow !== col) {
          [work[col], work[pivotRow]] = [work[pivotRow], work[col]];
          swaps++;
          operations.push(`Intercambio: $R_${col + 1} \\leftrightarrow R_${pivotRow + 1}$; cada intercambio cambia el signo del determinante.`);
        }
        const pivot = work[col][col];
        pivotValues.push(pivot);
        operations.push(`Pivote ${col + 1}: ${formatNumber(pivot)}.`);
        for (let row = col + 1; row < n; row++) {
          const factor = work[row][col] / pivot;
          if (factor === 0) continue;
          const cells = [];
          for (let j = col + 1; j < n; j++) {
            const before = work[row][j];
            const pivotValue = work[col][j];
            const after = before - factor * pivotValue;
            cells.push(`col. ${j + 1}: ${formatNumber(before)} − (${formatNumber(factor)} × ${formatNumber(pivotValue)}) = ${formatNumber(after)}`);
            work[row][j] = after;
          }
          work[row][col] = 0;
          operations.push(`$R_${row + 1} \\leftarrow R_${row + 1} - (${formatNumber(factor)})R_${col + 1}$<br>${cells.join('<br>')}`);
        }
      }
      const determinant = computeDeterminant(mat);
      const sign = swaps % 2 ? '-1' : '+1';
      const pivotProduct = pivotValues.length ? pivotValues.map(formatNumber).join(' × ') : '1';
      return `<details open class="mt-2 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2"><summary class="cursor-pointer font-semibold">Ver cómo se calcula det(${escapeHTML(label)})</summary><div class="pt-2 space-y-1"><div>Eliminación por filas; el determinante es el signo de los intercambios multiplicado por los pivotes: (${sign}) × ${pivotProduct} = ${formatNumber(determinant)}.</div>${operations.map(item => `<div>${item}</div>`).join('')}</div></details>`;
    }

    function runCramerSteps() {
      const container = document.getElementById('steps-container');
      if (!container) return;
      container.innerHTML = '';

      let safeA = sanitizeMatrix(matrixA);
      let safeB = sanitizeVector(vectorB);
      let n = safeA.length;

      if (rows !== cols) {
        container.innerHTML = `<div class="p-4 bg-rose-100 text-rose-800 rounded-xl text-xs">La Regla de Cramer solo es aplicable a sistemas cuadrados (mismo número de ecuaciones que de incógnitas).</div>`;
        return;
      }

      let rankA = computeRank(safeA);
      let detA = rankA < n ? 0 : computeDeterminant(safeA);
      const variableNames = getSystemVariableNames();
      let html = `
        <div class="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2">
          <h3 class="font-bold text-sm text-sky-900 dark:text-sky-200 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4"></i> Fundamento de la Regla de Cramer
          </h3>
          <p class="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
            La Regla de Cramer expresa el valor de cada variable $x_i$ como el cociente de dos determinantes: $x_i = \\frac{\\det(A_i)}{\\det(A)}$, donde $A_i$ es la matriz que resulta de reemplazar la $i$-ésima columna de $A$ por el vector de términos independientes $B$.
          </p>
        </div>

        <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div class="font-bold text-xs text-slate-800 dark:text-slate-100">Paso 1: Determinante Principal del Sistema $\\det(A)$</div>
          <div class="overflow-x-auto text-center font-mono text-xs">
            $\\det(A) = \\mathbf{${formatNumber(detA)}}$
          </div>
          ${determinantArithmeticDisclosure(safeA, 'A')}
        </div>
      `;

      if (rankA < n) {
        html += `
          <div class="p-4 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 rounded-xl text-xs">
            Como $\\det(A) = 0$, la Regla de Cramer no se puede aplicar directamente (el sistema es incompatible o compatible indeterminado).
          </div>
        `;
        container.innerHTML = html;
        return;
      }

      for (let c = 0; c < n; c++) {
        let Ai = safeA.map((row, rIdx) => {
          let newRow = [...row];
          newRow[c] = safeB[rIdx];
          return newRow;
        });

        let detAi = computeDeterminant(Ai);
        let xi = detAi / detA;

        html += `
          <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div class="font-bold text-xs text-indigo-600 dark:text-indigo-400">Paso ${c+2}: Cálculo de la Incógnita $${variableNames[c]}$</div>
            <p class="text-xs text-slate-600 dark:text-slate-300">Sustituimos la columna ${c+1} de la matriz $A$ por el vector $B$ para formar $A_${c+1}$ y calculamos su determinante:</p>
            <div class="overflow-x-auto text-center font-mono text-xs space-y-2">
              <div>$A_${c+1} = ${matrixToLatex(Ai)}$</div>
              <div>$\\det(A_${c+1}) = ${formatNumber(detAi)}$</div>
              ${determinantArithmeticDisclosure(Ai, `A_${c + 1}`)}
              <div class="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg inline-block font-bold text-indigo-700 dark:text-indigo-300">
                $${variableNames[c]} = \\frac{\\det(A_${c+1})}{\\det(A)} = \\frac{${formatNumber(detAi)}}{${formatNumber(detA)}} = \\mathbf{${formatNumber(xi)}}$
              </div>
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
      window.lucide?.createIcons?.();
    }

    function runInverseGaussJordanSteps() {
      const container = document.getElementById('steps-container');
      if (!container) return;
      container.innerHTML = '';

      if (rows !== cols) {
        container.innerHTML = `<div class="p-4 bg-rose-100 text-rose-800 rounded-xl text-xs">Solo las matrices cuadradas poseen matriz inversa.</div>`;
        return;
      }

      const safeA = sanitizeMatrix(matrixA);
      const n = rows;
      if (computeRank(safeA) < n) {
        container.innerHTML = `
          <div class="p-4 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200 text-xs space-y-2">
            <div class="font-bold text-sm flex items-center gap-1.5">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i> Matriz Singular (No Invertible)
            </div>
            <p>El rango de A es menor que su dimensión, así que $A^{-1}$ no existe. El resultado completo del sistema aparece debajo.</p>
          </div>
        `;
        window.lucide?.createIcons?.();
        return;
      }

      const identity = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
      const aug = safeA.map((row, i) => [...row, ...identity[i]]);

      let html = `
        <div class="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2">
          <h3 class="font-bold text-sm text-sky-900 dark:text-sky-200 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4"></i> Cálculo de la Inversa por Gauss-Jordan
          </h3>
          <p class="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
            Planteamos la matriz aumentada $[A \\mid I]$ y aplicamos operaciones elementales por fila para transformar el bloque izquierdo en la matriz identidad. La matriz resultante en el bloque derecho corresponderá a $A^{-1}$.
          </p>
        </div>

        <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-2">Matriz Aumentada Inicial $[A \\mid I]$:</div>
          <div class="overflow-x-auto text-center font-mono text-xs">
            $${matrixPairToLatex(safeA, identity)}$
          </div>
        </div>
      `;

      let stepCount = 1;
      for (let i = 0; i < n; i++) {
        let pivotRow = i;
        for (let candidate = i + 1; candidate < n; candidate++) {
          if (Math.abs(aug[candidate][i]) > Math.abs(aug[pivotRow][i])) pivotRow = candidate;
        }
        if (aug[pivotRow][i] === 0) {
          container.innerHTML = '<div class="p-4 bg-rose-50 text-rose-800 rounded-xl">No se pudo hallar un pivote no nulo; la matriz no tiene inversa.</div>';
          return;
        }
        if (pivotRow !== i) {
          [aug[i], aug[pivotRow]] = [aug[pivotRow], aug[i]];
          html += `
            <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div class="font-bold text-xs text-indigo-600 dark:text-indigo-400">Paso ${stepCount++}: intercambio $R_${i + 1} \\leftrightarrow R_${pivotRow + 1}$</div>
              <div class="overflow-x-auto text-center font-mono text-xs">$${matrixPairToLatex(aug.map(row => row.slice(0, n)), aug.map(row => row.slice(n)))}$</div>
            </div>
          `;
        }

        const pivot = aug[i][i];
        const normalizedRowBefore = [...aug[i]];
        for (let col = 0; col < 2 * n; col++) aug[i][col] /= pivot;
        aug[i][i] = 1;
        html += `
          <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div class="font-bold text-xs text-indigo-600 dark:text-indigo-400">Paso ${stepCount++}: normalizar $R_${i + 1} \\leftarrow R_${i + 1}/${formatNumber(pivot)}$</div>
            ${rowDivisionDisclosure(`R_${i + 1}`, normalizedRowBefore, pivot)}
            <div class="overflow-x-auto text-center font-mono text-xs">$${matrixPairToLatex(aug.map(row => row.slice(0, n)), aug.map(row => row.slice(n)))}$</div>
          </div>
        `;

        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          const factor = aug[j][i];
          if (factor === 0) continue;
          const rowBefore = [...aug[j]];
          const pivotValues = [...aug[i]];
          for (let col = 0; col < 2 * n; col++) aug[j][col] -= factor * aug[i][col];
          aug[j][i] = 0;

          html += `
            <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div class="font-bold text-xs text-sky-600 dark:text-sky-400">Paso ${stepCount++}: $R_${j + 1} \\leftarrow R_${j + 1} - (${formatNumber(factor)}) \\cdot R_${i + 1}$</div>
              ${rowArithmeticDisclosure(`R_${j + 1}`, rowBefore, pivotValues, factor)}
              <div class="overflow-x-auto text-center font-mono text-xs">$${matrixPairToLatex(aug.map(row => row.slice(0, n)), aug.map(row => row.slice(n)))}$</div>
            </div>
          `;
        }
      }

      let inverseMatrix = aug.map(r => r.slice(n));
      html += `
        <div class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
          <div class="font-bold text-xs text-emerald-900 dark:text-emerald-200">Matriz Inversa Resultante $A^{-1}$:</div>
          <div class="overflow-x-auto text-center font-mono text-xs">
            $A^{-1} = ${matrixToLatex(inverseMatrix)}$
          </div>
          ${inverseVerificationHtml(safeA, inverseMatrix)}
          ${inverseProductResultHtml(inverseMatrix, sanitizeVector(vectorB))}
        </div>
      `;

      container.innerHTML = html;
      window.lucide?.createIcons?.();
    }

    function runInverseSarrusAdjointSteps() {
      const container = document.getElementById('steps-container');
      if (!container) return;
      container.innerHTML = '';

      if (rows !== cols) {
        container.innerHTML = `<div class="p-4 bg-rose-100 text-rose-800 rounded-xl text-xs">Solo las matrices cuadradas poseen matriz inversa.</div>`;
        return;
      }

      let safeA = sanitizeMatrix(matrixA);
      let det = computeDeterminant(safeA);

      if (computeRank(safeA) < rows) {
        container.innerHTML = `
          <div class="p-4 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200 text-xs space-y-2">
            <div class="font-bold text-sm flex items-center gap-1.5">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i> Matriz Singular (No Invertible)
            </div>
            <p>El determinante es $\\det(A) = 0$. La matriz $A$ no posee inversa ($A^{-1}$ no existe).</p>
          </div>
        `;
        window.lucide?.createIcons?.();
        return;
      }

      let n = rows;
      let cofactorMatrix = Array.from({ length: n }, () => new Array(n).fill(0));
      let cofactorDetails = [];

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          let minor = getMinor(safeA, r, c);
          let minorDet = computeDeterminant(minor);
          let sign = ((r + c) % 2 === 0) ? 1 : -1;
          let signStr = ((r + c) % 2 === 0) ? '+1' : '-1';
          cofactorMatrix[r][c] = sign * minorDet;

          let minorMatrixTex = matrixToLatex(minor);
          let calcDetail = '';
          if (minor.length === 2) {
            let a = minor[0][0], b = minor[0][1], c_val = minor[1][0], d = minor[1][1];
            
            // Format signed numbers in multiplication safely with parentheses if negative
            let fmtA = a < 0 ? `(${formatNumber(a)})` : formatNumber(a);
            let fmtB = b < 0 ? `(${formatNumber(b)})` : formatNumber(b);
            let fmtC = c_val < 0 ? `(${formatNumber(c_val)})` : formatNumber(c_val);
            let fmtD = d < 0 ? `(${formatNumber(d)})` : formatNumber(d);
            let fmtDet = minorDet < 0 ? `(${formatNumber(minorDet)})` : formatNumber(minorDet);

            calcDetail = `\\det(M_{${r+1}${c+1}}) = \\left(${fmtA} \\cdot ${fmtD}\\right) - \\left(${fmtB} \\cdot ${fmtC}\\right) = \\mathbf{${formatNumber(minorDet)}}`;
          } else {
            calcDetail = `\\det(M_{${r+1}${c+1}}) = \\mathbf{${formatNumber(minorDet)}}`;
          }

          let fmtMinorDetResult = minorDet < 0 ? `(${formatNumber(minorDet)})` : formatNumber(minorDet);

          cofactorDetails.push(`
            <details open class="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
              <summary class="cursor-pointer font-bold text-indigo-600 dark:text-indigo-400">Cofactor $C_{${r+1}${c+1}} = ${formatNumber(cofactorMatrix[r][c])}$ — ver cálculo</summary>
              <div class="pt-2 space-y-2">
              <div class="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
                $C_{${r+1}${c+1}} = (-1)^{${r+1}+${c+1}} \\cdot \\det(M_{${r+1}${c+1}})$
              </div>
              <div class="flex items-center gap-2">
                <span class="text-slate-500 font-medium">Submatriz Menor $M_{${r+1}${c+1}}$:</span>
                <div>$${minorMatrixTex}$</div>
              </div>
              <div class="text-slate-700 dark:text-slate-300 font-mono">
                Cálculo del Menor: $${calcDetail}$
              </div>
              <div class="pt-1.5 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                <span>Resultado Cofactor:</span>
                <span class="text-indigo-600 dark:text-indigo-300 font-bold">$C_{${r+1}${c+1}} = (${signStr}) \\cdot ${fmtMinorDetResult} = \\mathbf{${formatNumber(cofactorMatrix[r][c])}}$</span>
              </div>
              </div>
            </details>
          `);
        }
      }

      let adjMatrix = Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => cofactorMatrix[c][r])
      );

      let invMatrix = Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => adjMatrix[r][c] / det)
      );

      let html = `
        <div class="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
          <h3 class="font-bold text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <i data-lucide="calculator" class="w-4 h-4"></i> Inversa por Cofactores y Adjunta
          </h3>
          <p class="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
            Aplicamos la fórmula teórica: $A^{-1} = \\frac{1}{\\det(A)} \\cdot \\text{Adj}(A)$, donde $\\text{Adj}(A) = C^T$ es la traspuesta de la matriz de cofactores.
          </p>
        </div>

        <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div class="font-bold text-xs text-slate-800 dark:text-slate-100">Paso 1: Determinante Principal $\\det(A)$</div>
          <div class="overflow-x-auto text-center font-mono text-xs">
            $\\det(A) = \\mathbf{${formatNumber(det)}}$
          </div>
          ${determinantArithmeticDisclosure(safeA, 'A')}
        </div>

        <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <div class="font-bold text-xs text-slate-800 dark:text-slate-100">Paso 2: Cálculo Detallado de Cada Cofactor $C_{ij}$</div>
          <p class="text-xs text-slate-500">Para cada posición $(i,j)$ eliminamos la fila $i$ y la columna $j$, calculamos el determinante del menor $M_{ij}$ y aplicamos el signo $(-1)^{i+j}$:</p>
          ${showDetailedArithmetic ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${cofactorDetails.join('')}</div>` : '<p class="text-xs text-slate-500">Activa «Desglose Aritmético» para ver los menores y el cálculo de cada cofactor.</p>'}
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div class="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1.5 text-center">Matriz de Cofactores Resultante $C$:</div>
            <div class="overflow-x-auto text-center font-mono text-xs">
              $C = ${matrixToLatex(cofactorMatrix)}$
            </div>
          </div>
        </div>

        <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div class="font-bold text-xs text-slate-800 dark:text-slate-100">Paso 3: Matriz Adjunta $\\text{Adj}(A) = C^T$ (Traspuesta de $C$)</div>
          <p class="text-xs text-slate-500">Intercambiamos filas por columnas en la matriz de cofactores:</p>
          <div class="overflow-x-auto text-center font-mono text-xs">
            $\\text{Adj}(A) = ${matrixToLatex(adjMatrix)}$
          </div>
        </div>

        <div class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
          <div class="font-bold text-xs text-emerald-900 dark:text-emerald-200">Paso 4: Matriz Inversa Resultante $A^{-1} = \\frac{1}{\\det(A)} \\cdot \\text{Adj}(A)$</div>
          <div class="overflow-x-auto text-center font-mono text-xs">
            $A^{-1} = \\frac{1}{${formatNumber(det)}} \\cdot ${matrixToLatex(adjMatrix)} = \\mathbf{${matrixToLatex(invMatrix)}}$
          </div>
          ${inverseVerificationHtml(safeA, invMatrix)}
          ${inverseProductResultHtml(invMatrix, sanitizeVector(vectorB))}
        </div>
      `;

      container.innerHTML = html;
      window.lucide?.createIcons?.();
    }

    // --- REGLA DE SARRUS BREAKDOWN (3x3) ---

    function generateSarrusBreakdown() {
      const container = document.getElementById('sarrus-container');
      if (!container) return;

      if (rows !== 3 || cols !== 3) {
        container.innerHTML = `
          <div class="p-4 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 rounded-xl text-xs">
            La Regla de Sarrus está configurada exclusivamente para matrices de $3 \\times 3$. Modifica la dimensión de la matriz en el editor numérico a $3 \\times 3$.
          </div>
        `;
        return;
      }

      let A = sanitizeMatrix(matrixA);

      // Primary Diagonals (+)
      let p1 = A[0][0] * A[1][1] * A[2][2];
      let p2 = A[0][1] * A[1][2] * A[2][0];
      let p3 = A[0][2] * A[1][0] * A[2][1];
      let sumP = p1 + p2 + p3;

      // Secondary Diagonals (-)
      let s1 = A[0][2] * A[1][1] * A[2][0];
      let s2 = A[0][0] * A[1][2] * A[2][1];
      let s3 = A[0][1] * A[1][0] * A[2][2];
      let sumS = s1 + s2 + s3;

      let det = sumP - sumS;

      let expandedMatrixTex = `
        \\begin{matrix}
          ${formatNumber(A[0][0])} & ${formatNumber(A[0][1])} & ${formatNumber(A[0][2])} & \\mid & ${formatNumber(A[0][0])} & ${formatNumber(A[0][1])} \\\\
          ${formatNumber(A[1][0])} & ${formatNumber(A[1][1])} & ${formatNumber(A[1][2])} & \\mid & ${formatNumber(A[1][0])} & ${formatNumber(A[1][1])} \\\\
          ${formatNumber(A[2][0])} & ${formatNumber(A[2][1])} & ${formatNumber(A[2][2])} & \\mid & ${formatNumber(A[2][0])} & ${formatNumber(A[2][1])}
        \\end{matrix}
      `;

      container.innerHTML = `
        <div class="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2">
          <h3 class="font-bold text-sm text-sky-900 dark:text-sky-200 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4"></i> Esquema Extendido de la Regla de Sarrus
          </h3>
          <p class="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
            Se duplican las dos primeras columnas a la derecha de la matriz para facilitar el cálculo de las 3 diagonales descendentes (principales) y las 3 diagonales ascendentes (secundarias).
          </p>
        </div>

        <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
          <div class="font-bold text-xs text-slate-700 dark:text-slate-300">Matriz Aumentada $3 \\times 5$:</div>
          <div class="overflow-x-auto font-mono text-sm">
            $${expandedMatrixTex}$
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Primary Diagonals -->
          <div class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
            <div class="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <i data-lucide="arrow-down-right" class="w-4 h-4"></i> Diagonales Principales (Suma $+$)
            </div>
            <div class="font-mono text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <div>• D1: $(${formatNumber(A[0][0])}) \\cdot (${formatNumber(A[1][1])}) \\cdot (${formatNumber(A[2][2])}) = ${formatNumber(p1)}$</div>
              <div>• D2: $(${formatNumber(A[0][1])}) \\cdot (${formatNumber(A[1][2])}) \\cdot (${formatNumber(A[2][0])}) = ${formatNumber(p2)}$</div>
              <div>• D3: $(${formatNumber(A[0][2])}) \\cdot (${formatNumber(A[1][0])}) \\cdot (${formatNumber(A[2][1])}) = ${formatNumber(p3)}$</div>
              <div class="pt-2 font-bold border-t border-emerald-200 dark:border-emerald-800">
                Suma Principales ($P$) = $${formatNumber(p1)} + ${formatNumber(p2)} + ${formatNumber(p3)} = \\mathbf{${formatNumber(sumP)}}$
              </div>
            </div>
          </div>

          <!-- Secondary Diagonals -->
          <div class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
            <div class="font-bold text-xs text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <i data-lucide="arrow-up-right" class="w-4 h-4"></i> Diagonales Secundarias (Resta $-$)
            </div>
            <div class="font-mono text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div>• S1: $(${formatNumber(A[0][2])}) \\cdot (${formatNumber(A[1][1])}) \\cdot (${formatNumber(A[2][0])}) = ${formatNumber(s1)}$</div>
              <div>• S2: $(${formatNumber(A[0][0])}) \\cdot (${formatNumber(A[1][2])}) \\cdot (${formatNumber(A[2][1])}) = ${formatNumber(s2)}$</div>
              <div>• S3: $(${formatNumber(A[0][1])}) \\cdot (${formatNumber(A[1][0])}) \\cdot (${formatNumber(A[2][2])}) = ${formatNumber(s3)}$</div>
              <div class="pt-2 font-bold border-t border-rose-200 dark:border-rose-800">
                Suma Secundarias ($S$) = $${formatNumber(s1)} + ${formatNumber(s2)} + ${formatNumber(s3)} = \\mathbf{${formatNumber(sumS)}}$
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-center space-y-2">
          <div class="font-bold text-xs text-indigo-900 dark:text-indigo-200">Determinante Final $\\det(A) = P - S$</div>
          <div class="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-300">
            $\\det(A) = (${formatNumber(sumP)}) - (${formatNumber(sumS)}) = \\mathbf{${formatNumber(det)}}$
          </div>
        </div>
      `;

      window.lucide?.createIcons?.();
    }

    // --- NAVIGATION, DIAGNOSTICS & MATRIX HELPERS ---
