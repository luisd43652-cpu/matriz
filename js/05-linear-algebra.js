// MatrizSolve — módulo separado del archivo original.
// Se carga como script clásico para conservar compatibilidad con los onclick del HTML.

    // Envoltorio con estado global: delega todo el cálculo en solveSystem (js/core).
    function solveCurrentSystem() {
      return solveSystem(sanitizeMatrix(matrixA), sanitizeVector(vectorB), getSystemVariableNames());
    }

    function getSystemVariableNames() {
      const supplied = currentAIProblemContext?.parsed?.variableNames;
      if (Array.isArray(supplied) && supplied.length === cols && supplied.every(name => typeof name === 'string' && name.trim())) return supplied.map(name => name.trim());
      const conventional = ['x', 'y', 'z', 'w', 'v', 'u'];
      return Array.from({ length: cols }, (_, index) => conventional[index] || `x_${index + 1}`);
    }

    function renderReductionSteps(method) {
      const container = document.getElementById('steps-container');
      if (!container) return;
      const isJordan = method === 'gauss-jordan';
      const A = sanitizeMatrix(matrixA);
      const b = sanitizeVector(vectorB);
      const initial = A.map((row, index) => [...row, b[index]]);
      const reduction = rowReduce(initial, cols, isJordan);
      const result = solveCurrentSystem();
      const title = isJordan ? 'Gauss-Jordan: forma escalonada reducida' : 'Eliminación de Gauss: forma escalonada';
      const intro = isJordan
        ? 'Elegimos pivotes por columna, normalizamos cada pivote y anulamos los demás elementos de su columna. El recorrido admite matrices rectangulares y variables libres.'
        : 'Elegimos pivotes por columna y anulamos los elementos que quedan debajo. La clasificación final se confirma con los rangos y admite matrices rectangulares.';
      let html = `<div class="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2"><h3 class="font-bold text-sm text-sky-900 dark:text-sky-200">${title}</h3><p class="text-xs text-sky-800 dark:text-sky-300">${intro}</p></div>`;
      html += `<div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"><div class="font-semibold text-xs mb-2">Matriz aumentada inicial:</div><div class="overflow-x-auto text-center font-mono text-xs">$${matrixToLatex(A, b)}$</div></div>`;
      reduction.steps.forEach((step, index) => {
        let description = '';
        if (step.type === 'swap') description = `Paso ${index + 1}: intercambio de filas $R_{${step.row + 1}} \\leftrightarrow R_{${step.other + 1}}$.`;
        if (step.type === 'normalize') description = `Paso ${index + 1}: normalización del pivote $R_{${step.row + 1}} \\leftarrow R_{${step.row + 1}}/${formatNumber(step.pivot)}$.`;
        if (step.type === 'eliminate') description = `Paso ${index + 1}: $R_{${step.row + 1}} \\leftarrow R_{${step.row + 1}} - (${formatNumber(step.factor)})R_{${step.pivotRow + 1}}$.`;
        let details = '';
        if (showDetailedArithmetic && step.type === 'normalize') {
          details = `<details open class="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2"><summary class="cursor-pointer font-semibold">Ver división de cada elemento por el pivote</summary><div class="pt-2 space-y-1">${step.before.map((value, col) => `Columna ${col + 1}: ${formatNumber(value)} ÷ ${formatNumber(step.pivot)} = ${formatNumber(step.matrix[step.row][col])}`).join('<br>')}</div></details>`;
        } else if (showDetailedArithmetic && step.type === 'eliminate') {
          details = `<details open class="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2"><summary class="cursor-pointer font-semibold">Ver multiplicaciones y cálculo de cada celda</summary><div class="pt-2 space-y-1">${step.before.map((value, col) => `Columna ${col + 1}: ${formatNumber(value)} − (${formatNumber(step.factor)} × ${formatNumber(step.pivotValues[col])}) = ${formatNumber(step.matrix[step.row][col])}`).join('<br>')}</div></details>`;
        }
        html += `<div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2"><div class="font-bold text-xs text-indigo-600 dark:text-indigo-400">${description}</div>${details}<div class="overflow-x-auto text-center font-mono text-xs">$${matrixToLatex(step.matrix.map(row => row.slice(0, cols)), step.matrix.map(row => row[cols]))}$</div></div>`;
      });
      if (!reduction.steps.length) html += '<div class="p-3 text-xs text-slate-500 rounded-xl bg-slate-50 dark:bg-slate-800/50">No hay operaciones de fila necesarias para esta matriz.</div>';
      container.innerHTML = html;
      window.lucide?.createIcons?.();
    }

    function appendSystemConclusion() {
      const container = document.getElementById('steps-container');
      if (!container) return;
      const result = solveCurrentSystem();
      const A = sanitizeMatrix(matrixA);
      const b = sanitizeVector(vectorB);
      const variableNames = getSystemVariableNames();
      const tol = 1e-8 * Math.max(1, ...A.flat().map(Math.abs), ...b.map(Math.abs));
      const matrixLatex = (M) => `\\begin{bmatrix}${M.map(row => row.map(formatNumber).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
      const safeVar = (i) => escapeHTML(variableNames[i] || getSystemVariableNames()[i]);
      let tone = 'emerald';
      let body = '';
      let title = 'Análisis completo del sistema';
      let icon = 'badge-check';
      let conclusion = '';

      const rankInfo = `<div class="rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 p-3 space-y-1">
        <div class="font-semibold">Criterio de Rouché–Frobenius</div>
        <div> rango(A) = <strong>${result.rankA}</strong>; rango([A|b]) = <strong>${result.rankAug}</strong>; número de incógnitas = <strong>${cols}</strong>.</div>
        <div class="text-xs text-slate-600 dark:text-slate-300">${result.rankA !== result.rankAug
          ? 'Los rangos son distintos: el sistema es incompatible.'
          : result.rankA === cols
            ? 'Los rangos coinciden y son iguales al número de incógnitas: existe una solución única.'
            : 'Los rangos coinciden, pero son menores que el número de incógnitas: existen variables libres y, por tanto, infinitas soluciones.'}</div>
      </div>`;

      if (result.status === 'unique') {
        const checks = A.map((row, index) => {
          const terms = row.map((value, col) => value * result.solution[col]);
          const lhs = terms.reduce((sum, value) => sum + value, 0);
          return { lhs, terms, rhs: b[index], residual: lhs - b[index] };
        });
        const verified = checks.every(check => Math.abs(check.residual) <= tol);
        tone = verified ? 'emerald' : 'rose';
        title = verified ? 'Solución única verificada' : 'Solución obtenida: verificación numérica pendiente';
        const vectorTex = result.solution.map(formatNumber).join(' \\\\ ');
        const namedSolution = result.solution.map((value, index) => `<div class="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 dark:border-emerald-900/70 bg-white dark:bg-slate-950 px-3 py-2"><span class="text-sm font-semibold text-slate-600 dark:text-slate-300">${safeVar(index)}</span><span class="font-mono text-lg font-bold tabular-nums text-slate-950 dark:text-white">${formatNumber(value)}</span></div>`).join('');
        const checkRows = checks.map((check, index) => {
          const products = check.terms.map((term, col) => `(${formatNumber(A[index][col])})(${formatNumber(result.solution[col])})`).join(' + ');
          const details = `<details class="mt-1 text-xs"><summary class="cursor-pointer font-semibold">Desglosar operaciones</summary><div class="pt-1 font-mono break-words">${products} = ${formatNumber(check.lhs)}<br>${formatNumber(check.lhs)} − ${formatNumber(check.rhs)} = ${formatNumber(check.residual)}</div></details>`;
          return `<li class="pl-1"><strong>Ecuación ${index + 1}:</strong> ${formatNumber(check.lhs)} = ${formatNumber(check.rhs)}; residuo ${formatNumber(check.residual)}. ${details}</li>`;
        }).join('');
        body = `<div class="text-xl font-bold">${title}</div>
          <p>El sistema tiene una sola solución porque el rango de la matriz de coeficientes coincide con el número de incógnitas.</p>
          <div class="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3"><div class="font-semibold mb-2">Vector solución</div><div class="overflow-x-auto text-center text-base">$X=${matrixLatex(result.solution.map(v => [v]))}$</div><div class="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">${namedSolution}</div></div>
          <div><strong>Comprobación en las ${rows} ecuaciones originales</strong><p class="text-xs text-slate-600 dark:text-slate-300">Sustituimos los valores encontrados en cada ecuación. Un residuo cero confirma la igualdad.</p><ol class="list-decimal pl-5 space-y-2">${checkRows}</ol></div>${rankInfo}
          <p class="text-xs">${verified ? 'Verificación superada dentro de la tolerancia numérica.' : 'La sustitución produjo residuos mayores que la tolerancia; revisa la precisión o los datos.'}</p>`;
        conclusion = verified ? 'Cada ecuación queda satisfecha.' : 'No se debe considerar verificada hasta revisar los residuos.';
      } else if (result.status === 'infinite') {
        tone = 'amber';
        title = 'Infinitas soluciones: familia paramétrica';
        const free = result.freeCols || [];
        const rref = result.reduced.matrix;
        const particular = new Array(cols).fill(0);
        result.reduced.pivotCols.forEach((pivotCol, row) => { particular[pivotCol] = rref[row][cols]; });
        const basis = free.map(freeCol => {
          const v = new Array(cols).fill(0);
          v[freeCol] = 1;
          result.reduced.pivotCols.forEach((pivotCol, row) => { v[pivotCol] = -rref[row][freeCol]; });
          return v;
        });
        const checkVector = (v, rhs) => A.map((row, i) => row.reduce((s, a, j) => s + a * v[j], 0) - rhs[i]);
        const particularResiduals = checkVector(particular, b);
        const basisResiduals = basis.map(v => checkVector(v, new Array(rows).fill(0)));
        const familyVerified = particularResiduals.every(x => Math.abs(x) <= tol) && basisResiduals.every(vec => vec.every(x => Math.abs(x) <= tol));
        const paramRows = result.parametricText.split('; ').map(s => `<li class="font-mono">${escapeHTML(s)}</li>`).join('');
        const basisTex = basis.length ? basis.map((v, i) => `v_${i + 1}=${matrixLatex(v.map(x => [x]))}`).join(';\\quad ') : '';
        const residualText = particularResiduals.map((v, i) => `E${i + 1}: ${formatNumber(v)}`).join('; ');
        body = `<div class="text-xl font-bold">Infinitas soluciones</div>
          <p>Hay <strong>${free.length}</strong> variable(s) libre(s): ${free.map(i => safeVar(i)).join(', ')}. Cada parámetro puede tomar cualquier valor real.</p>
          <div class="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 space-y-2"><strong>Familia de soluciones</strong><ol class="list-disc pl-5 space-y-1">${paramRows}</ol>
          <div class="text-xs text-slate-600 dark:text-slate-300">Forma vectorial: $X=X_p+${basis.length ? basis.map((_, i) => `t_${i + 1}v_${i + 1}`).join('+') : '0'}$.</div>
          <div class="overflow-x-auto text-xs">$X_p=${matrixLatex(particular.map(x => [x]))}${basis.length ? ';\\quad ' + basisTex : ''}$</div></div>
          <div><strong>Comprobación de la familia</strong><ul class="list-disc pl-5 text-sm"><li>La solución particular se sustituye en el sistema: ${escapeHTML(residualText)}.</li><li>Cada vector dirección cumple $Av_i=0$: ${basisResiduals.map((v, i) => `v${i + 1}: ${v.every(x => Math.abs(x) <= tol) ? 'correcto' : 'revisar'}`).join('; ') || 'No hay vectores libres'}.</li></ul></div>
          ${rankInfo}<p class="text-xs">${familyVerified ? 'La solución particular y los vectores de la base del espacio nulo superan la comprobación numérica.' : 'La comprobación numérica detectó residuos; revisa el cálculo.'}</p>`;
        conclusion = 'El conjunto solución contiene infinitos vectores, descritos mediante parámetros.';
      } else {
        tone = 'rose';
        title = 'Sistema incompatible: no existe solución';
        const contradiction = result.reduced.matrix.find(row =>
          row.slice(0, cols).every(value => Math.abs(value) <= result.reduced.pivotTolerance) &&
          Math.abs(row[cols]) > result.reduced.rhsTolerance
        );
        const contradictionTex = contradiction
          ? `$0 = ${formatNumber(contradiction[cols])}$`
          : 'La reducción no produjo una fila contradictoria explícita dentro de la tolerancia usada.';
        body = `<div class="text-xl font-bold">${title}</div>
          <p>No existe ningún vector de incógnitas que satisfaga todas las ecuaciones simultáneamente.</p>
          <div class="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3"><strong>¿Cómo se detecta?</strong><p>Al reducir la matriz aumentada aparece una fila con todos los coeficientes de las incógnitas iguales a cero, pero con término independiente distinto de cero.</p><div class="text-center text-lg my-2">${contradictionTex}</div><p class="text-xs text-slate-600 dark:text-slate-300">Esto equivale a afirmar que cero es igual a un número no nulo, una contradicción.</p></div>
          ${rankInfo}<p class="text-xs">No se presenta un vector solución porque matemáticamente no existe.</p>`;
        conclusion = 'El sistema es incompatible por desigualdad de rangos.';
      }

      const palette = {
        emerald: 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100',
        amber: 'bg-amber-50 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100',
        rose: 'bg-rose-50 dark:bg-rose-950/35 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
      };
      // Resumen visual adaptable: primero comunica el veredicto; el desarrollo queda disponible sin saturar la pantalla.
      const statusLabel = result.status === 'unique' ? 'SOLUCIÓN ÚNICA' : result.status === 'infinite' ? 'INFINITAS SOLUCIONES' : 'SISTEMA INCOMPATIBLE';
      const statusColor = result.status === 'unique' ? 'emerald' : result.status === 'infinite' ? 'amber' : 'rose';
      const statusClasses = { emerald: {icon:'text-emerald-600', badge:'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200', panel:'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100'}, amber: {icon:'text-amber-600', badge:'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200', panel:'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100'}, rose: {icon:'text-rose-600', badge:'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200', panel:'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100'} };
      const heroResult = result.status === 'unique'
        ? `<div class="text-xs uppercase tracking-widest font-bold opacity-65 mb-3">Valores de las incógnitas</div><div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">${result.solution.map((v, i) => `<div class="min-w-0 rounded-xl border border-emerald-200/80 dark:border-emerald-800 bg-white/85 dark:bg-slate-900/70 p-3"><div class="text-sm font-semibold opacity-70">${safeVar(i)}</div><div class="mt-1 text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight break-all">${formatNumber(v)}</div></div>`).join('')}</div><p class="text-sm opacity-75 mt-3">Se encontró un único valor para cada incógnita.</p>`
        : result.status === 'infinite'
          ? `<div class="text-xl sm:text-2xl font-bold">${result.freeCols.length} variable(s) libre(s)</div><p class="text-sm opacity-75 mt-1">${result.parametricText}</p>`
          : `<div class="text-xl sm:text-2xl font-bold">No existe un vector solución</div><p class="text-sm opacity-75 mt-1">Las ecuaciones son incompatibles entre sí.</p>`;
      const metric = (label, value) => `<div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3"><div class="text-[10px] uppercase tracking-wider font-bold text-slate-500">${label}</div><div class="text-lg font-bold font-mono mt-1 text-slate-900 dark:text-slate-100">${value}</div></div>`;
      const html = `<section class="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2"><span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"><i data-lucide="${icon}" class="w-5 h-5 ${statusClasses[statusColor].icon}"></i></span><div><div class="text-[11px] uppercase tracking-widest font-bold text-slate-500">MatrizSolve · análisis del sistema</div><h3 class="font-bold text-base text-slate-900 dark:text-white">Resultado matemático</h3></div></div>
            <span class="px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-wider ${statusClasses[statusColor].badge}">${statusLabel}</span>
          </div>
        </div>
        <div class="p-4 sm:p-5 space-y-4">
          <div class="rounded-xl border p-4 ${statusClasses[statusColor].panel}">${heroResult}</div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${metric('Rango de A', result.rankA)}${metric('Rango de [A|b]', result.rankAug)}${metric('Incógnitas', cols)}</div>
          <details class="group rounded-xl border border-slate-200 dark:border-slate-700">
            <summary class="cursor-pointer list-none flex items-center justify-between gap-3 p-4 font-semibold text-sm text-slate-800 dark:text-slate-100"><span class="flex items-center gap-2"><i data-lucide="book-open-check" class="w-4 h-4 text-indigo-500"></i> Ver explicación, comprobaciones y criterio matemático</span><i data-lucide="chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180"></i></summary>
            <div class="p-4 pt-0 text-sm leading-relaxed space-y-3 text-slate-700 dark:text-slate-200">${body}<div class="rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3"><strong>Conclusión:</strong> ${conclusion}</div><p class="text-[11px] text-slate-500">Cálculo numérico con tolerancia para controlar errores de redondeo. Los decimales no representan fracciones exactas salvo que se indique expresamente.</p></div>
          </details>
        </div>
      </section>`;
      container.insertAdjacentHTML('beforeend', html);
      window.lucide?.createIcons?.();
      renderMathJax();
    }
