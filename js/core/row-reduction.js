// MatrizSolve — núcleo matemático (sin DOM). Script clásico: funciones globales.

function rowReduce(input, pivotLimit = null, reduced = true) {
  const matrix = input.map(row => row.map(value => Number(value)));
  if (!matrix.length) return { matrix, pivotCols: [], steps: [] };
  const limit = pivotLimit === null ? matrix[0].length : pivotLimit;
  const pivotCols = [];
  const steps = [];
  const coefficientScale = Math.max(0, ...matrix.flatMap(row => row.slice(0, limit).map(Math.abs)));
  const rhsScale = Math.max(0, ...matrix.flatMap(row => row.slice(limit).map(Math.abs)));
  const pivotTolerance = coefficientScale * 1e-12;
  const rhsTolerance = Math.max(rhsScale * 1e-12, Number.EPSILON * Math.max(coefficientScale, rhsScale) * 16);
  let pivotRow = 0;
  for (let col = 0; col < limit && pivotRow < matrix.length; col++) {
    let bestRow = pivotRow;
    for (let candidate = pivotRow + 1; candidate < matrix.length; candidate++) {
      if (Math.abs(matrix[candidate][col]) > Math.abs(matrix[bestRow][col])) bestRow = candidate;
    }
    if (Math.abs(matrix[bestRow][col]) <= pivotTolerance) continue;
    if (bestRow !== pivotRow) {
      [matrix[pivotRow], matrix[bestRow]] = [matrix[bestRow], matrix[pivotRow]];
      steps.push({ type: 'swap', row: pivotRow, other: bestRow, col, matrix: matrix.map(row => [...row]) });
    }
    const pivot = matrix[pivotRow][col];
    if (reduced) {
      const before = [...matrix[pivotRow]];
      for (let j = 0; j < matrix[pivotRow].length; j++) matrix[pivotRow][j] /= pivot;
      steps.push({ type: 'normalize', row: pivotRow, pivot, before, col, matrix: matrix.map(row => [...row]) });
    }
    const targets = reduced ? matrix.map((_, index) => index).filter(index => index !== pivotRow) : matrix.map((_, index) => index).filter(index => index > pivotRow);
    for (const target of targets) {
      const factor = reduced ? matrix[target][col] : matrix[target][col] / matrix[pivotRow][col];
      if (factor === 0) continue;
      const before = [...matrix[target]];
      for (let j = 0; j < matrix[target].length; j++) {
        matrix[target][j] -= factor * matrix[pivotRow][j];
        const cleanupTolerance = j < limit ? pivotTolerance : rhsTolerance;
        if (Math.abs(matrix[target][j]) <= cleanupTolerance) matrix[target][j] = 0;
      }
      matrix[target][col] = 0;
      steps.push({ type: 'eliminate', row: target, pivotRow, factor, col, before, pivotValues: [...matrix[pivotRow]], matrix: matrix.map(row => [...row]) });
    }
    pivotCols.push(col);
    pivotRow++;
  }
  return { matrix, pivotCols, steps, pivotTolerance, rhsTolerance };
}

// Resuelve A·x = b sin tocar el estado global ni el DOM.
function solveSystem(A, b, variableNames) {
  const cols = A[0].length;
  const augmented = A.map((row, index) => [...row, b[index]]);
  const reduced = rowReduce(augmented, cols, true);
  const rankA = reduced.pivotCols.length;
  const inconsistent = reduced.matrix.some(row => row.slice(0, cols).every(value => Math.abs(value) <= reduced.pivotTolerance) && Math.abs(row[cols]) > reduced.rhsTolerance);
  const rankAug = rankA + (inconsistent ? 1 : 0);
  if (inconsistent) return { status: 'none', statusText: 'No existe solución: el sistema es incompatible.', rankA, rankAug, reduced };
  if (rankA === cols) {
    const solution = new Array(cols).fill(0);
    reduced.pivotCols.forEach((pivotCol, row) => { solution[pivotCol] = reduced.matrix[row][cols]; });
    return { status: 'unique', statusText: 'El sistema tiene solución única.', rankA, rankAug, solution, reduced };
  }
  const freeCols = Array.from({ length: cols }, (_, index) => index).filter(index => !reduced.pivotCols.includes(index));
  const expressions = Array.from({ length: cols }, (_, col) => {
    if (freeCols.includes(col)) return `${variableNames[col]} = t_{${freeCols.indexOf(col) + 1}}`;
    const row = reduced.pivotCols.indexOf(col);
    let expression = formatNumber(reduced.matrix[row][cols]);
    freeCols.forEach((freeCol, index) => {
      const coefficient = -reduced.matrix[row][freeCol];
      if (Math.abs(coefficient) < 1e-10) return;
      const mag = Math.abs(coefficient);
      const label = Math.abs(mag - 1) < 1e-10 ? '' : formatNumber(mag);
      expression += `${coefficient < 0 ? ' - ' : ' + '}${label}t_{${index + 1}}`;
    });
    return `${variableNames[col]} = ${expression}`;
  });
  const parametricText = expressions.join('; ');
  return { status: 'infinite', statusText: 'El sistema tiene infinitas soluciones.', rankA, rankAug, freeCols, parametricText, reduced };
}
