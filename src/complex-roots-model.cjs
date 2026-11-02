(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ComplexRootsModel=factory();
})(globalThis,function(){
  const domain=[0,6],alpha=-1,beta=2;
  const fresh=()=>({c1:2,c2:1,x:0,basis:false,envelope:true});
  function basis(x){
    const e=Math.exp(-x),u=e*Math.cos(2*x),v=e*Math.sin(2*x);
    return {u,v,up:-u-2*v,vp:2*u-v,upp:-3*u+4*v,vpp:-4*u-3*v};
  }
  function at(s,x=s.x){
    const b=basis(x);
    return {x,...b,y:s.c1*b.u+s.c2*b.v,yp:s.c1*b.up+s.c2*b.vp,
      ypp:s.c1*b.upp+s.c2*b.vpp,envelope:Math.hypot(s.c1,s.c2)*Math.exp(-x)};
  }
  const initial=s=>({value:s.c1,slope:-s.c1+2*s.c2});
  const matchInitial=(value,slope)=>({c1:value,c2:(slope+value)/2});
  const matchesLecture=s=>Math.abs(initial(s).value-2)<1e-9&&Math.abs(initial(s).slope)<1e-9;
  const sample=(s,count=361)=>Array.from({length:count},(_,i)=>at(s,domain[1]*i/(count-1)));
  const plotBound=s=>1.12*Math.max(.4,Math.hypot(s.c1,s.c2),s.basis?1:0);
  function restore(raw){
    const s=fresh();if(raw?.version!==1)return s;
    for(const [k,lo,hi]of [['c1',-3,3],['c2',-3,3],['x',0,6]])if(typeof raw[k]==='number'&&Number.isFinite(raw[k]))s[k]=Math.max(lo,Math.min(hi,raw[k]));
    for(const k of ['basis','envelope'])if(typeof raw[k]==='boolean')s[k]=raw[k];return s;
  }
  return Object.freeze({domain,alpha,beta,fresh,basis,at,initial,matchInitial,matchesLecture,sample,plotBound,restore});
});
