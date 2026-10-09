// Lecture 05, Section 1.5 Problem 14: x*y' - 3*y = x^3, y(1) = b.
(function(root){
  const positive=x=>Number.isFinite(x)&&x>0;
  const slope=(x,y)=>positive(x)?3*y/x+x*x:null;
  const solution=(x,b=10)=>positive(x)?x*x*x*(Math.log(x)+b):null;
  const factor=x=>positive(x)?1/(x*x*x):null;
  const transformed=(x,b=10)=>positive(x)?Math.log(x)+b:null;
  const transformedSlope=x=>positive(x)?1/x:null;
  const fresh=()=>({stage:0,initial:10,x:1});
  function restore(raw){
    const s=fresh();if(raw?.version!==1)return s;
    if(Number.isInteger(raw.stage))s.stage=Math.max(0,Math.min(2,raw.stage));
    if(Number.isFinite(raw.initial))s.initial=Math.round(Math.max(-4,Math.min(12,raw.initial))*2)/2;
    if(Number.isFinite(raw.x))s.x=Math.max(.05,Math.min(2,raw.x));
    return s;
  }
  // Dense geometric samples near zero, without ever evaluating at zero.
  const samples=()=>Array.from({length:601},(_,i)=>Math.exp(Math.log(1e-7)+(Math.log(2)-Math.log(1e-7))*i/600));
  const api=Object.freeze({slope,solution,factor,transformed,transformedSlope,fresh,restore,samples});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Amath351IntegratingFactor=api;
})(globalThis);
