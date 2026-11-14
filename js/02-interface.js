// MatrizSolve — módulo separado del archivo original.
// Se carga como script clásico para conservar compatibilidad con los onclick del HTML.

    function switchInputTab(tabName) {
      const viewInteractive = document.getElementById('view-interactive');
      const viewText = document.getElementById('view-text');
      const tabInteractive = document.getElementById('tab-interactive');
      const tabText = document.getElementById('tab-text');

      if (tabName === 'interactive') {
        viewInteractive.classList.remove('hidden');
        viewText.classList.add('hidden');
        tabInteractive.className = 'flex-1 py-2 rounded-lg text-center transition shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold';
        tabText.className = 'flex-1 py-2 rounded-lg text-center transition text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200';
      } else {
        viewInteractive.classList.add('hidden');
        viewText.classList.remove('hidden');
        tabText.className = 'flex-1 py-2 rounded-lg text-center transition shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold';
        tabInteractive.className = 'flex-1 py-2 rounded-lg text-center transition text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200';
      }
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toast-msg');
      if (toast && toastMsg) {
        toastMsg.innerText = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
          toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
      }
    }

    function renderMathJax() {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(err => console.error(err));
      }
    }

    window.onload = () => {
      window.lucide?.createIcons?.();
      renderMatrixInputs();
      executeSolver('gauss-jordan', false);
    };

    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
    }

    function toggleDetailedArithmetic() {
      showDetailedArithmetic = !showDetailedArithmetic;
      const btnLabel = document.getElementById('label-detailed-toggle');
      if (btnLabel) {
        btnLabel.innerText = showDetailedArithmetic ? 'Desglose Aritmético: ON' : 'Desglose Aritmético: OFF';
      }
      showToast(showDetailedArithmetic ? 'Desglose activado. Abre «Ver cálculo» en los pasos que quieras revisar.' : 'Desglose aritmético desactivado');
      executeSolver();
    }

    function jumpToExerciseExplanation() {
      switchMainTab('steps');
      const container = document.getElementById('steps-container');
      
      // Inject or highlight the AI explanation banner at the top of the step-by-step section
      let aiBanner = document.getElementById('step-ai-explanation-banner');
      if (!aiBanner && currentAIProblemContext && currentAIProblemContext.parsed) {
        aiBanner = document.createElement('div');
        aiBanner.id = 'step-ai-explanation-banner';
        aiBanner.className = 'p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border-2 border-indigo-500/80 shadow-md space-y-2 mb-4 animate-bounce-once';
        
        let varsHtml = currentAIProblemContext.parsed.variables.map((v, i) => `• <strong>$x_${i+1}$</strong>: ${escapeHTML(v)}`).join('<br>');
        let eqHtml = currentAIProblemContext.parsed.equationsText.map((eq, i) => `• Ecuación ${i+1}: $${escapeHTML(eq)}$`).join('<br>');

        aiBanner.innerHTML = `
          <div class="font-bold text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <i data-lucide="bot" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
            Explicación del planteamiento
          </div>
          <div class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
            <div class="bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <strong>Definición de Variables:</strong><br>${varsHtml}
            </div>
            <div class="bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <strong>Ecuaciones Formuladas:</strong><br>${eqHtml}
            </div>
            <div class="p-3 bg-white/90 dark:bg-slate-900/90 rounded-lg border border-indigo-300 dark:border-indigo-700 font-sans">
              <strong>Razonamiento Paso a Paso:</strong><br>
              <span class="text-slate-600 dark:text-slate-300">${escapeHTML(currentAIProblemContext.parsed.stepByStepExplanation)}</span>
            </div>
          </div>
        `;
        if (container) container.prepend(aiBanner);
        window.lucide?.createIcons?.();
        renderMathJax();
      }

      if (aiBanner) {
        aiBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
        aiBanner.classList.add('ring-4', 'ring-indigo-400');
        setTimeout(() => aiBanner.classList.remove('ring-4', 'ring-indigo-400'), 2000);
      } else if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
      
      showToast('Navegado al ejercicio con la explicación del tutor de álgebra');
    }
