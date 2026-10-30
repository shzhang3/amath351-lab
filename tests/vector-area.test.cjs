const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/vector-area-model.cjs');
const close=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const polygonArea=p=>Math.abs(p.reduce((sum,v,i)=>sum+M.cross(v,p[(i+1)%p.length]),0))/2;

test('base times perpendicular height equals the coordinate area across orientations',()=>{
  for(const r of [.75,2.5,3])for(const s of [.75,2.3,3])for(const alpha of [-180,-35,0,80,180])for(const theta of [-180,-130,-90,-55,0,55,90,130,180]){
    const state={r,s,alpha,theta},g=M.geometry(state),p=g.original;
    close(distance(p.O,p.A),r);close(distance(p.O,p.B),s);
    close(distance(p.H,p.B),g.height);
    close((p.B[0]-p.H[0])*p.A[0]+(p.B[1]-p.H[1])*p.A[1],0);
    close(g.area,r*g.height);close(g.signedArea,r*s*Math.sin(M.rad(theta)));
    close(polygonArea([p.O,p.A,p.C,p.B]),g.area);
    close(Math.sin(M.rad(g.phi))*s,g.height);
  }
});

test('rotating the base to horizontal preserves every distance and the whole area',()=>{
  for(const alpha of [-180,-70,25,135,180])for(const theta of [-130,-55,0,55,130]){
    const state={...M.fresh(),alpha,theta},g=M.geometry(state),other=M.geometry({...state,alpha:0});
    assert.deepEqual(g.aligned,other.aligned);
    assert.deepEqual(g.center,other.center);assert.equal(g.radius,other.radius);
    close(g.area,other.area);
    for(const name of ['O','A','B','H','C']){
      const p=M.rotate(g.original[name],-alpha);
      close(p[0],g.aligned[name][0]);close(p[1],g.aligned[name][1]);
    }
  }
});

test('parallel, perpendicular, obtuse, and negative cases use the correct triangle interpretation',()=>{
  for(const theta of [0,180,-180]){const g=M.geometry({...M.fresh(),theta});assert.equal(g.kind,'parallel');assert.equal(g.height,0);assert.equal(g.area,0);}
  for(const theta of [90,-90]){const g=M.geometry({...M.fresh(),theta});assert.equal(g.kind,'perpendicular');assert.equal(g.height,2.3);assert.deepEqual(g.aligned.H,[0,0]);}
  const obtuse=M.geometry({...M.fresh(),theta:130});assert.equal(obtuse.kind,'obtuse');assert.equal(obtuse.phi,50);assert(obtuse.projection<0);
  const positive=M.geometry(M.fresh()),negative=M.geometry({...M.fresh(),theta:-55});
  close(positive.height,negative.height);close(positive.area,negative.area);close(positive.signedArea,-negative.signedArea);
});

test('dragging one endpoint preserves the other vector and respects positive length limits',()=>{
  const state=M.fresh(),before=M.geometry(state);
  const a=M.drag(state,'A',[1.4,-1.1]),ga=M.geometry(a);
  close(ga.original.A[0],1.4);close(ga.original.A[1],-1.1);
  close(ga.original.B[0],before.original.B[0]);close(ga.original.B[1],before.original.B[1]);
  const b=M.drag(state,'B',[-1,1]),gb=M.geometry(b);
  close(gb.original.B[0],-1);close(gb.original.B[1],1);assert.deepEqual(gb.original.A,before.original.A);
  assert.equal(M.drag(state,'A',[100,100]).r,3);assert.equal(M.drag(state,'B',[.01,0]).s,.75);
  assert.deepEqual(M.drag(state,'A',[0,0]),state);
});

test('saved controls are finite, bounded, and independent of unrelated state',()=>{
  assert.deepEqual(M.restore(null),M.fresh());assert.deepEqual(M.restore({version:2,r:0}),M.fresh());
  assert.deepEqual(M.restore({version:1,r:99,s:-4,alpha:999,theta:-999}),{r:3,s:.75,alpha:180,theta:-180});
  assert.deepEqual(M.restore({version:1,r:NaN,s:Infinity,alpha:'bad',theta:NaN}),M.fresh());
});
