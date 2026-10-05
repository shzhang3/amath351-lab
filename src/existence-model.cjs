// Analytic curves and finite tangent steps used to illustrate the local theorem.
(function (root) {
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const regular=(x,b=1)=>x-1+(b+1)*Math.exp(-x);
  const branch=(x,c=0)=>Math.max(0,x-c)**3;
  const branchSlope=(_x,y)=>3*Math.cbrt(y)**2;
  const fresh=()=>({mode:'existence',progress:0,h:.65,offset:.2,delay:.4});
  function comparison(x,offset){
    const yA=regular(x),yB=regular(x,1+offset),mA=x-yA,mB=x-yB;
    const distance=Math.abs(yB-yA),slopeGap=Math.abs(mB-mA),L=1;
    return {x,yA,yB,mA,mB,distance,slopeGap,L,bound:L*distance,ratio:distance>0?slopeGap/distance:null};
  }
  function restore(raw){
    const s=fresh();
    if(raw?.version!==1)return s;
    if(['existence','uniqueness','branching'].includes(raw.mode))s.mode=raw.mode;
    for(const [key,min,max] of [['progress',0,1],['h',.15,.75],['offset',-.2,.2],['delay',.15,.75]])
      if(Number.isFinite(raw[key]))s[key]=clamp(raw[key],min,max);
    return s;
  }
  function polygon(h,n){
    const side=sign=>{
      const points=[{x:0,y:1}],dx=sign*h/n;
      for(let i=0;i<n;i++){
        const p=points.at(-1);
        points.push({x:(i+1)*dx,y:p.y+dx*(p.x-p.y)});
      }
      return points;
    };
    return side(-1).reverse().concat(side(1).slice(1));
  }
  function existence(progress,h){
    const p=clamp(progress,0,1);
    const phase=p<.15?0:p<.45?1:p<.9?2:3;
    const n=phase<2?1:phase===3?64:2**Math.min(6,Math.floor((p-.45)/.45*7));
    const points=polygon(h,n);
    return {phase,n,points,reach:phase===0?0:phase===1?h*(p-.15)/.3:h,
      error:Math.max(...points.map(p=>Math.abs(p.y-regular(p.x))))};
  }
  const api=Object.freeze({regular,branch,branchSlope,fresh,restore,polygon,existence,comparison});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.Amath351Existence=api;
})(globalThis);
