// Lecture 05, Section 1.5 Problem 14: x*y' - 3*y = x^3, y(1) = b.
(function(root){
  const nonzero=x=>Number.isFinite(x)&&x!==0;
  const slope=(x,y)=>nonzero(x)?3*y/x+x*x:null;
  const solution=(x,b=10)=>nonzero(x)?x*x*x*(Math.log(Math.abs(x))+b):null;
  // x^-3 is a valid integrating factor on either interval. On x < 0 it
  // differs from exp(-3 ln|x|) by the nonzero constant -1.
  const factor=x=>nonzero(x)?1/(x*x*x):null;
  const transformed=(x,b=10)=>nonzero(x)?Math.log(Math.abs(x))+b:null;
  const transformedSlope=x=>nonzero(x)?1/x:null;
  const fresh=()=>({stage:0,initial:10,left:10,x:1});
  function restore(raw){
    const s=fresh();if(raw?.version!==1)return s;
    if(Number.isInteger(raw.stage))s.stage=Math.max(0,Math.min(2,raw.stage));
    if(Number.isFinite(raw.initial))s.initial=Math.round(Math.max(-4,Math.min(12,raw.initial))*2)/2;
    if(Number.isFinite(raw.left))s.left=Math.round(Math.max(-4,Math.min(12,raw.left))*2)/2;
    if(Number.isFinite(raw.x))s.x=(raw.x<0?-1:1)*Math.max(.05,Math.min(2,Math.abs(raw.x)));
    return s;
  }
  // Dense geometric samples near zero, without ever evaluating at zero.
  const samples=(side=1)=>Array.from({length:601},(_,i)=>(side<0?-1:1)*Math.exp(Math.log(1e-7)+(Math.log(2)-Math.log(1e-7))*(side<0?600-i:i)/600));
  const api=Object.freeze({slope,solution,factor,transformed,transformedSlope,fresh,restore,samples});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Amath351IntegratingFactor=api;
})(globalThis);
