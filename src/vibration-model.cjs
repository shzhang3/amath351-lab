// Exact free mass-spring-damper motion, measured from equilibrium.
(function (root) {
  const bounds={m:[.5,3],k:[1,9],c:[0,24],x0:[-2,2],v0:[-4,4],time:[0,12]};
  const defaults={m:1,k:4,c:0,x0:1,v0:0,time:0,compare:false};
  const fresh=()=>({...defaults});
  const critical=s=>2*Math.sqrt(s.m*s.k);
  const dampingFor=(s,kind)=>({undamped:0,underdamped:critical(s)/4,critical:critical(s),overdamped:2*critical(s)})[kind];
  function coefficients(s){
    const p=s.c/(2*s.m),w2=s.k/s.m,disc=p*p-w2;
    const criticalCase=Math.abs(disc)<=1e-12*Math.max(1,w2,p*p);
    const kind=s.c===0?'undamped':criticalCase?'critical':disc<0?'underdamped':'overdamped';
    let roots;
    if(disc<0&&!criticalCase){const q=Math.sqrt(-disc);roots=[{re:-p,im:q},{re:-p,im:-q}];}
    else if(criticalCase)roots=[{re:-p,im:0},{re:-p,im:0}];
    else{const q=Math.sqrt(disc);roots=[{re:-w2/(p+q),im:0},{re:-p-q,im:0}];}
    return {p,w2,disc,kind,roots,critical:critical(s),period:2*Math.PI/Math.sqrt(w2)};
  }
  function at(s,t){
    const g=coefficients(s),{p,w2,disc,kind}=g;
    let C,S;
    if(kind==='critical'){const e=Math.exp(-p*t);C=e;S=t*e;}
    else if(disc<0){
      const q=Math.sqrt(-disc),u=q*t,e=Math.exp(-p*t);
      C=e*Math.cos(u);S=e*(Math.abs(u)<1e-5?t*(1-u*u/6+u**4/120):Math.sin(u)/q);
    }else{
      const q=Math.sqrt(disc),slow=Math.exp(g.roots[0].re*t),fast=Math.exp(g.roots[1].re*t);
      C=(slow+fast)/2;S=slow*(-Math.expm1(-2*q*t))/(2*q);
    }
    const x=t===0?s.x0:s.x0*C+(s.v0+p*s.x0)*S;
    const v=t===0?s.v0:s.v0*C-(p*s.v0+w2*s.x0)*S;
    return {t,x,v,a:-(s.c*v+s.k*x)/s.m,energy:(s.m*v*v+s.k*x*x)/2};
  }
  function sample(s,count=481){return Array.from({length:count},(_,i)=>at(s,12*i/(count-1)));}
  // The energy bound keeps one shared spatial scale while c changes.
  const amplitudeBound=s=>Math.sqrt(s.x0*s.x0+s.m/s.k*s.v0*s.v0);
  function restore(raw){
    const s=fresh();if(raw?.version!==1)return s;
    for(const [key,[lo,hi]]of Object.entries(bounds))if(typeof raw[key]==='number'&&Number.isFinite(raw[key]))s[key]=Math.max(lo,Math.min(hi,raw[key]));
    s.compare=raw.compare===true;return s;
  }
  const M=Object.freeze({bounds,fresh,critical,dampingFor,coefficients,at,sample,amplitudeBound,restore});
  if(typeof module==='object'&&module.exports)module.exports=M;else root.VibrationModel=M;
})(globalThis);
