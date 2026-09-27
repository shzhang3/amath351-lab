const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { strain, particleAt, velocityAt, blowupAt } = require('../src/prologue-model.cjs');
const html = fs.readFileSync(path.join(__dirname, '../src/prologue.html'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];

test('particle trajectories satisfy the initial data and all three velocity equations', () => {
  for (const radius of [.4, 1.1, 1.4]) for (const z of [-.2, 0, .2]) for (const omega of [0, 2, 3]) {
    const seed = { radius, angle: .7, z };
    const initial = particleAt(seed, 0, omega);
    assert(Math.abs(Math.hypot(initial.x, initial.y) - radius) < 1e-12);
    assert.equal(initial.z, z);
    for (const t of [0, 1.5, 3]) {
      const point = particleAt(seed, t, omega), expected = velocityAt(point, omega), h = 1e-5;
      const before = particleAt(seed, t - h, omega), after = particleAt(seed, t + h, omega);
      for (const axis of ['x', 'y', 'z']) assert(Math.abs((after[axis] - before[axis]) / (2 * h) - expected[axis]) < 1e-8);
    }
  }
});

test('the velocity is divergence-free and the flow preserves volume', () => {
  const point = { x: .8, y: -.6, z: .2 }, h = 1e-5;
  let divergence = 0;
  for (const axis of ['x', 'y', 'z']) {
    divergence += (velocityAt({ ...point, [axis]: point[axis] + h }, 2)[axis] -
      velocityAt({ ...point, [axis]: point[axis] - h }, 2)[axis]) / (2 * h);
  }
  assert(Math.abs(divergence) < 1e-9);
  for (const t of [0, 1, 3]) assert(Math.abs(Math.exp(-strain * t) ** 2 * Math.exp(2 * strain * t) - 1) < 1e-12);
  assert.equal(particleAt({ radius: 1, angle: 0, z: 0 }, 3, 2).z, 0);
});

test('the scalar model obeys y prime = y squared and excludes the disconnected branch', () => {
  assert.equal(blowupAt(0), 1);
  for (const t of [0, .25, .5, .9, .99]) {
    const h = 1e-7;
    const derivative = (blowupAt(t + h) - blowupAt(t - h)) / (2 * h);
    assert(Math.abs(derivative / blowupAt(t) ** 2 - 1) < 1e-7);
  }
  assert(Math.abs(blowupAt(.99) - 100) < 1e-10);
  assert.equal(blowupAt(1), null);
  assert.equal(blowupAt(1.2), null);
});

// Event-level checks only: this is deliberately not a browser or layout test.
function harness({ reduced = false } = {}) {
  const nodes = new Map(), frames = new Map();
  let time = 0, counter = 0, focused = null;
  class Element {
    constructor(id) { this.id = id; this.dataset = {}; this.attrs = {}; this.events = {}; this.textContent = ''; this.innerHTML = ''; }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    getAttribute(key) { return this.attrs[key]; }
    removeAttribute(key) { delete this.attrs[key]; }
    addEventListener(key, fn) { (this.events[key] ??= []).push(fn); }
    emit(key, extra = {}) { for (const fn of this.events[key] || []) fn({ target: this, preventDefault() {}, ...extra }); }
    querySelector(selector) { return nodes.get(selector.slice(1)); }
    querySelectorAll() { return []; }
    focus() { focused = this.id; }
    scrollIntoView() {}
  }
  for (const match of html.matchAll(/id="([a-zA-Z0-9-]+)"/g)) nodes.set(match[1], new Element(match[1]));
  const document = new Element('document'), window = new Element('window');
  document.getElementById = id => nodes.get(id);
  window.matchMedia = () => ({ matches: reduced });
  const context = vm.createContext({
    document, window, Amath351Intro: { particleAt, velocityAt, blowupAt },
    requestAnimationFrame(fn) { frames.set(++counter, fn); return counter; },
    cancelAnimationFrame(id) { frames.delete(id); }
  });
  new vm.Script(script).runInContext(context);
  return {
    element: id => nodes.get(id), click: id => nodes.get(id).emit('click'), document,
    input(id, value) { nodes.get(id).value = String(value); nodes.get(id).emit('input'); },
    tick(count) {
      for (let i = 0; i < count; i++) {
        time += 100;
        const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(time));
      }
    },
    frames: () => frames.size, focused: () => focused,
    markup: () => [...nodes.values()].map(e => e.innerHTML + Object.values(e.attrs).join(' ')).join(' ')
  };
}

