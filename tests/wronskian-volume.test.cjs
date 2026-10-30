const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/wronskian-volume-model.cjs');
const close=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);

test('the unit-cube example has the three standard initial-data arrows',()=>{
  const g=M.geometry(M.fresh());
  assert.deepEqual(g.vectors,[[1,0,0],[0,1,0],[0,0,1]]);
  assert.equal(g.signed,1);assert.equal(g.volume,1);assert.equal(g.baseArea,1);assert.equal(g.height,1);
  assert.equal(new Set(g.vertices.map(v=>v.join(','))).size,8);
});

test('the displayed jets are values and derivatives of the stated solutions',()=>{
  const h=1e-5;
  for(const shape of ['unit','slanted'])for(const lambda of [-1,-.05,0,.05,1]){
    const state={...M.fresh(),shape,lambda};
    for(const a of [-1,-.3,0,.6,1]){
      const values=M.vectors(state,a),left=M.vectors(state,a-h),right=M.vectors(state,a+h);
      for(let i=0;i<3;i++){
        close((right[i][0]-left[i][0])/(2*h),values[i][1]);
        close((right[i][1]-left[i][1])/(2*h),values[i][2]);
        close((right[i][2]-left[i][2])/(2*h),0);
      }
    }
  }
});

test('shearing or changing evaluation point preserves base area and volume; orientation keeps its sign',()=>{
  for(const shape of ['unit','slanted'])for(const a of [-1,-.25,0,.75,1])for(const lambda of [-1,-.2,0,.2,1]){
    const g=M.geometry({...M.fresh(),shape,a,lambda});
    close(g.baseArea,1);close(g.signed,lambda);close(g.volume,Math.abs(lambda));close(g.height,Math.abs(lambda));
    if(lambda===0)assert(g.vertices.every(v=>v[2]===0));
    const [v1,v2,v3]=g.vectors;
    close(M.dot(M.cross(v2,v1),v3),-g.signed);
  }
});

test('matching three initial values works independently of lambda sign, offset, and evaluation point',()=>{
  for(const shape of ['unit','slanted'])for(const a of [-1,0,1])for(const lambda of [-1,-.05,.05,1]){
    for(const target of Object.values(M.targets)){
      const state={...M.fresh(),shape,a,lambda},match=M.match(state,target);
      assert.equal(match.kind,'unique');
      M.combine(state,match.coefficients).forEach((value,i)=>close(value,target[i]));
    }
  }
});

test('a flat set cannot match nonzero second derivative, but reachable data have redundant coefficients',()=>{
  for(const shape of ['unit','slanted'])for(const a of [-1,0,1]){
    const state={...M.fresh(),shape,a,lambda:0};
    assert.equal(M.match(state,M.targets.curvature).kind,'unreachable');
    const match=M.match(state,M.targets.flat);
    assert.equal(match.kind,'many');
    assert.deepEqual(M.combine(state,match.coefficients),M.targets.flat);
    const [alpha,beta]=M.offsets(shape),other=match.coefficients.map((c,i)=>c+[-alpha,-beta,1][i]);
    assert.notDeepEqual(other,match.coefficients);
    for(const x of [-2,-.5,0,1,2])M.combine(state,other,x).forEach((value,i)=>close(value,M.combine(state,match.coefficients,x)[i]));
  }
});

test('the 3D camera uses one length scale and height references do not depend on lambda',()=>{
  for(const yaw of [0,45,90,135,180,270]){
    for(const point of [[1,0,0],[0,1,0],[0,0,1],[1,2,-1]]){
      const p=M.project(point,yaw);close(p.u*p.u+p.v*p.v+p.depth*p.depth,M.dot(point,point));
    }
    const a=M.reference({...M.fresh(),yaw,lambda:0}),b=M.reference({...M.fresh(),yaw,lambda:1});
    assert.deepEqual(a,b);
  }
});

test('saved controls reject nonfinite or unrelated state and preserve valid choices',()=>{
  assert.deepEqual(M.restore(null),M.fresh());assert.deepEqual(M.restore({version:7,lambda:0}),M.fresh());
  const state=M.restore({version:1,shape:'slanted',lambda:99,a:-99,yaw:-45,target:'flat'});
  assert.deepEqual(state,{shape:'slanted',lambda:1,a:-1,yaw:315,target:'flat'});
  assert.deepEqual(M.restore({version:1,lambda:NaN,a:Infinity,yaw:Infinity,shape:'invalid',target:'invalid'}),M.fresh());
});
