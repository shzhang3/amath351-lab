const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../src/separable-examples-model.cjs');
const close=(a,b,tol=1e-7)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const derivative=(f,x,h=1e-5)=>(f(x+h)-f(x-h))/(2*h);

test('Problem 1 curves obey the ODE for arbitrary initial points, including the lost zero solution',()=>{
  for(const x0 of [-2,0,1.5])for(const y0 of [-2,0,2]){
    const s=m.solution('gaussian',x0,y0);close(s.value(x0),y0);
    for(const x of [-2.5,-.3,0,.7,2.5])close(derivative(s.value,x),-2*x*s.value(x),1e-6);
  }
  assert.equal(m.solution('gaussian',0,0).value(2),0);
});

test('Problem 5 uses only increasing sine arcs and differentiable equilibrium continuations',()=>{
  for(const x0 of [.25,1,4,8])for(const y0 of [-1,-.8,0,.8,1]){
    const s=m.solution('radical',x0,y0);close(s.value(x0),y0);
    assert.equal(s.value(0),null);assert.equal(s.value(-1),null);
    for(const fn of [s.value,s.alternate].filter(Boolean)){
      let previous=-1;
      for(let x=.01;x<=30;x+=.071){
        const y=fn(x);assert(y>=-1&&y<=1);assert(y>=previous-1e-12);previous=y;
        close(derivative(fn,x,1e-6),m.configs.radical.slope(x,y),2e-6);
      }
      for(const join of [s.lowerJoin,s.upperJoin].filter(x=>x>0)){
        const h=1e-5;
        close((fn(join+h)-fn(join))/h,0,1e-4);
        close((fn(join)-fn(join-h))/h,0,1e-4);
      }
    }
  }
  const s=m.solution('radical',1,0);
  close(s.upperJoin,(1+Math.PI/2)**2);
  assert.equal(s.value(9),1);
  assert.equal(m.configs.radical.slope(0,0),null);
  assert.equal(m.configs.radical.slope(1,1.01),null);
  assert.equal(m.solution('radical',0,0),null);
  assert.equal(m.solution('radical',1,1.01),null);
});

test('boundary initial values admit two different local solutions with the same tangent',()=>{
  for(const y0 of [-1,1]){
    const s=m.solution('radical',1,y0);close(s.alternate(1),y0);
    close(derivative(s.value,1),0);close(derivative(s.alternate,1),0,1e-6);
    for(const h of [.1,.01,.001]){
      const x=1-y0*h;assert(Math.abs(s.value(x)-s.alternate(x))>0);
    }
  }
});

test('implicit branches solve the ODE only to the right of their excluded endpoint',()=>{
  for(const x0 of [-2,0,1.5])for(const y0 of [-4,-1,0,2,6]){
    const s=m.solution('implicit',x0,y0);close(s.value(x0),y0);
    close(m.polynomial(s.left)+s.C,0,1e-9);
    assert(s.left<x0);assert.equal(s.value(s.left),null);assert.equal(s.value(s.left-.1),null);
    close(s.value(s.left+1e-8),1,1e-3);
    close(s.alternate(x0),2-y0);
    for(const x of [s.left+.01,x0,x0+.5])for(const fn of [s.value,s.alternate]){
      const y=fn(x);close((y-1)**2,m.polynomial(x)+s.C);
      close(derivative(fn,x,1e-6),m.configs.implicit.slope(x,y),1e-5);
    }
  }
  const s=m.solution('implicit',0,-1);close(s.C,4);close(s.left,-2);
  close(s.value(0),-1);close(s.alternate(0),3);
  assert.equal(m.solution('implicit',0,1),null);assert.equal(m.configs.implicit.slope(0,1),null);
});

test('saved state respects plotting ranges, and nonfinite input never becomes a curve',()=>{
  assert.deepEqual(m.restore(null),m.fresh());
  assert.deepEqual(m.restore({version:1,example:'__proto__'}),m.fresh());
  const s=m.restore({version:1,example:'radical',x0:-999,y0:999,density:90,revealed:true});
  assert.equal(s.x0,-.5);assert.equal(s.y0,1.4);assert.equal(s.density,25);assert.equal(s.revealed,true);
  assert.equal(m.solution('implicit',NaN,2),null);
  assert.equal(m.solution('radical',1,Infinity),null);
});
