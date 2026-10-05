// Exact reference curves and tangent-step approximations for Section 1.3.
(function (root) {
  const configurations = Object.freeze({
    minus: Object.freeze({xmin:0, xmax:4, y0max:3, target:4, initial:1,
      slope:(x,y)=>x-y, solution:(x,y0)=>x-1+(y0+1)*Math.exp(-x)}),
    plus: Object.freeze({xmin:-4, xmax:1, y0max:1, target:-4, initial:0,
      slope:(x,y)=>x+y, solution:(x,y0)=>(y0+1)*Math.exp(x)-x-1})
  });
  const fresh = () => ({stage:0,equation:'minus',probeX:0,probeY:1,y0:1,time:0,count:9,gridCount:9,h:.5,steps:0,exact:false});
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  function restore(raw) {
    const state=fresh();
    if(raw?.version!==1)return state;
    if(Object.hasOwn(configurations,raw.equation))state.equation=raw.equation;
    const c=configurations[state.equation];
    state.y0=state.probeY=c.initial;
    if(Number.isFinite(raw.stage))state.stage=clamp(Math.round(raw.stage),0,4);
    for(const [key,min,max] of [['probeX',c.xmin,c.xmax],['probeY',-2,4],['y0',-1,c.y0max],['time',c.xmin,c.xmax],['count',3,31]]){
      if(Number.isFinite(raw[key]))state[key]=clamp(raw[key],min,max);
    }
    state.count=2*Math.round((state.count-3)/2)+3;
    if(Number.isFinite(raw.gridCount))state.gridCount=2*Math.round((clamp(raw.gridCount,5,25)-5)/2)+5;
    if([.5,.25,.1,.05].includes(raw.h))state.h=raw.h;
    if(Number.isFinite(raw.steps))state.steps=clamp(Math.round(raw.steps),0,Math.round(Math.abs(c.target)/state.h));
    state.exact=raw.exact===true;
    return state;
  }
  function approximation(equation,y0,stepSize,steps) {
    const c=configurations[equation],h=Math.sign(c.target)*stepSize,points=[{x:0,y:y0}];
    for(let i=0;i<steps;i++){
      const p=points.at(-1);
      points.push({x:(i+1)*h,y:p.y+h*c.slope(p.x,p.y)});
    }
    return points;
  }
  const model=Object.freeze({configurations,fresh,restore,approximation});
  if(typeof module==='object'&&module.exports)module.exports=model;
  else root.Amath351SlopeFields=model;
})(globalThis);
