const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../src/slope-field-model.cjs');
const close=(a,b,tol=1e-8)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);

test('exact curves satisfy both equations and the selected initial value',()=>{
  for(const c of Object.values(m.configurations)){
    for(const initial of [-1,0,1]){
      close(c.solution(0,initial),initial);
      for(const x of [c.xmin,0,.5,c.xmax]){
        const h=1e-5;
        close((c.solution(x+h,initial)-c.solution(x-h,initial))/(2*h),c.slope(x,c.solution(x,initial)));
      }
    }
  }
  close(m.configurations.plus.solution(-4,0),3+Math.exp(-4));
});

test('tangent steps use the current approximate point, with correct forward and backward signs',()=>{
  const forward=m.approximation('minus',1,.5,2);
  assert.deepEqual(forward,[{x:0,y:1},{x:.5,y:.5},{x:1,y:.5}]);
  const backward=m.approximation('plus',0,.5,2);
  assert.deepEqual(backward,[{x:0,y:0},{x:-.5,y:0},{x:-1,y:.25}]);
  for(const [key,c] of Object.entries(m.configurations)){
    const error=h=>{
      const last=m.approximation(key,c.initial,h,Math.round(Math.abs(c.target)/h)).at(-1);
      close(last.x,c.target);
      return Math.abs(last.y-c.solution(last.x,c.initial));
    };
    assert(error(.05)<error(.5)/5);
  }
});

test('restored controls reject invalid state and stay within each example domain',()=>{
  assert.deepEqual(m.restore(null),m.fresh());
  assert.deepEqual(m.restore({version:3,stage:4}),m.fresh());
  assert.equal(m.restore({version:1,equation:'constructor'}).equation,'minus');
  const state=m.restore({version:1,equation:'plus',stage:99,time:-99,probeX:99,probeY:NaN,y0:99,count:30,h:.05,steps:999,exact:true});
  assert.deepEqual(state,{stage:4,equation:'plus',time:-4,probeX:1,probeY:0,y0:1,count:31,gridCount:9,h:.05,steps:80,exact:true});
  assert.equal(m.restore({version:1,stage:0,gridCount:999}).gridCount,25);
  assert.equal(m.restore({version:1,gridCount:NaN}).gridCount,9);
  assert.equal(m.restore({version:1,gridCount:6}).gridCount,7);
  const invalid=m.restore({version:1,h:0,steps:-1,time:Infinity,exact:'yes'});
  assert.equal(invalid.h,.5);assert.equal(invalid.steps,0);assert.equal(invalid.time,0);assert.equal(invalid.exact,false);
});
