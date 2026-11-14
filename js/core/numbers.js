// MatrizSolve — núcleo matemático (sin DOM). Script clásico: funciones globales.

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function parseFractionOrDecimal(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (value === null || value === undefined) return NaN;
  const text = String(value).trim().replace(',', '.');
  if (!text) return 0;
  const fraction = text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator === 0 ? NaN : numerator / denominator;
  }
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) ? Number(text) : NaN;
}

function sanitizeMatrix(mat) {
  return mat.map(row => row.map(v => {
    let n = parseFractionOrDecimal(v);
    return isNaN(n) ? 0 : n;
  }));
}

function sanitizeVector(vec) {
  return vec.map(v => {
    let n = parseFractionOrDecimal(v);
    return isNaN(n) ? 0 : n;
  });
}

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  if (num === 0) return "0";
  if (!useFractions) return Number(num.toPrecision(8)).toString();
  
  const tolerance = 1e-9;
  let sign = num < 0 ? "-" : "";
  let n = Math.abs(num);

  if (Math.round(n) !== 0 && Math.abs(n - Math.round(n)) < tolerance) {
    return (Math.round(num)).toString();
  }

  for (let d = 1; d <= 1000; d++) {
    let nCand = Math.round(n * d);
    if (nCand !== 0 && Math.abs(n - nCand / d) < tolerance) {
      let g = gcd(nCand, d);
      return `${sign}${nCand / g}/${d / g}`;
    }
  }
  return Number(num.toPrecision(8)).toString();
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
