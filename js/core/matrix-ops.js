// MatrizSolve — núcleo matemático (sin DOM). Script clásico: funciones globales.

function multiplyMatrixVector(mat, vector) {
  return mat.map(row => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function multiplyMatrices(left, right) {
  return left.map(row => right[0].map((_, col) => row.reduce((sum, value, index) => sum + value * right[index][col], 0)));
}

function getMinor(mat, r, c) {
  return mat.filter((_, rowIdx) => rowIdx !== r)
            .map(row => row.filter((_, colIdx) => colIdx !== c));
}

function computeDeterminant(mat) {
  if (!mat) return NaN;
  if (mat.length === 0) return 1;
  if (mat.some(row => row.length !== mat.length)) return NaN;
  const n = mat.length;
  const work = sanitizeMatrix(mat);
  let determinant = 1;
  let sign = 1;
  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(work[row][col]) > Math.abs(work[pivotRow][col])) pivotRow = row;
    }
    if (work[pivotRow][col] === 0) return 0;
    if (pivotRow !== col) {
      [work[col], work[pivotRow]] = [work[pivotRow], work[col]];
      sign *= -1;
    }
    const pivot = work[col][col];
    determinant *= pivot;
    for (let row = col + 1; row < n; row++) {
      const factor = work[row][col] / pivot;
      for (let j = col + 1; j < n; j++) work[row][j] -= factor * work[col][j];
    }
  }
  return sign * determinant;
}

function computeRank(mat) {
  if (!mat || !mat.length || !mat[0].length) return 0;
  return rowReduce(sanitizeMatrix(mat), mat[0].length, true).pivotCols.length;
}
