(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.UndeterminedModel=factory();
})(globalThis,function(){
  const domain=[-.5,.5];
  const equations=Object.freeze({
    simple:{b:-3,c:-4,required:1,coefficient:3/5},
    repeated:{b:-8,c:16,required:2,coefficient:3/2}
  });
  const fresh=(equation='simple')=>({equation,n:0,A:1,x:0,compare:true});
  function at(s,x=s.x,n=s.n){
    const e=Math.exp(4*x),q=[1,x,x*x][n],qp=[0,1,2*x][n],qpp=[0,0,2][n];
    const {b,c}=equations[s.equation];
    return {x,y:s.A*q*e,yp:s.A*(qp+4*q)*e,ypp:s.A*(qpp+8*qp+16*q)*e,
      output:s.A*(qpp+(8+b)*qp+(16+4*b+c)*q)*e,target:3*e};
  }
  const sample=(s,n=s.n,count=241)=>Array.from({length:count},(_,i)=>at(s,domain[0]+(domain[1]-domain[0])*i/(count-1),n));
  const matchingA=s=>s.n===equations[s.equation].required?equations[s.equation].coefficient:null;
  const matches=s=>matchingA(s)!==null&&Math.abs(s.A-matchingA(s))<1e-9;
  function bounds(s,field){
    let lo=0,hi=0;
    for(const n of [0,1,2])for(const p of sample(s,n)){
      lo=Math.min(lo,p[field]);hi=Math.max(hi,p[field]);
      if(field==='output')hi=Math.max(hi,p.target);
    }
    const pad=.1*Math.max(1,hi-lo);return [lo-pad,hi+pad];
  }
  function restore(raw){
    const s=fresh();if(raw?.version!==1)return s;
    if(Object.hasOwn(equations,raw.equation))s.equation=raw.equation;
    if(Number.isInteger(raw.n)&&raw.n>=0&&raw.n<=2)s.n=raw.n;
    for(const [k,lo,hi]of [['A',-2,2],['x',...domain]])if(typeof raw[k]==='number'&&Number.isFinite(raw[k]))s[k]=Math.max(lo,Math.min(hi,raw[k]));
    if(typeof raw.compare==='boolean')s.compare=raw.compare;return s;
  }
  return Object.freeze({domain,equations,fresh,at,sample,matchingA,matches,bounds,restore});
});
