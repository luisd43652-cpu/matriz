// Pruebas automáticas del núcleo: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), vm = require('vm');

const ctx = vm.createContext({ Math, Number, String, Array, Set, Map, console });
vm.runInContext('var useFractions = true;', ctx);
for (const f of ['numbers', 'equation-parser', 'row-reduction', 'matrix-ops']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'core', f + '.js'), 'utf8'), ctx, { filename: f });
}
const run = (code) => JSON.parse(vm.runInContext(`JSON.stringify(${code})`, ctx));
const solve = (A, b) => run(`(() => { const r = solveSystem(${JSON.stringify(A)}, ${JSON.stringify(b)}, ['x','y','z','w','v']); return {status: r.status, rankA: r.rankA, rankAug: r.rankAug, sol: r.solution && r.solution.map(formatNumber), param: r.parametricText}; })()`);
const parse = (line) => run(`(() => { const e = parseLinearEquation(${JSON.stringify(line)}); return e && {c: [...e.coefficients], rhs: e.rhs}; })()`);

test('solución única', () => { const r = solve([[2,1],[1,-1]], [5,1]); assert.equal(r.status, 'unique'); assert.deepEqual(r.sol, ['2','1']); });
test('infinitas soluciones', () => { const r = solve([[1,1],[2,2]], [2,4]); assert.equal(r.status, 'infinite'); assert.equal(r.rankA, 1); });
test('incompatible', () => { assert.equal(solve([[1,1],[2,2]], [2,5]).status, 'none'); });
test('pivote nulo', () => { assert.deepEqual(solve([[0,1],[1,1]], [2,3]).sol, ['1','2']); });
test('rectangular', () => { const r = solve([[1,1,1],[1,-1,1]], [3,1]); assert.equal(r.status, 'infinite'); assert.equal(r.rankA, 2); });
test('fracciones', () => { assert.deepEqual(solve([[0.5,1],[1,-1]], [2,0]).sol, ['4/3','4/3']); });
test('negativos', () => { assert.deepEqual(solve([[1,1],[1,-1]], [-1,3]).sol, ['1','-2']); });
test('3x3 del editor', () => { assert.deepEqual(solve([[2,1,-1],[-3,-1,2],[-2,1,2]], [8,-11,-3]).sol, ['2','3','-1']); });
test('determinante singular y 3x3', () => {
  assert.equal(run('computeDeterminant([[1,2],[2,4]])'), 0);
  assert.ok(Math.abs(run('computeDeterminant([[2,1,-1],[-3,-1,2],[-2,1,2]])') + 1) < 1e-9);
});
test('formatNumber no redondea 0.4999999 a 1/2', () => { assert.equal(run('formatNumber(0.4999999)'), '0.4999999'); });
test('parámetro con coeficiente 1 no imprime "1t"', () => { assert.ok(!/ 1t_/.test(solve([[1,1],[2,2]], [2,4]).param)); });
test('parser: x/2 + y = 2', () => { assert.deepEqual(parse('x/2 + y = 2'), { c: [['x',0.5],['y',1]], rhs: 2 }); });
test('parser: 3/4x - y = 1', () => { assert.deepEqual(parse('3/4x - y = 1'), { c: [['x',0.75],['y',-1]], rhs: 1 }); });
test('parser: variables a ambos lados', () => { assert.deepEqual(parse('2x + 3 = 7 - y'), { c: [['x',2],['y',1]], rhs: 4 }); });
test('parser: rechaza basura y división por cero', () => { assert.equal(parse('x/0 = 1'), null); assert.equal(parse('hola'), null); });
