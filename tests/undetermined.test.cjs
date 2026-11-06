const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/undetermined-model.cjs');
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('trial derivatives agree with finite differences and output agrees with the original operator',()=>{
  const h=1e-4;
  for(const equation of Object.keys(M.equations))for(const n of [0,1,2])for(const A of [-2,0,.6,1.5,2])for(const x of [-.5,-.17,0,.28,.5]){
    const s={...M.fresh(equation),n,A},p=M.at(s,x),l=M.at(s,x-h),r=M.at(s,x+h),{b,c}=M.equations[equation];
    close((r.y-l.y)/(2*h),p.yp,1e-5);close((r.yp-l.yp)/(2*h),p.ypp,1e-4);
    close(p.ypp+b*p.yp+c*p.y,p.output,1e-10);
  }
});
test('the simple root requires one x and exactly A = 3/5 to match the forcing on the interval',()=>{
  for(const A of [-2,.6,2])for(const p of M.sample({...M.fresh(),A}))close(p.output,0);
  const s={...M.fresh(),n:1,A:.6};assert.equal(M.matches(s),true);
  for(const p of M.sample(s))close(p.output,p.target);
  assert.equal(M.matchingA({...s,n:2}),null);
});
test('the repeated root still annihilates x e^(4x) and requires x squared with A = 3/2',()=>{
  for(const n of [0,1])for(const A of [-2,1,2])for(const p of M.sample({...M.fresh('repeated'),n,A}))close(p.output,0);
  const s={...M.fresh('repeated'),n:2,A:1.5};assert.equal(M.matches(s),true);
  for(const p of M.sample(s))close(p.output,p.target);
});
test('matching at a single point does not count as solving the equation',()=>{
  const s={...M.fresh(),n:2,A:1.5,x:0},p=M.at(s);
  close(p.output,p.target);assert.equal(M.matches(s),false);
  assert.ok(Math.abs(M.at(s,.3).output-M.at(s,.3).target)>1);
  assert.equal(M.matches({...M.fresh(),n:1,A:1}),false);
});
test('before and after multiply the same trial by x, including negative and zero x',()=>{
  for(const equation of Object.keys(M.equations))for(const A of [-2,.6,1.5,2])for(const n of [1,2])for(const x of [-.5,0,.5]){
    const s={...M.fresh(equation),A,n};close(M.at(s,x).y,x*M.at(s,x,n-1).y);
  }
});
test('fixed stage comparison bounds contain all trials, operator outputs, and targets',()=>{
  for(const equation of Object.keys(M.equations))for(const A of [-2,0,.6,1.5,2])for(const field of ['y','output']){
    const s={...M.fresh(equation),A},bound=M.bounds(s,field);
    assert.deepEqual(bound,M.bounds({...s,n:2,x:.5,compare:false},field));
    for(const n of [0,1,2])for(const p of M.sample(s,n)){
      assert.ok(p[field]>bound[0]&&p[field]<bound[1]);
      if(field==='output')assert.ok(p.target>bound[0]&&p.target<bound[1]);
    }
  }
});
test('saved state rejects invalid options and clamps finite control values',()=>{
  assert.deepEqual(M.restore(null),M.fresh());assert.deepEqual(M.restore({version:2}),M.fresh());
  assert.deepEqual(M.restore({version:1,equation:'__proto__',n:1.5,A:'1',x:NaN}),M.fresh());
  assert.deepEqual(M.restore({version:1,equation:'repeated',n:2,A:10,x:-1,compare:false}),{equation:'repeated',n:2,A:2,x:-.5,compare:false});
});
