const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/nonhomogeneous-model.cjs');
const close=(a,b,tol=1e-8)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const second=(f,x,h=1e-4)=>(f(x+h)-2*f(x)+f(x-h))/(h*h);

test('every decomposition is pointwise additive and satisfies the correct equation',()=>{
  for(const particular of Object.keys(M.particulars))for(const a of [-3,0,2,3])for(const b of [-3,0,1.5,3]){
    const state={...M.fresh(),a,b,particular};
    for(const x of [-.8,-.2,0,.4,.8]){
      const t=M.terms(state,x);
      close(t.complementary.value+t.particular.value,t.total.value);
      for(const [key,force] of [['complementary',0],['particular',12],['total',12]]){
        close(t[key].operator,force);
        // Differentiate the plotted value independently of the analytic output.
        close(second(z=>M.terms(state,z)[key].value,x)-4*t[key].value,force,3e-6);
      }
    }
  }
});

test('changing the particular solution preserves the full curve, family, and axis range',()=>{
  for(const pair of [{a:-3,b:3},{a:0,b:0},...M.family()]){
    const base={...M.fresh(),...pair,family:true},other={...base,particular:'exponential'};
    assert.deepEqual(M.initial(base),M.initial(other));
    assert.deepEqual(M.yDomain(base),M.yDomain(other));
    close(M.coefficients(other).c1,M.coefficients(base).c1-1);
    for(const x of [-.8,-.35,0,.65,.8]){
      const a=M.terms(base,x),b=M.terms(other,x);
      assert.equal(a.total.value,b.total.value);
      close(b.particular.value-a.particular.value,Math.exp(2*x));
      close(b.complementary.value-a.complementary.value,-Math.exp(2*x));
    }
  }
});

test('the lecture preset matches both initial conditions with either particular solution',()=>{
  for(const particular of Object.keys(M.particulars)){
    const state=M.matchInitial({...M.fresh(),particular},2,-2);
    assert.equal(state.a,2);assert.equal(state.b,3);
    assert.deepEqual(M.initial(state),{value:2,slope:-2});
    close(M.terms(state,0).total.value,2);
    const h=1e-5;
    close((M.terms(state,h).total.value-M.terms(state,-h).total.value)/(2*h),-2);
  }
});

test('displayed curves fit finite domains at all slider corners and representation choices',()=>{
  for(const particular of Object.keys(M.particulars))for(const a of [-3,3])for(const b of [-3,3])for(const family of [false,true]){
    const state={...M.fresh(),particular,a,b,family},[lo,hi]=M.yDomain(state);
    assert(Number.isFinite(lo)&&Number.isFinite(hi)&&lo<hi);
    for(const point of M.sample(state))for(const key of ['complementary','particular','total'])assert(point[key].value>lo&&point[key].value<hi);
  }
});

test('restoration rejects invalid values and preserves a valid decomposition',()=>{
  assert.deepEqual(M.restore(null),M.fresh());
  assert.deepEqual(M.restore({version:9,a:3}),M.fresh());
  const state=M.restore({version:1,a:99,b:-99,x:Infinity,particular:'invalid',visible:{total:false},family:true});
  assert.equal(state.a,3);assert.equal(state.b,-3);assert.equal(state.x,0);assert.equal(state.particular,'constant');assert.equal(state.visible.total,false);
  const saved={version:1,a:-2.2,b:1.5,x:.37,particular:'exponential',family:true,visible:{total:true,complementary:false,particular:true}};
  const {version,...expected}=saved;
  assert.deepEqual(M.restore(saved),expected);
});
