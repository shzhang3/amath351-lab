(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.VectorAreaModel=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const presets={acute:55,obtuse:130,negative:-55,perpendicular:90,parallel:0};
  const fresh=()=>({r:2.5,s:2.3,alpha:25,theta:55});
  const clean=v=>Math.abs(v)<1e-12?0:v;
  const rad=v=>v*Math.PI/180;
  const rotate=(p,degrees)=>{const c=Math.cos(rad(degrees)),s=Math.sin(rad(degrees));return [clean(p[0]*c-p[1]*s),clean(p[0]*s+p[1]*c)];};
  const cross=(u,v)=>clean(u[0]*v[1]-u[1]*v[0]);
  function geometry(state){
    const {r,s,alpha,theta}=state,t=rad(theta),projection=clean(s*Math.cos(t)),signedHeight=clean(s*Math.sin(t));
    const aligned={O:[0,0],A:[r,0],B:[projection,signedHeight],H:[projection,0],C:[r+projection,signedHeight]};
    const original=Object.fromEntries(Object.entries(aligned).map(([name,p])=>[name,rotate(p,alpha)]));
    const center=[aligned.C[0]/2,aligned.C[1]/2];
    const radius=Math.max(...Object.values(aligned).map(p=>Math.hypot(p[0]-center[0],p[1]-center[1])))+.45;
    const signedArea=cross(original.A,original.B),height=Math.abs(signedHeight);
    const magnitude=Math.abs(theta),phi=Math.min(magnitude,180-magnitude);
    const kind=height===0?'parallel':projection===0?'perpendicular':projection<0?'obtuse':'acute';
    return {original,aligned,center,radius,signedArea,area:Math.abs(signedArea),height,signedHeight,projection,phi,kind,beta:alpha+theta};
  }
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const wrap=v=>{const n=((v+180)%360+360)%360-180;return n===-180?180:n;};
  function drag(state,which,point){
    if(Math.hypot(...point)<1e-8)return {...state};
    const angle=Math.atan2(point[1],point[0])*180/Math.PI,length=clamp(Math.hypot(...point),.75,3);
    if(which==='A')return {...state,r:length,alpha:angle,theta:wrap(state.alpha+state.theta-angle)};
    return {...state,s:length,theta:wrap(angle-state.alpha)};
  }
  function restore(saved){
    const state=fresh();if(!saved||saved.version!==1)return state;
    for(const [key,lo,hi]of [['r',.75,3],['s',.75,3],['alpha',-180,180],['theta',-180,180]]){
      if(Number.isFinite(saved[key]))state[key]=clamp(saved[key],lo,hi);
    }
    return state;
  }
  return {presets,fresh,clean,rad,rotate,cross,geometry,drag,restore};
});
