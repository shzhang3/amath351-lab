const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/vibration-model.cjs');
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('known undamped, critical, and overdamped solutions',()=>{
  const s=M.fresh();
  for(const t of [0,.1,1,3,10]){
    close(M.at(s,t).x,Math.cos(2*t));close(M.at(s,t).v,-2*Math.sin(2*t));
    close(M.at({...s,c:4},t).x,(1+2*t)*Math.exp(-2*t));
    close(M.at({...s,c:4},t).v,-4*t*Math.exp(-2*t));
    close(M.at({...s,c:5},t).x,(4*Math.exp(-t)-Math.exp(-4*t))/3);
  }
});
test('all branches match initial values and satisfy the ODE',()=>{
  const h=1e-5;
  for(const m of [.5,1,3])for(const k of [1,4,9])for(const c of [0,.5,2*Math.sqrt(m*k),24])for(const v0 of [-3,0,4]){
    const s={m,k,c,x0:-1.3,v0};const initial=M.at(s,0);close(initial.x,s.x0);close(initial.v,v0);
    for(const t of [.1,1,8]){
      const a=M.at(s,t-h),b=M.at(s,t),d=M.at(s,t+h);
      close((d.x-a.x)/(2*h),b.v,2e-7);
      close(m*(d.v-a.v)/(2*h)+c*b.v+k*b.x,0,2e-6);
    }
  }
});
test('energy is conserved without damping and decreases with damping',()=>{
  for(const c of [0,1,4,8,24]){
    const s={...M.fresh(),c,v0:2};let previous=M.at(s,0).energy;
    for(const p of M.sample(s)){
      assert.ok(p.energy<=previous+1e-10);if(c===0)close(p.energy,previous);
      assert.ok(Math.abs(p.x)<=M.amplitudeBound(s)+1e-10);previous=p.energy;
    }
    if(c>0)assert.ok(M.at(s,1000).energy<1e-10);
  }
});
test('motion and roots vary continuously through critical damping',()=>{
  for(const m of [.5,1,3])for(const k of [1,4,9]){
    const s={...M.fresh(),m,k,v0:-2};const c=M.critical(s);
    assert.equal(M.coefficients({...s,c:0}).kind,'undamped');
    assert.equal(M.coefficients({...s,c:c/4}).kind,'underdamped');
    assert.equal(M.coefficients({...s,c}).kind,'critical');
    assert.equal(M.coefficients({...s,c:2*c}).kind,'overdamped');
    for(const t of [.1,1,12])for(const eps of [-1e-8,1e-8])close(M.at({...s,c:c+eps},t).x,M.at({...s,c},t).x,2e-8);
    for(const r of M.coefficients({...s,c:2*c}).roots)close(m*r.re*r.re+2*c*r.re+k,0,1e-10);
    close(M.coefficients(s).period,2*Math.PI*Math.sqrt(m/k));
  }
});
test('nonoscillatory solutions can cross equilibrium once for some initial velocities',()=>{
  for(const c of [4,8]){const s={...M.fresh(),c,x0:.4,v0:-4};assert.ok(M.at(s,0).x>0);assert.ok(M.at(s,2).x<0);}
});
test('saved state validates numeric types and bounds, and the zero state stays still',()=>{
  assert.deepEqual(M.restore(null),M.fresh());
  assert.deepEqual(M.restore({version:2,m:2}),M.fresh());
  assert.deepEqual(M.restore({version:1,m:'2',k:NaN,c:Infinity}),M.fresh());
  const s=M.restore({version:1,m:-3,k:10,c:50,time:100,x0:0,v0:0,compare:true});
  assert.equal(s.m,.5);assert.equal(s.k,9);assert.equal(s.c,24);assert.equal(s.time,12);assert.equal(s.compare,true);
  for(const p of M.sample(s))assert.deepEqual([p.x,p.v,p.energy],[0,0,0]);
});
