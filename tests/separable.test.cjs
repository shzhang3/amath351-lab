const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../src/separable-model.cjs');
const html = fs.readFileSync(path.join(__dirname, '../src/separable.html'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];

test('the area identity includes the initial condition and solves y prime = t*y', () => {
  assert.equal(model.solution(0),1);
  for (const t of [0,.2,.7,1.2,2]) {
    assert(Math.abs(model.stateArea(model.solution(t))-model.timeArea(t))<1e-12);
    const h=1e-5;
    assert(Math.abs((model.solution(t+h)-model.solution(t-h))/(2*h)-t*model.solution(t))<1e-7);
  }
  assert.equal(model.matches(1.2,1.5),false);
  assert.equal(model.matches(1.2,2.054),true);
});

test('restoration rejects invalid and nonmatching points and bounds the collection', () => {
  const points=Array.from({length:30},(_,i)=>({t:(i+1)/20,y:model.solution((i+1)/20)}));
  const state=model.restore({version:1,t:200,y:-2,points:[null,{t:1,y:7},{t:NaN,y:2},...points],revealed:true});
  assert.equal(state.t,2);assert.equal(state.y,1);assert.equal(state.points.length,12);
  assert(state.points.every(p=>model.matches(p.t,p.y)));
  assert.deepEqual(model.restore({version:9}),model.fresh());
});

// Event and generated-geometry checks, not browser layout checks.
function harness({stored=null,storageThrows=false,reduced=false}={}) {
  const nodes=new Map(),frames=new Map(),storage=new Map(),resizes=[];
  let width=440,time=0,counter=0;
  if(stored)storage.set('amath351:separable:v1',JSON.stringify(stored));
  class Element {
    constructor(id){this.id=id;this.attrs={};this.dataset={};this.events={};this.innerHTML='';this.textContent='';}
    setAttribute(key,value){this.attrs[key]=String(value);}
    addEventListener(key,fn){(this.events[key]??=[]).push(fn);}
    emit(key,extra={}){for(const fn of this.events[key]||[])fn({target:this,...extra});}
    querySelector(selector){return nodes.get(selector.slice(1));}
    getBoundingClientRect(){return {width};}
  }
  for(const match of html.matchAll(/id="([a-zA-Z0-9-]+)"/g))nodes.set(match[1],new Element(match[1]));
  const document=new Element('document'),window=new Element('window');
  document.getElementById=id=>nodes.get(id);
  window.matchMedia=()=>({matches:reduced});
  window.localStorage={getItem(key){if(storageThrows)throw Error();return storage.get(key)||null;},setItem(key,value){if(storageThrows)throw Error();storage.set(key,value);}};
  const context=vm.createContext({window,document,Amath351Separable:model,
    ResizeObserver:class{constructor(fn){resizes.push(fn);}observe(){resizes.at(-1)();}},
    requestAnimationFrame(fn){frames.set(++counter,fn);return counter;},cancelAnimationFrame(id){frames.delete(id);}});
  new vm.Script(script).runInContext(context);
  return {
    element:id=>nodes.get(id),click:id=>nodes.get(id).emit('click'),document,window,storage,
    input(id,value){nodes.get(id).value=String(value);nodes.get(id).emit('input');nodes.get(id).emit('change');},
    tick(count=5){for(let i=0;i<count;i++){time+=100;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(time));}},
    resize(w){width=w;resizes.forEach(fn=>fn());},frames:()=>frames.size
  };
}

test('manual and automatic matching, point collection, formula reveal, and reset work together', () => {
  const app=harness(),e=app.element;
  assert.equal(e('sep-keep').disabled,true);
  app.input('sep-value',2.054);assert.equal(e('sep-keep').disabled,false);
  app.click('sep-keep');assert.equal(e('sep-count').textContent,'1 / 12 kept');
  app.input('sep-time',.6);assert.equal(e('sep-keep').disabled,true);
  app.click('sep-match');assert.equal(e('sep-keep').disabled,true);app.tick();
  assert.equal(e('sep-status').textContent,'Areas equal.');app.click('sep-keep');
  assert.equal(e('sep-count').textContent,'2 / 12 kept');
  assert(!e('sep-solution-plot').innerHTML.includes('id="sep-exact-curve"'));
  app.click('sep-reveal');assert.equal(e('sep-formula').hidden,false);
  assert(e('sep-solution-plot').innerHTML.includes('id="sep-exact-curve"'));
  app.click('sep-reveal');assert.equal(e('sep-formula').hidden,true);
  app.input('sep-time',0);app.click('sep-match');app.tick();assert.equal(e('sep-keep').disabled,true);
  app.click('sep-reset');assert.equal(e('sep-count').textContent,'0 / 12 kept');assert.equal(e('sep-t').textContent,'1.20');
});

test('the collection persists, duplicate times update, and narrow layouts produce finite paths', () => {
  const app=harness({reduced:true});
  for(let i=1;i<=12;i++){app.input('sep-time',i/10);app.click('sep-match');app.click('sep-keep');}
  app.input('sep-time',1.4);app.click('sep-match');assert.equal(app.element('sep-keep').disabled,true);
  app.input('sep-time',.4);app.click('sep-match');assert.equal(app.element('sep-keep').disabled,false);app.click('sep-keep');
  assert.equal(app.element('sep-count').textContent,'12 / 12 kept');
  const restored=harness({stored:JSON.parse(app.storage.get('amath351:separable:v1'))});
  assert.equal(restored.element('sep-count').textContent,'12 / 12 kept');
  restored.resize(240);
  for(const id of ['sep-time-plot','sep-state-plot','sep-solution-plot'])assert(!/NaN|Infinity/.test(restored.element(id).innerHTML));
  restored.click('sep-clear');assert.equal(restored.element('sep-count').textContent,'0 / 12 kept');
});

test('storage failures, interrupted matching, and reduced motion preserve a usable state', () => {
  const app=harness({storageThrows:true});app.click('sep-match');app.tick(2);
  app.input('sep-time',.5);assert.equal(app.frames(),0);
  app.click('sep-match');app.document.hidden=true;app.document.emit('visibilitychange');
  assert.equal(app.frames(),0);assert.equal(app.element('sep-status').textContent,'Areas equal.');
  const reduced=harness({reduced:true});reduced.click('sep-match');
  assert.equal(reduced.frames(),0);assert.equal(reduced.element('sep-keep').disabled,false);
});
