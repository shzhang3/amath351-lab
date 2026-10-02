const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../src/motion-model.cjs');
const close = (a,b,tol=1e-8) => assert(Math.abs(a-b)<tol, `${a} != ${b}`);

test('two integrations satisfy the acceleration and both initial conditions', () => {
  close(m.position(0),1); close(m.velocity(0),-1);
  for(const t of [.1,.5,1,2.25,3,5.9]) {
    const h=1e-4;
    close((m.position(t+h)-m.position(t-h))/(2*h),m.velocity(t),1e-7);
    close((m.velocity(t+h)-m.velocity(t-h))/(2*h),m.acceleration(t),1e-7);
  }
  close(m.velocity(2.25),0); close(m.position(2.25),-1/12); close(m.acceleration(2.25),.4);
  assert(m.velocity(1)<0 && m.acceleration(1)>0);
  assert(m.velocity(3)>0 && m.acceleration(3)>0);
});

test('the observed drop fixes gravity, and height scales the fall time by its square root', () => {
  close(m.gravity,10); close(m.impactTime(20),2); close(m.impactSpeed(20),20);
  for(const height of [20,80,200,400]) {
    const time=m.impactTime(height);
    close(m.altitude(height,0),height);
    close(m.altitude(height,time),0);
    assert.equal(m.altitude(height,time+1),0);
    close(m.impactSpeed(height),Math.abs(m.fallingVelocity(time)));
    close(m.impactTime(height)/m.impactTime(20),Math.sqrt(height/20));
    close(m.impactSpeed(height)**2,2*m.gravity*height);
  }
  close(m.impactTime(200),Math.sqrt(40)); close(m.impactSpeed(200),10*Math.sqrt(40));
  close(m.altitude(200,2),180);
});

test('saved state stays in the supported time and height ranges, including impact', () => {
  for(const raw of [null,{}, {version:2,time:3},{version:1,time:Infinity}]) assert.equal(m.restoreMotion(raw),0);
  assert.equal(m.restoreMotion({version:1,time:8}),6);
  assert.equal(m.restoreMotion({version:1,time:-1}),0);
  assert.equal(m.restoreMotion({version:1,time:2.25}),2.25);
  assert.deepEqual(m.restoreDrop({version:1,height:NaN,time:NaN}),{height:200,time:0,gravityRevealed:false});
  const restored=m.restoreDrop({version:1,height:999,time:999,gravityRevealed:true});
  assert.equal(restored.height,400); close(restored.time,m.impactTime(400)); assert.equal(restored.gravityRevealed,true);
  assert.equal(m.restoreDrop({version:1,height:-1,time:-1}).height,20);
});
