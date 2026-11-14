// MatrizSolve — módulo separado del archivo original.
// Se carga como script clásico para conservar compatibilidad con los onclick del HTML.

    function changeDimensions(dRows, dCols) {
      const newRows = Math.max(1, Math.min(5, rows + dRows));
      const newCols = Math.max(1, Math.min(5, cols + dCols));
      
      if (newRows === rows && newCols === cols) return;
      
      let newA = Array.from({ length: newRows }, (_, r) => 
        Array.from({ length: newCols }, (_, c) => (matrixA[r] && matrixA[r][c] !== undefined) ? matrixA[r][c] : (r === c ? 1 : 0))
      );
      let newB = Array.from({ length: newRows }, (_, r) => (vectorB[r] !== undefined ? vectorB[r] : 1));

      currentAIProblemContext = null;
      document.getElementById('ai-nlp-explanation')?.classList.add('hidden');
      rows = newRows;
      cols = newCols;
      matrixA = newA;
      vectorB = newB;

      document.getElementById('dim-rows-display').innerText = rows;
      document.getElementById('dim-cols-display').innerText = cols;
      document.getElementById('diag-dim').innerText = `${rows} x ${cols}`;

      renderMatrixInputs();
      executeSolver();
    }

    function renderMatrixInputs() {
      const gridA = document.getElementById('grid-matrix-a');
      const gridB = document.getElementById('grid-vector-b');
      
      gridA.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      gridA.innerHTML = '';
      gridB.innerHTML = '';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = formatNumber(matrixA[r][c]);
          input.className = 'w-12 h-10 text-center font-mono text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none';
          input.onchange = (e) => {
            const value = parseFractionOrDecimal(e.target.value);
            if (!Number.isFinite(value)) { showToast('Usa un número, decimal o fracción válida (por ejemplo, 3/4)'); e.target.value = formatNumber(matrixA[r][c]); return; }
            matrixA[r][c] = value;
            currentAIProblemContext = null;
            document.getElementById('ai-nlp-explanation')?.classList.add('hidden');
            executeSolver();
          };
          gridA.appendChild(input);
        }

        const inputB = document.createElement('input');
        inputB.type = 'text';
        inputB.value = formatNumber(vectorB[r]);
        inputB.className = 'w-12 h-10 text-center font-mono text-xs border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none';
        inputB.onchange = (e) => {
          const value = parseFractionOrDecimal(e.target.value);
          if (!Number.isFinite(value)) { showToast('Usa un número, decimal o fracción válida (por ejemplo, 3/4)'); e.target.value = formatNumber(vectorB[r]); return; }
          vectorB[r] = value;
          currentAIProblemContext = null;
          document.getElementById('ai-nlp-explanation')?.classList.add('hidden');
          executeSolver();
        };
        gridB.appendChild(inputB);
      }
    }

    function loadSpecialMatrix(type) {
      currentAIProblemContext = null;
      document.getElementById('ai-nlp-explanation')?.classList.add('hidden');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (type === 'identity') matrixA[r][c] = (r === c) ? 1 : 0;
          else if (type === 'diagonal') matrixA[r][c] = (r === c) ? (r + 1) * 2 : 0;
          else if (type === 'triangular') matrixA[r][c] = (r <= c) ? (r + c + 1) : 0;
        }
      }
      renderMatrixInputs();
      executeSolver();
      showToast(`Plantilla "${type.toUpperCase()}" cargada`);
    }

    function fillRandomMatrix() {
      currentAIProblemContext = null;
      document.getElementById('ai-nlp-explanation')?.classList.add('hidden');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          matrixA[r][c] = Math.floor(Math.random() * 19) - 9;
        }
        vectorB[r] = Math.floor(Math.random() * 19) - 9;
      }
      renderMatrixInputs();
      executeSolver();
    }

    function clearMatrixValues() {
      currentAIProblemContext = null;
      document.getElementById('ai-nlp-explanation')?.classList.add('hidden');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) matrixA[r][c] = 0;
        vectorB[r] = 0;
      }
      renderMatrixInputs();
      executeSolver();
    }

    function renderParsedProblem(text, showExplanation) {
      const lines = text.split(/[\n;]+/).map(line => line.trim()).filter(Boolean);
      const equations = lines.map(parseLinearEquation);
      if (!lines.length || equations.some(eq => !eq)) {
        showToast('No encontré ecuaciones válidas. Usa una por línea, por ejemplo: 2x + y = 5');
        return false;
      }
      const variables = [];
      const keys = new Set();
      equations.forEach(eq => eq.names.forEach(item => { if (!keys.has(item.key)) { keys.add(item.key); variables.push(item); } }));
      if (!variables.length) { showToast('Incluye al menos una variable, como x o x1'); return false; }
      if (variables.length > 5 || equations.length > 5) { showToast('El editor admite hasta 5 ecuaciones y 5 variables'); return false; }
      rows = equations.length;
      cols = variables.length;
      matrixA = equations.map(eq => variables.map(item => eq.coefficients.get(item.key) || 0));
      vectorB = equations.map(eq => eq.rhs);
      currentAIProblemContext = {
        text,
        parsed: {
          variables: variables.map(item => `${item.name}: variable del sistema`),
          variableNames: variables.map(item => item.name),
          equationsText: equations.map((eq, i) => `${matrixA[i].map((value, j) => `${formatNumber(value)} ${variables[j].name}`).filter((_, j) => Math.abs(matrixA[i][j]) > 1e-10).join(' + ').replace(/\+ -/g, '- ')} = ${formatNumber(vectorB[i])}`),
          stepByStepExplanation: 'Se identificaron las variables y se organizó cada ecuación en una fila de la matriz de coeficientes. Los términos constantes del lado izquierdo se pasaron al lado derecho. El análisis de rangos y la solución se calculan con eliminación por filas.'
        }
      };
      document.getElementById('dim-rows-display').innerText = rows;
      document.getElementById('dim-cols-display').innerText = cols;
      renderMatrixInputs();
      const parsed = currentAIProblemContext.parsed;
      document.getElementById('ai-nlp-variables').innerHTML = '<strong>Variables identificadas:</strong><br>' + parsed.variables.map((v, i) => `• $${escapeHTML(variables[i].name)}$: ${escapeHTML(v)}`).join('<br>');
      document.getElementById('ai-nlp-equations').innerHTML = '<strong>Ecuaciones organizadas:</strong><br>' + parsed.equationsText.map((eq, i) => `• Ecuación ${i + 1}: ${escapeHTML(eq)}`).join('<br>');
      document.getElementById('ai-explanation-text').textContent = parsed.stepByStepExplanation;
      document.getElementById('ai-chat-history').innerHTML = '';
      document.getElementById('ai-nlp-explanation').classList.remove('hidden');
      executeSolver();
      renderMathJax();
      showToast('Sistema convertido en matriz y resuelto');
      return true;
    }
