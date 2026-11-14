// MatrizSolve — módulo separado del archivo original.
// Se carga como script clásico para conservar compatibilidad con los onclick del HTML.

    function switchMainTab(tabName) {
      const tabs = ['editor', 'steps', 'sarrus'];
      tabs.forEach(t => {
        const btn = document.getElementById(`nav-${t}`);
        const sec = document.getElementById(`section-${t}`);
        if (t === tabName) {
          if (sec) sec.classList.remove('hidden');
          if (btn) {
            btn.className = 'py-3 px-2 border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold flex items-center gap-2 whitespace-nowrap';
          }
        } else {
          if (sec) sec.classList.add('hidden');
          if (btn) {
            btn.className = 'py-3 px-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 whitespace-nowrap';
          }
        }
      });
      renderMathJax();
    }

    function openPresetsModal() {
      const modal = document.getElementById('presets-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closePresetsModal() {
      const modal = document.getElementById('presets-modal');
      if (modal) modal.classList.add('hidden');
    }

    function loadPreset(idx) {
      if (idx === 0) {
        rows = 3; cols = 3;
        matrixA = [[2, 1, 0], [1, 3, 2], [0, 1, 4]];
        vectorB = [100, 250, 180];
      } else if (idx === 1) {
        rows = 3; cols = 3;
        matrixA = [[10, -5, 0], [-5, 15, -5], [0, -5, 10]];
        vectorB = [12, 0, 6];
      } else if (idx === 2) {
        // Modelo didáctico: tres productos y tres recursos/turnos de máquina.
        rows = 3; cols = 3;
        matrixA = [[2, 1, 1], [1, 2, 1], [1, 1, 2]];
        vectorB = [95, 105, 100];
      }
      const caseCard = document.getElementById('case-context-card');
      if (caseCard) {
        caseCard.classList.remove('hidden');
        const contexts = [
          {title:'Balance de mezclas · modelo didáctico', description:'Se representan cantidades de tres componentes mediante balances lineales. Antes de usarlo como evidencia empírica, sustituye los coeficientes y totales por mediciones documentadas de un proceso real.', equations:'2a + b = 100;  a + 3b + 2c = 250;  b + 4c = 180', note:'Caso ilustrativo: los valores son de demostración, no datos de una empresa.'},
          {title:'Circuito eléctrico · leyes de Kirchhoff', description:'Las incógnitas representan corrientes de malla. Las ecuaciones modelan balances de tensión; los coeficientes corresponden a resistencias y acoplamientos del circuito.', equations:'10i₁ − 5i₂ = 12;  −5i₁ + 15i₂ − 5i₃ = 0;  −5i₂ + 10i₃ = 6', note:'Caso ilustrativo: verificar unidades y diagrama eléctrico antes de presentarlo como montaje real.'},
          {title:'Plan de producción · Ingeniería Industrial', description:'Un taller fabrica tres productos (P1, P2 y P3). Cada columna indica horas consumidas por unidad en tres centros de máquina. Las cantidades a producir se calculan para cumplir las disponibilidades de 100, 120 y 110 horas.', equations:'2P1 + P2 + P3 = 95;  P1 + 2P2 + P3 = 105;  P1 + P2 + 2P3 = 100', note:'Datos simulados para demostrar el modelado. Para afirmar que es un caso real, reemplázalos por registros verificables de una empresa o laboratorio.'}
        ];
        const c = contexts[idx] || contexts[0];
        document.getElementById('case-context-title').textContent = c.title;
        document.getElementById('case-context-description').textContent = c.description;
        document.getElementById('case-context-equations').textContent = c.equations;
        document.getElementById('case-context-note').textContent = c.note;
      }
      document.getElementById('method-comparison-output')?.classList.add('hidden');
      currentAIProblemContext = null;
      document.getElementById('ai-nlp-explanation')?.classList.add('hidden');
      document.getElementById('dim-rows-display').innerText = rows;
      document.getElementById('dim-cols-display').innerText = cols;
      renderMatrixInputs();
      closePresetsModal();
      executeSolver();
      showToast('Caso práctico cargado correctamente');
    }
    function matrixToLatex(mat, bVec = null) {
      if (!mat || mat.length === 0) return '';
      let rowsTex = mat.map((row, rIdx) => {
        let rowStr = row.map(v => formatNumber(v)).join(' & ');
        if (bVec && bVec[rIdx] !== undefined) {
          rowStr += ` & ${formatNumber(bVec[rIdx])}`;
        }
        return rowStr;
      }).join(' \\\\ ');

      if (bVec) {
        let colSpec = 'c'.repeat(mat[0].length) + '|c';
        return `\\left[\\begin{array}{${colSpec}} ${rowsTex} \\end{array}\\right]`;
      }
      return `\\begin{bmatrix} ${rowsTex} \\end{bmatrix}`;
    }

    function matrixPairToLatex(left, right) {
      if (!left?.length || !right?.length || left.length !== right.length) return '';
      const rowsTex = left.map((row, index) => [...row, ...right[index]].map(formatNumber).join(' & ')).join(' \\\\ ');
      const colSpec = 'c'.repeat(left[0].length) + '|' + 'c'.repeat(right[0].length);
      return `\\left[\\begin{array}{${colSpec}} ${rowsTex} \\end{array}\\right]`;
    }

    function inverseVerificationHtml(A, inverse) {
      const product = multiplyMatrices(A, inverse);
      let maxResidual = 0;
      for (let row = 0; row < product.length; row++) {
        for (let col = 0; col < product[row].length; col++) {
          maxResidual = Math.max(maxResidual, Math.abs(product[row][col] - (row === col ? 1 : 0)));
        }
      }
      const verified = maxResidual <= 1e-8;
      return `<p class="text-xs ${verified ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}">Comprobación $A A^{-1}=I$: ${verified ? 'correcta' : 'hay una discrepancia'} (residuo máximo ${formatNumber(maxResidual)}).</p>`;
    }

    function inverseProductResultHtml(inverse, vector) {
      const x = multiplyMatrixVector(inverse, vector);
      const canonical = solveCurrentSystem();
      const matches = canonical.status === 'unique' && x.every((value, index) => Math.abs(value - canonical.solution[index]) <= 1e-8 * Math.max(1, Math.abs(canonical.solution[index])));
      const css = matches ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300';
      const status = matches ? 'La multiplicación coincide con la solución del sistema.' : 'El resultado de la inversa no coincide con la solución verificada del sistema.';
      const products = showDetailedArithmetic ? `<details open class="mt-2 text-[11px]"><summary class="cursor-pointer font-semibold">Ver productos fila por columna</summary><div class="pt-1 space-y-1">${inverse.map((row, index) => `x_${index + 1} = ${row.map((value, col) => `(${formatNumber(value)} × ${formatNumber(vector[col])})`).join(' + ')} = ${formatNumber(x[index])}`).join('<br>')}</div></details>` : '';
      return `<div class="pt-3 border-t border-emerald-200 dark:border-emerald-800"><div class="font-bold text-xs">Solución por inversa: $X=A^{-1}B$</div><div class="overflow-x-auto text-center font-mono">$X=${matrixToLatex(x.map(value => [value]))}$</div><p class="text-xs ${css}">${status}</p>${products}</div>`;
    }

    function updateSystemDiagnostics() {
      const A = sanitizeMatrix(matrixA);
      const b = sanitizeVector(vectorB);
      const isSquare = rows === cols;
      const result = solveCurrentSystem();
      const detA = isSquare ? (result.rankA < cols ? 0 : computeDeterminant(A)) : null;
      const setText = (id, text) => { const element = document.getElementById(id); if (element) element.textContent = text; };
      setText('diag-dim', `${rows} x ${cols}`);
      setText('diag-det', isSquare ? formatNumber(detA) : 'N/A (no cuadrada)');
      setText('diag-rank-a', result.rankA);
      setText('diag-rank-aug', result.rankAug);
      const badge = document.getElementById('system-status-badge');
      const summary = document.getElementById('solution-summary-box');
      const output = document.getElementById('solution-vector-output');
      const aiBox = document.getElementById('ai-results-explanation-box');
      const aiText = document.getElementById('ai-results-explanation-text');
      if (badge) {
        const states = {
          unique: ['SCD: solución única', 'px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'],
          infinite: ['SCI: infinitas soluciones', 'px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'],
          none: ['SI: sin solución', 'px-2.5 py-1 text-[11px] font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300']
        };
        [badge.textContent, badge.className] = states[result.status];
      }
      summary?.classList.remove('hidden');
      if (output) {
        const variableNames = getSystemVariableNames();
        if (result.status === 'unique') {
          output.innerHTML = `$X = \\begin{bmatrix} ${result.solution.map(formatNumber).join(' \\\\ ')} \\end{bmatrix} \\quad \\Rightarrow \\quad ${result.solution.map((value, index) => `${variableNames[index]}=${formatNumber(value)}`).join(', \\quad ') }$`;
        } else if (result.status === 'infinite') {
          output.innerHTML = `Infinitas soluciones: $${result.parametricText}$`;
        } else {
          output.textContent = 'Sistema incompatible (rango de A distinto del rango de [A|B]); no existe solución.';
        }
      }
      if (currentAIProblemContext && currentAIProblemContext.parsed && result.status === 'unique') {
        aiBox?.classList.remove('hidden');
        const labels = currentAIProblemContext.parsed.variables;
        if (aiText) aiText.innerHTML = `<strong>Solución calculada:</strong><br>${result.solution.map((value, index) => `• <strong>$${getSystemVariableNames()[index]} = ${formatNumber(value)}$</strong>: ${escapeHTML(labels[index] || `Variable ${getSystemVariableNames()[index]}`)}`).join('<br>')}<br><br>${escapeHTML(currentAIProblemContext.parsed.stepByStepExplanation)}`;
      } else aiBox?.classList.add('hidden');
      renderMathJax();
    }
    function compareMethods() {
      const host = document.getElementById('method-comparison-output');
      if (!host) return;
      const A = sanitizeMatrix(matrixA), b = sanitizeVector(vectorB);
      const canonical = solveCurrentSystem();
      const names = [
        ['Gauss', 'gauss'], ['Gauss-Jordan', 'gauss-jordan'],
        ['Cramer', 'cramer'], ['Matriz inversa', 'inverse']
      ];
      const square = A.length === A[0].length;
      const applicableDet = square && canonical.status === 'unique';
      const runs = 25;
      const fmtMs = n => n < 0.01 ? '<0,01' : n.toFixed(3).replace('.', ',');
      const results = names.map(([label, key]) => {
        const applicable = (key === 'gauss' || key === 'gauss-jordan') || applicableDet;
        if (!applicable) return {label, applicable:false, reason: key === 'cramer' || key === 'inverse' ? 'Requiere A cuadrada e invertible y solución única.' : 'No aplicable a esta entrada.'};
        if (canonical.status !== 'unique') return {label, applicable:true, classification: canonical.status === 'infinite' ? 'Compatible indeterminado' : 'Incompatible', verified:true, time:null};
        const solve = () => {
          const n=A.length, aug=A.map((r,i)=>[...r,b[i]]);
          if (key === 'gauss') {
            const rr=rowReduce(aug,n,false); const M=rr.matrix; const x=Array(n).fill(0);
            for(let r=n-1;r>=0;r--){ const pc=rr.pivotCols[r]; if(pc===undefined) continue; let v=M[r][n]; for(let c=pc+1;c<n;c++) v-=M[r][c]*x[c]; x[pc]=v/M[r][pc]; }
            return x;
          }
          if (key === 'gauss-jordan') {
            const rr=rowReduce(aug,n,true); return Array.from({length:n},(_,i)=>rr.matrix.find(row=>Math.abs(row[i]-1)<1e-8 && row.slice(0,n).filter(v=>Math.abs(v)>1e-8).length===1)?.[n] ?? NaN);
          }
          if (key === 'cramer') {
            const d=computeDeterminant(A); return A.map((_,c)=>computeDeterminant(A.map((r,i)=>r.map((v,j)=>j===c?b[i]:v)))/d);
          }
          const I=A.map((r,i)=>r.map((_,j)=>i===j?1:0));
          const rr=rowReduce(A.map((r,i)=>[...r,...I[i]]),n,true); const inv=rr.matrix.map(r=>r.slice(n));
          return inv.map(row=>row.reduce((sum,v,j)=>sum+v*b[j],0));
        };
        try {
          solve(); const start=performance.now(); let x;
          for(let k=0;k<runs;k++) x=solve();
          const elapsed=(performance.now()-start)/runs;
          const maxResidual=Math.max(...A.map((r,i)=>Math.abs(r.reduce((sum,v,j)=>sum+v*x[j],0)-b[i])));
          const error=Math.max(...x.map((v,i)=>Math.abs(v-canonical.solution[i])));
          const ok=Number.isFinite(error) && error<1e-7 && maxResidual<1e-7;
          return {label,applicable:true,verified:ok,time:elapsed,residual:maxResidual,error};
        } catch(e) { return {label,applicable:true,verified:false,reason:'No fue posible completar el cálculo.'}; }
      });
      const rowsHtml=results.map(r=>`<tr class="border-t border-slate-200 dark:border-slate-700"><td class="px-2 py-2 font-semibold">${r.label}</td><td class="px-2 py-2">${!r.applicable?'No aplicable':(r.classification|| (r.verified?'Verificado':'Revisar'))}</td><td class="px-2 py-2 font-mono">${r.time===null||r.time===undefined?'—':fmtMs(r.time)+' ms'}</td><td class="px-2 py-2 font-mono">${r.residual===undefined?'—':r.residual.toExponential(2)}</td></tr>`).join('');
      host.innerHTML=`<div class="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"><div class="p-3 bg-slate-50 dark:bg-slate-800"><div class="font-bold text-xs">Comparación de métodos</div><p class="text-[10px] text-slate-500 mt-1">${canonical.status==='unique'?'Mismo sistema y misma solución de referencia.':'Para este tipo de sistema, Cramer e inversa requieren una matriz cuadrada invertible; Gauss y Gauss-Jordan clasifican el sistema.'} Tiempos promedio de ${runs} ejecuciones locales, solo orientativos.</p></div><div class="overflow-x-auto"><table class="w-full text-[11px] text-left"><thead class="bg-slate-100 dark:bg-slate-800"><tr><th class="px-2 py-2">Método</th><th class="px-2 py-2">Aplicabilidad / validación</th><th class="px-2 py-2">Tiempo</th><th class="px-2 py-2">Residuo máx.</th></tr></thead><tbody>${rowsHtml}</tbody></table></div><div class="p-3 text-[10px] text-slate-500">La medición en milisegundos depende del navegador, procesador, carga del equipo y tamaño de la matriz; no debe interpretarse como benchmark universal.</div></div>`;
      host.classList.remove('hidden');
      window.lucide?.createIcons?.();
    }

    async function copySolutionLatex() {
      const container = document.getElementById('steps-container');
      if (!container) return;
      const textToCopy = container.innerText;
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(textToCopy);
        else {
          const tempArea = document.createElement('textarea');
          tempArea.value = textToCopy;
          tempArea.style.position = 'fixed';
          tempArea.style.opacity = '0';
          document.body.appendChild(tempArea);
          tempArea.select();
          const copied = document.execCommand('copy');
          document.body.removeChild(tempArea);
          if (!copied) throw new Error('No se pudo acceder al portapapeles');
        }
        showToast('Procedimiento copiado al portapapeles');
      } catch (error) {
        showToast('No fue posible copiar; selecciona el procedimiento y usa Ctrl+C');
      }
    }
  
