// MatrizSolve — módulo separado del archivo original.
// Se carga como script clásico para conservar compatibilidad con los onclick del HTML.

    let rows = 3;
    let cols = 3;
    let matrixA = [
      [2, 1, -1],
      [-3, -1, 2],
      [-2, 1, 2]
    ];
    let vectorB = [8, -11, -3];
    let useFractions = true;
    let showDetailedArithmetic = false;
    let currentMethod = 'gauss-jordan';
    let currentAIProblemContext = null;

    // --- MAIN SOLVER DISPATCHER & CORE UTILITIES ---
    function executeSolver(method, navigateToSteps = Boolean(method)) {
      if (method) currentMethod = method;
      
      // Update System Diagnostics (Determinant, Ranks, Status)
      updateSystemDiagnostics();

      // Render step-by-step breakdown based on selected method
      if (currentMethod === 'gauss') {
        runGaussSteps();
      } else if (currentMethod === 'gauss-jordan') {
        runGaussJordanSteps();
      } else if (currentMethod === 'cramer') {
        runCramerSteps();
      } else if (currentMethod === 'inverse') {
        runInverseGaussJordanSteps();
      } else if (currentMethod === 'inverse-sarrus') {
        runInverseSarrusAdjointSteps();
      }

      // Generate Sarrus view if dimension is 3x3
      generateSarrusBreakdown();
      appendSystemConclusion();

      // Cambiar automáticamente a la pestaña de "Resolución Paso a Paso" al hacer clic en un método
      if (navigateToSteps) {
        switchMainTab('steps');
        const stepsContainer = document.getElementById('steps-container');
        if (stepsContainer) {
          stepsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      renderMathJax();
    }
