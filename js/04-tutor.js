// MatrizSolve — módulo separado del archivo original.
// Se carga como script clásico para conservar compatibilidad con los onclick del HTML.

    function parseTextInput() {
      const text = document.getElementById('text-input-area').value.trim();
      if (!text) { showToast('Escribe las ecuaciones antes de procesar'); return; }
      renderParsedProblem(text, true);
    }
    async function parseTextInputWithAI() {
      const text = document.getElementById('text-input-area').value.trim();
      if (!text) { showToast('Escribe las ecuaciones antes de procesar'); return; }
      const button = document.getElementById('btn-parse-ai');
      button.disabled = true;
      button.textContent = 'Analizando sistema…';
      try { renderParsedProblem(text, true); }
      finally { button.disabled = false; button.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4"></i> Interpretar ecuaciones'; window.lucide?.createIcons?.(); }
    }
    function cleanLatexEquation(eqStr) {
      if (!eqStr) return '';
      // Replace '*' with space or \cdot
      let cleaned = eqStr.replace(/\*/g, ' ');
      // Fix variables x1 -> x_1
      cleaned = cleaned.replace(/x(\d)/g, 'x_$1');
      // Wrap parenthetical text like (Inversión total) into \text{(Inversión total)} if not already
      cleaned = cleaned.replace(/\(([^)]+)\)/g, (match, p1) => {
        if (p1.includes('text{')) return match;
        return `\\quad \\text{(${p1})}`;
      });
      return cleaned;
    }

    function cleanExplanationText(textStr) {
      if (!textStr) return '';
      // Replace concatenated numbers and text like 2250000paramadera or 2,250,000paramadera
      let cleaned = textStr.replace(/([\d,]+)([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/g, '$1 $2');
      // Fix missing space between math dollars and adjacent words
      cleaned = cleaned.replace(/\$([^\$]+)\$([a-zA-ZáéíóúÁÉÍÓÚñÑ])/g, '$$1$ $2');
      cleaned = cleaned.replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ])\$([^\$]+)\$/g, '$1 $$2$');
      return cleaned;
    }

    function localTutorAnswer(question) {
      const q = question.toLowerCase();
      const result = solveCurrentSystem();
      if (/determinante|\bdet\b/.test(q)) {
        return rows === cols ? `El determinante de A es ${formatNumber(computeDeterminant(sanitizeMatrix(matrixA)))}. Si es distinto de cero, el sistema cuadrado tiene solución única; si es cero, se revisan los rangos para distinguir entre infinitas soluciones y ninguna solución.` : 'El determinante solo se define para matrices cuadradas. En este sistema puedes usar los rangos de A y de la matriz aumentada para clasificar las soluciones.';
      }
      if (/rango|rouche|rango\(a\)/.test(q)) return `Rango de A: ${result.rankA}. Rango de la matriz aumentada: ${result.rankAug}. ${result.statusText}`;
      if (/inversa|invertible|singular/.test(q)) return rows !== cols ? 'La matriz no es cuadrada, así que no tiene inversa.' : Math.abs(computeDeterminant(sanitizeMatrix(matrixA))) < 1e-10 ? 'A es singular porque su determinante es cero; no tiene inversa.' : 'A es invertible porque su determinante es distinto de cero.';
      if (/gauss|paso|procedimiento|método/.test(q)) return 'Gauss usa pivotes para crear ceros debajo de cada pivote y luego despeja las variables. Gauss-Jordan también elimina los valores por encima y normaliza los pivotes para llegar a la forma escalonada reducida.';
      if (/variable|libre|parámetr/.test(q)) return result.status === 'infinite' ? `Hay ${cols - result.rankA} variable(s) libre(s). ${result.parametricText}` : result.status === 'unique' ? 'No hay variables libres: cada variable queda determinada por el sistema.' : 'El sistema es incompatible, así que no existe un conjunto de valores que satisfaga todas las ecuaciones.';
      if (/resultado|soluci|valor|cuánto|cuanto/.test(q)) return result.status === 'unique' ? `La solución única es ${result.solution.map((value, i) => `x${i + 1} = ${formatNumber(value)}`).join(', ')}. Puedes verificarla sustituyendo estos valores en las ecuaciones originales.` : result.status === 'infinite' ? `El sistema tiene infinitas soluciones. ${result.parametricText}` : 'El sistema no tiene solución porque las ecuaciones son incompatibles.';
      return `El sistema tiene ${rows} ecuación(es) y ${cols} variable(s). ${result.statusText} Pregunta por el rango, el determinante, las variables libres o el procedimiento de Gauss.`;
    }

    function askAIFollowUpQuestion() {
      const input = document.getElementById('ai-chat-input');
      const question = input.value.trim();
      if (!question) return;
      const history = document.getElementById('ai-chat-history');
      const userMessage = document.createElement('div');
      userMessage.className = 'p-2 bg-indigo-100 dark:bg-indigo-900/60 rounded-lg text-indigo-950 dark:text-indigo-100 font-medium';
      userMessage.textContent = `Tú: ${question}`;
      const answer = document.createElement('div');
      answer.className = 'p-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-slate-700 dark:text-slate-200 leading-relaxed';
      answer.textContent = `Tutor: ${localTutorAnswer(question)}`;
      history.append(userMessage, answer);
      input.value = '';
      history.scrollTop = history.scrollHeight;
      renderMathJax();
    }
