// MatrizSolve — núcleo matemático (sin DOM). Script clásico: funciones globales.

// Admite: 2x + 3y = 5 · x/2 + y = 2 · 3/4x - y = 1 · 2x + 3 = 7 - y (variables en ambos lados).
function parseLinearEquation(line) {
  const normalized = line.replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/\*/g, '').trim();
  const sides = normalized.split('=');
  if (sides.length !== 2) return null;
  const num = '(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const termRe = new RegExp('^([+-]?)(' + num + '(?:/' + num + ')?)?([a-zA-Z](?:_?\\d+)?)(?:/(' + num + '))?$');
  const names = [];
  const left = new Map();
  let constant = 0; // constantes netas pasadas al lado derecho
  const readSide = (text, sideSign) => {
    const terms = text.replace(/\s+/g, '').match(/[+-]?[^+-]+/g) || [];
    for (const term of terms) {
      const m = term.match(termRe);
      if (m) {
        const base = m[2] === undefined ? 1 : parseFractionOrDecimal(m[2]);
        const divisor = m[4] === undefined ? 1 : parseFractionOrDecimal(m[4]);
        if (!Number.isFinite(base) || !Number.isFinite(divisor) || divisor === 0) return false;
        const key = m[3].toLowerCase();
        if (!left.has(key)) { names.push({ key, name: m[3] }); left.set(key, 0); }
        left.set(key, left.get(key) + sideSign * (m[1] === '-' ? -1 : 1) * base / divisor);
      } else {
        const n = parseFractionOrDecimal(term);
        if (!Number.isFinite(n)) return false;
        constant += sideSign * -n; // número en el lado izquierdo resta; en el derecho suma
      }
    }
    return true;
  };
  if (!readSide(sides[0], 1) || !readSide(sides[1], -1)) return null;
  return { names, coefficients: left, rhs: constant };
}
