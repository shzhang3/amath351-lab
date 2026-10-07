// Exact, domain-aware curves for the three equations in Lecture 04.
(function(root){
  const pi=Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const polynomial=x=>x*x*x+2*x*x+2*x;
  const configs=Object.freeze({
    gaussian:Object.freeze({name:'Problem 1 · A family of bell-shaped curves',xmin:-3,xmax:3,ymin:-3,ymax:3,x0:0,y0:2,
      equation:'y′ + 2xy = 0',field:'y′ = −2xy',source:'Lecture 04 · page 3 · Section 1.4, Problem 1',
      domain:'The slope is defined for every real x and y.',
      prompt:'Where are the tangents horizontal? Predict how a solution changes on either side of x = 0.',
      slope:(x,y)=>-2*x*y,valid:()=>true}),
    radical:Object.freeze({name:'Problem 5 · Remember the constant solutions',xmin:-.5,xmax:9,ymin:-1.4,ymax:1.4,x0:1,y0:0,
      equation:'2√x · y′ = √(1 − y²)',field:'y′ = √(1 − y²) / (2√x)',source:'Lecture 04 · pages 7, 11–12 · Section 1.4, Problem 5',
      domain:'For the explicit slope field: x > 0 and −1 ≤ y ≤ 1. The shaded region has no real, defined slope.',
      prompt:'Every slope is nonnegative. Can a valid solution ever turn downward? What happens at y = ±1?',
      slope:(x,y)=>x>0&&Math.abs(y)<=1?Math.sqrt(Math.max(0,1-y*y))/(2*Math.sqrt(x)):null,
      valid:(x,y)=>x>0&&Math.abs(y)<=1}),
    implicit:Object.freeze({name:'Implicit example · Let the initial value choose a branch',xmin:-3,xmax:2.5,ymin:-6,ymax:8,x0:0,y0:-1,
      equation:'y′ = (3x² + 4x + 2) / (2(y − 1))',field:'y′ = (3x² + 4x + 2) / (2(y − 1))',source:'Lecture 04 · pages 13, 18 · Implicit solution and y(0) = −1',
      domain:'The slope is undefined on y = 1. Neither a solution nor its initial point can lie on that line.',
      prompt:'The implicit relation has two branches. Which one passes through the initial point, and where must it stop?',
      slope:(x,y)=>y!==1?(3*x*x+4*x+2)/(2*(y-1)):null,valid:(_x,y)=>y!==1})
  });
  const ids=Object.keys(configs);
  const fresh=(id='gaussian')=>({example:ids.includes(id)?id:'gaussian',x0:configs[ids.includes(id)?id:'gaussian'].x0,y0:configs[ids.includes(id)?id:'gaussian'].y0,revealed:false,extras:false,density:17});
  function restore(raw){
    if(raw?.version!==1||!ids.includes(raw.example))return fresh();
    const s=fresh(raw.example),c=configs[s.example];
    for(const k of ['x0','y0'])if(Number.isFinite(raw[k]))s[k]=clamp(raw[k],c[k[0]+'min'],c[k[0]+'max']);
    s.revealed=raw.revealed===true;s.extras=raw.extras===true;
    if(Number.isFinite(raw.density))s.density=2*Math.round((clamp(raw.density,9,25)-1)/2)+1;
    return s;
  }
  // P is strictly increasing because P'(x) = 3(x + 2/3)^2 + 2/3 > 0.
  function leftEndpoint(C){
    let lo=-1,hi=1;
    while(polynomial(lo)+C>0)lo*=2;
    while(polynomial(hi)+C<0)hi*=2;
    for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(polynomial(mid)+C>0)hi=mid;else lo=mid;}
    return (lo+hi)/2;
  }
  function solution(id,x0,y0){
    const c=configs[id];
    if(!c||!Number.isFinite(x0)||!Number.isFinite(y0)||!c.valid(x0,y0))return null;
    if(id==='gaussian')return {value:x=>y0*Math.exp(x0*x0-x*x),alternate:null,left:-Infinity,right:Infinity,C:y0*Math.exp(x0*x0)};
    if(id==='radical'){
      const C=Math.asin(y0)-Math.sqrt(x0);
      const passage=x=>x>0?Math.sin(clamp(Math.sqrt(x)+C,-pi/2,pi/2)):null;
      const boundary=Math.abs(y0)===1;
      return {value:boundary?(x=>x>0?y0:null):passage,alternate:boundary?passage:null,left:0,right:Infinity,C,
        lowerJoin:-pi/2-C>0?(-pi/2-C)**2:null,upperJoin:(pi/2-C)**2};
    }
    const C=(y0-1)**2-polynomial(x0),left=leftEndpoint(C),sign=Math.sign(y0-1);
    const value=(x,s)=>x>left&&polynomial(x)+C>0?1+s*Math.sqrt(polynomial(x)+C):null;
    return {value:x=>value(x,sign),alternate:x=>value(x,-sign),left,right:Infinity,C,sign};
  }
  function sample(fn,left,right,count=700){
    return Array.from({length:count+1},(_,i)=>{const x=left+(right-left)*i/count;return{x,y:fn(x)};});
  }
  const api=Object.freeze({configs,ids,fresh,restore,polynomial,leftEndpoint,solution,sample});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Amath351SeparableExamples=api;
})(globalThis);
