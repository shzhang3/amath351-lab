const test=require('node:test');const assert=require('node:assert/strict');
const m=require('../src/integrating-factor-model.cjs');
const close=(a,b,tol=1e-7)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const derivative=(f,x,h=1e-5)=>(f(x+h)-f(x-h))/(2*h);

test('the exact family satisfies the original equation and each initial value',()=>{
  for(const b of [-4,0,4,10,12]){
    close(m.solution(1,b),b);
    for(const x of [.05,.2,.7,1,1.7,2]){
      const y=m.solution(x,b),dy=derivative(t=>m.solution(t,b),x);
      close(x*dy-3*y,x**3,1e-6);close(dy,m.slope(x,y),1e-6);
    }
  }
  close(m.solution(2),8*(Math.log(2)+10));close(m.slope(1,10),31);
});

test('the integrating factor gives the product derivative and removes dependence on z',()=>{
  for(const b of [-4,0,10,12])for(const x of [.05,.2,1,2]){
    close(m.factor(x)*m.solution(x,b),m.transformed(x,b));
    close(derivative(t=>m.factor(t)*m.solution(t,b),x,1e-6),1/x,1e-7);
    close(derivative(t=>m.factor(t),x,1e-7),-3*m.factor(x)/x,.0001);
    close(m.transformed(x,b)-m.transformed(x,0),b);
  }
});

test('zero is excluded from the standard form even though the original curve tends to zero',()=>{
  for(const x of [-1,0,NaN,Infinity]){
    assert.equal(m.solution(x),null);assert.equal(m.factor(x),null);
    assert.equal(m.slope(x,0),null);assert.equal(m.transformed(x),null);
  }
  for(const b of [-4,10,12]){
    assert(Math.abs(m.solution(1e-7,b))<1e-18);
    assert(Math.abs(m.slope(1e-7,m.solution(1e-7,b)))<1e-11);
  }
  const points=m.samples();assert(points.every(x=>x>0&&x<=2.0000000001));
  for(let i=1;i<points.length;i++)assert(points[i]>points[i-1]);
});

test('restoration clamps controls and preserves the lecture default',()=>{
  assert.deepEqual(m.restore(null),m.fresh());assert.deepEqual(m.restore({version:2}),m.fresh());
  assert.deepEqual(m.restore({version:1,stage:9,x:-10,initial:100}),{stage:2,x:.05,initial:12});
  assert.deepEqual(m.restore({version:1,stage:NaN,x:NaN,initial:Infinity}),m.fresh());
});
