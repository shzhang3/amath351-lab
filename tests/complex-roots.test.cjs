const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/complex-roots-model.cjs');
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('the fixed roots solve the lecture characteristic polynomial',()=>{
  const {alpha:a,beta:b}=M;close(a*a-b*b+2*a+5,0);close(2*a*b+2*b,0);
});
test('real and imaginary parts satisfy the ODE and the complex exponential has the correct decay and rotation',()=>{
  for(const x of [0,.1,.5,1,2,4,6]){
    const b=M.basis(x),norm=b.u*b.u+b.v*b.v;
    close(b.upp+2*b.up+5*b.u,0);close(b.vpp+2*b.vp+5*b.v,0);
    close(Math.hypot(b.u,b.v),Math.exp(-x));
    close((b.u*b.vp-b.v*b.up)/norm,2);
    close((b.u*b.up+b.v*b.vp)/norm,-1);
  }
});
test('the lecture IVP selects real coefficients 2 and 1',()=>{
  const s=M.fresh();assert.deepEqual(M.matchInitial(2,0),{c1:2,c2:1});
  assert.deepEqual(M.initial(s),{value:2,slope:0});assert.equal(M.matchesLecture(s),true);
  assert.equal(M.matchesLecture({...s,c2:0}),false);
  for(const x of [0,.3,1,6])close(M.at(s,x).y,Math.exp(-x)*(2*Math.cos(2*x)+Math.sin(2*x)));
});
test('real linear combinations, derivatives, and initial data agree throughout the control ranges',()=>{
  const h=1e-5;
  for(const c1 of [-3,0,2,3])for(const c2 of [-3,0,1,3]){
    const s={...M.fresh(),c1,c2};const init=M.initial(s);
    close(M.at(s,0).y,init.value);close(M.at(s,0).yp,init.slope);
    assert.deepEqual(M.matchInitial(init.value,init.slope),{c1,c2});
    for(const x of [.1,1,3,5]){
      const a=M.at(s,x-h),b=M.at(s,x),d=M.at(s,x+h);
      close((d.y-a.y)/(2*h),b.yp,1e-8);close((d.yp-a.yp)/(2*h),b.ypp,1e-8);
      close(b.ypp+2*b.yp+5*b.y,0);
      assert.ok(Math.abs(b.y)<=b.envelope+1e-10);
    }
  }
});
test('plot bounds contain all displayed curves and do not depend on the playback position',()=>{
  for(const c1 of [-3,0,2,3])for(const c2 of [-3,0,1,3])for(const basis of [false,true]){
    const s={...M.fresh(),c1,c2,basis},bound=M.plotBound(s);
    close(bound,M.plotBound({...s,x:6}));
    for(const p of M.sample(s)){assert.ok(Math.abs(p.y)<bound);assert.ok(p.envelope<bound);if(basis)assert.ok(Math.max(Math.abs(p.u),Math.abs(p.v))<bound);}
  }
});
test('saved state validates numeric coefficients, playback limits, and boolean controls',()=>{
  assert.deepEqual(M.restore(null),M.fresh());assert.deepEqual(M.restore({version:3,c1:1}),M.fresh());
  assert.deepEqual(M.restore({version:1,c1:'2',c2:NaN,x:Infinity}),M.fresh());
  assert.deepEqual(M.restore({version:1,c1:10,c2:-10,x:10,basis:true,envelope:false}),{c1:3,c2:-3,x:6,basis:true,envelope:false});
});
