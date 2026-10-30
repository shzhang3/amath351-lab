(function (root,factory) {
  if (typeof module==='object'&&module.exports) module.exports=factory();
  else root.WronskianVolumeModel=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function () {
  const fresh=()=>({shape:'unit',lambda:1,a:0,yaw:45,target:'curvature'});
  const targets={curvature:[0,0,1],flat:[1,1,0]};
  const offsets=shape=>shape==='slanted'?[1,1]:[0,0];
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  const scale=(a,c)=>a.map(v=>v*c);
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function vectors(state,x=state.a) {
    const [alpha,beta]=offsets(state.shape),l=state.lambda;
    return [[1,0,0],[x,1,0],[alpha+beta*x+l*x*x/2,beta+l*x,l]];
  }
  function geometry(state) {
    const v=vectors(state),normal=cross(v[0],v[1]),area=Math.hypot(...normal);
    const signed=dot(normal,v[2]);
    const vertices=Array.from({length:8},(_,mask)=>v.reduce((p,vi,i)=>mask&(1<<i)?add(p,vi):p,[0,0,0]));
    return {vectors:v,vertices,signed,volume:Math.abs(signed),baseArea:area,height:Math.abs(signed)/area};
  }
  function combine(state,coefficients,x=state.a) {
    return vectors(state,x).reduce((sum,v,i)=>add(sum,scale(v,coefficients[i])),[0,0,0]);
  }
  function match(state,target=targets[state.target]) {
    const [b0,b1,b2]=target,[alpha,beta]=offsets(state.shape),a=state.a,l=state.lambda;
    if(l===0) {
      if(b2!==0) return {kind:'unreachable',coefficients:null};
      return {kind:'many',coefficients:[b0-a*b1,b1,0]};
    }
    const c3=b2/l,c2=b1-c3*(beta+l*a),c1=b0-a*c2-c3*(alpha+beta*a+l*a*a/2);
    return {kind:'unique',coefficients:[c1,c2,c3]};
  }
  function project(point,yaw=45) {
    const angle=yaw*Math.PI/180,elevation=Math.PI/6;
    const [x,y,z]=point;
    const horizontal=Math.sin(angle)*x+Math.cos(angle)*y;
    return {u:Math.cos(angle)*x-Math.sin(angle)*y,v:Math.sin(elevation)*horizontal-Math.cos(elevation)*z,
      depth:Math.cos(elevation)*horizontal+Math.sin(elevation)*z};
  }
  function reference(state) {
    // Both extreme heights share one scale; reducing lambda must visibly
    // flatten the solid rather than zoom the height back to a full cube.
    const points=[...geometry({...state,lambda:1}).vertices,...geometry({...state,lambda:-1}).vertices,
      ...Object.values(targets)];
    const lo=[0,0,0],hi=[1.35,1.35,1.35];
    points.forEach(p=>p.forEach((v,i)=>{lo[i]=Math.min(lo[i],v);hi[i]=Math.max(hi[i],v+.35);}));
    const axes=[0,1,2].map(i=>({lo:lo.map((v,j)=>i===j?v:0),hi:hi.map((v,j)=>i===j?v:0)}));
    const plane=[[lo[0],lo[1],0],[hi[0],lo[1],0],[hi[0],hi[1],0],[lo[0],hi[1],0]];
    return {points:[...points,...axes.flatMap(v=>[v.lo,v.hi]),...plane],axes,plane};
  }
  function restore(saved) {
    const state=fresh();
    if(!saved||saved.version!==1)return state;
    if(['unit','slanted'].includes(saved.shape))state.shape=saved.shape;
    for(const [key,lo,hi]of [['lambda',-1,1],['a',-1,1]])if(Number.isFinite(saved[key]))state[key]=Math.round(clamp(saved[key],lo,hi)*20)/20;
    if(Number.isFinite(saved.yaw))state.yaw=((saved.yaw%360)+360)%360;
    if(Object.hasOwn(targets,saved.target))state.target=saved.target;
    return state;
  }
  return {fresh,targets,offsets,add,scale,dot,cross,vectors,geometry,combine,match,project,reference,restore};
});
