const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../src/interval-dependence-model.cjs');
const close = (a,b,tol=1e-7) => assert(Math.abs(a-b)<tol, `${a} != ${b}`);

test('the plotted functions have the stated derivatives on both sides and at zero', () => {
  for (const x of [-2,-.7,0,.7,2]) {
    const h=1e-5;
    close((m.f(x+h)-m.f(x-h))/(2*h),m.df(x));
    close((m.g(x+h)-m.g(x-h))/(2*h),m.dg(x));
    close(m.g(x),x*x*Math.abs(x));
  }
});

test('zero Wronskian coexists with independent function values across zero', () => {
  for (const x of [-3,-1,-.1,0,.1,1,3]) close(m.wronskian(x),0);
  // Evaluating c1*f + c2*g = 0 at -1 and 1 gives an invertible system.
  assert.notEqual(m.f(-1)*m.g(1)-m.f(1)*m.g(-1),0);
  assert.equal(m.ratio(0),null);
  assert.equal(m.f(0),0); assert.equal(m.g(0),0);
  assert.equal(m.df(0),0); assert.equal(m.dg(0),0);
});

test('one constant works on each half-line, but neither works on the whole line', () => {
  for (const x of [.01,.5,1,5,100]) {
    close(m.g(x),m.f(x)); close(m.g(-x),-m.f(-x));
    assert.equal(m.ratio(x),1); assert.equal(m.ratio(-x),-1);
  }
  assert(m.matches('positive',1)); assert(m.matches('negative',-1));
  assert(!m.matches('positive',-1)); assert(!m.matches('negative',1));
  for (const k of [-2,-1,0,1,2]) assert(!m.matches('real',k));
});
