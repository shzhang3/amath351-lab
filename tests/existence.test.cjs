const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../src/existence-model.cjs');
const close=(a,b,tol=1e-7)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);

test('the exact regular curves obey the ODE and the separation law',()=>{
  for(const offset of [-.2,0,.2]){
    close(m.regular(0,1+offset),1+offset);
    for(const x of [-.75,-.1,0,.4,.75]){
      const e=1e-5,b=1+offset;
      close((m.regular(x+e,b)-m.regular(x-e,b))/(2*e),x-m.regular(x,b));
      close(m.regular(x,b)-m.regular(x),offset*Math.exp(-x));
      assert(m.regular(x,b)>-1&&m.regular(x,b)<3);
    }
  }
});

test('two-sided tangent steps stay in R and converge toward the exact curve',()=>{
  for(const h of [.15,.35,.65,.75]){
    let previous=Infinity;
    for(const n of [1,2,4,8,16,32,64]){
      const p=m.polygon(h,n);
      close(p[0].x,-h);close(p.at(-1).x,h);close(p[n].x,0);close(p[n].y,1);
      for(const q of p)assert(q.x>=-1&&q.x<=1&&q.y>=-1&&q.y<=3);
      const error=Math.max(...p.map(q=>Math.abs(q.y-m.regular(q.x))));
      assert(error<previous);previous=error;
    }
  }
  const first=m.polygon(.5,1);
  assert.deepEqual(first,[{x:-.5,y:1.5},{x:0,y:1},{x:.5,y:.5}]);
  assert.equal(m.existence(0,.65).phase,0);
  assert.equal(m.existence(.3,.65).phase,1);
  assert.equal(m.existence(.8,.65).phase,2);
  assert.equal(m.existence(1,.65).phase,3);
  assert.equal(m.existence(1,.65).n,64);
});

test('branching curves are distinct classical solutions of the same initial-value problem',()=>{
  for(const c of [.15,.4,.75]){
    close(m.branch(0),0);close(m.branch(0,c),0);
    for(const delay of [0,c]){
      for(const x of [-1.25,-.01,0,.01,delay,delay+.1,1.25]){
        const e=1e-6;
        close((m.branch(x+e,delay)-m.branch(x-e,delay))/(2*e),m.branchSlope(x,m.branch(x,delay)));
      }
      close((m.branch(delay+1e-5,delay)-m.branch(delay,delay))/1e-5,0);
      close((m.branch(delay,delay)-m.branch(delay-1e-5,delay))/1e-5,0);
    }
    for(const x of [c/2,c/10,c/100])assert(m.branch(x)>m.branch(x,c));
  }
});

test('restored presentation state stays inside the proved demonstration ranges',()=>{
  assert.deepEqual(m.restore(null),m.fresh());
  assert.deepEqual(m.restore({version:2}),m.fresh());
  assert.deepEqual(m.restore({version:1,mode:'branching',progress:7,h:99,offset:-99,delay:0}),
    {mode:'branching',progress:1,h:.75,offset:-.2,delay:.15});
  const bad=m.restore({version:1,mode:'__proto__',h:NaN,delay:Infinity});
  assert.deepEqual(bad,m.fresh());
});