test('playback, pause, scrubbing, starting heights, and rotation controls stay consistent', () => {
  const app = harness(), e = app.element;
  app.click('ai-flow-play'); app.tick(12);
  assert(Number(e('ai-flow-plot').dataset.time) > .5);
  app.click('ai-flow-play');
  const paused = e('ai-flow-plot').dataset.time;
  app.tick(10); assert.equal(e('ai-flow-plot').dataset.time, paused);
  app.input('ai-flow-time', 3);
  assert.equal(e('ai-flow-play').textContent, 'Replay motion');
  assert(Number(e('ai-radius-now').textContent) < 1.1);
  app.click('ai-midplane'); app.input('ai-flow-time', 3);
  assert.equal(e('ai-height-now').textContent, '0.00');
  app.click('ai-below'); app.input('ai-flow-time', 3);
  assert(e('ai-height-now').textContent.startsWith('−'));
  app.input('ai-rotation', 0); app.input('ai-flow-time', 3);
  assert.equal(e('ai-turns-now').textContent, '0.00');
  app.input('ai-radius', 1.4);
  assert.equal(e('ai-flow-plot').dataset.time, '0');
  app.click('ai-flow-reset');
  assert.equal(e('ai-above').getAttribute('aria-pressed'), 'true');
  assert.equal(e('ai-radius-now').textContent, '1.10');
  assert(!/NaN|Infinity/.test(app.markup()));
});

test('changing chapters or hiding the page stops animation and tabs support keyboard navigation', () => {
  const app = harness(), e = app.element;
  app.click('ai-flow-play'); app.tick(5);
  app.click('ai-tab-blowup');
  assert.equal(app.frames(), 0);
  assert.equal(e('ai-flow').hidden, true);
  assert.equal(e('ai-blowup').hidden, false);
  assert.equal(e('ai-tab-blowup').getAttribute('aria-selected'), 'true');
  e('ai-tab-blowup').emit('keydown', { key: 'ArrowLeft' });
  assert.equal(app.focused(), 'ai-tab-flow');
  app.click('ai-next');
  assert.equal(app.focused(), 'ai-tab-blowup');
  app.click('ai-blowup-play'); app.tick(5);
  app.document.hidden = true; app.document.emit('visibilitychange');
  assert.equal(app.frames(), 0);
});

test('blowup stops before the singular time and shows the actual value above the plot limit', () => {
  const app = harness(), e = app.element;
  app.click('ai-tab-blowup'); app.click('ai-blowup-play'); app.tick(100);
  assert.equal(e('ai-blowup-plot').dataset.time, '0.99');
  assert.equal(e('ai-b-value-now').textContent, '100.00');
  assert.equal(e('ai-b-left-now').textContent, '0.01');
  assert(e('ai-blowup-marker').innerHTML.includes('100.00'));
  assert.equal(app.frames(), 0);
  const curve = e('ai-blowup-curve').getAttribute('d');
  const end = curve.split('L').at(-1).split(',').map(Number);
  assert(Math.abs(end[0] - (56 + .875 / 1.15 * 580)) < .01);
  assert.equal(end[1], 30);
  e('ai-compare').checked = true; e('ai-compare').emit('change');
  assert.equal(e('ai-exp-curve').getAttribute('display'), 'inline');
  app.click('ai-blowup-reset');
  assert.equal(e('ai-b-value-now').textContent, '1.00');
  assert.equal(e('ai-exp-curve').getAttribute('display'), 'none');
  assert(!/NaN|Infinity/.test(app.markup()));
});

test('reduced motion advances in discrete steps without starting an animation', () => {
  const app = harness({ reduced: true });
  app.click('ai-flow-play');
  assert.equal(app.element('ai-flow-plot').dataset.time, '0.5');
  app.click('ai-tab-blowup'); app.click('ai-blowup-play');
  assert.equal(app.element('ai-blowup-plot').dataset.time, '0.1');
  assert.equal(app.frames(), 0);
});
