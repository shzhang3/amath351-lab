const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../src/experiment.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// A small event/DOM substitute checks application logic without launching a
// browser. It does not substitute for visual or accessibility inspection.
function harness({ stored = null, storageThrows = false, reduced = false } = {}) {
  const nodes = new Map(), frames = new Map(), resizes = [], storage = new Map();
  let width = 650, height = 410, counter = 0, time = 10;
  if (stored) storage.set('amath351:follow-the-slope:v1', JSON.stringify(stored));
  class Element {
    constructor(id) {
      this.id = id; this.dataset = {}; this.attrs = {}; this.events = {};
      this.hidden = false; this.disabled = false; this.textContent = '';
      this._html = ''; this.captures = new Set(); this.isConnected = true;
    }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    getAttribute(key) { return this.attrs[key]; }
    addEventListener(key, fn) { (this.events[key] ??= []).push(fn); }
    emit(key, extra = {}) {
      const event = { target: this, button: 0, pointerId: 1, preventDefault() {}, ...extra };
      for (const fn of this.events[key] || []) fn(event);
    }
    querySelector(selector) { return nodes.get(selector.slice(1)); }
    querySelectorAll(selector) { return selector === '[data-prediction]' ? choices : []; }
    getBoundingClientRect() { return { left: 0, top: 0, width, height }; }
    setPointerCapture(id) { this.captures.add(id); }
    hasPointerCapture(id) { return this.captures.has(id); }
    releasePointerCapture(id) { this.captures.delete(id); }
    set innerHTML(value) {
      this._html = value;
      for (const match of value.matchAll(/id="([a-zA-Z0-9-]+)"/g)) {
        if (!nodes.has(match[1])) nodes.set(match[1], new Element(match[1]));
      }
    }
    get innerHTML() { return this._html; }
  }
  for (const match of html.matchAll(/id="([a-zA-Z0-9-]+)"/g)) {
    nodes.set(match[1], new Element(match[1]));
  }
  const choices = ['rising', 'falling', 'flat'].map(direction => {
    const element = new Element(direction);
    element.dataset.prediction = direction;
    return element;
  });
  const window = new Element('window'), document = new Element('document');
  document.getElementById = id => nodes.get(id);
  document.hidden = false;
  window.matchMedia = () => ({ matches: reduced });
  window.localStorage = {
    getItem(key) { if (storageThrows) throw Error('Storage unavailable'); return storage.get(key) ?? null; },
    setItem(key, value) { if (storageThrows) throw Error('Storage unavailable'); storage.set(key, value); }
  };
  const context = {
    window, document, console,
    ResizeObserver: class {
      constructor(fn) { this.fn = fn; resizes.push(fn); }
      observe() { this.fn(); }
      disconnect() {}
    },
    requestAnimationFrame(fn) { frames.set(++counter, fn); return counter; },
    cancelAnimationFrame(id) { frames.delete(id); }
  };
  vm.createContext(context);
  new vm.Script(script).runInContext(context);
  const element = id => nodes.get(id);
  const click = id => element(id).emit('click');
  const tick = elapsed => {
    time += elapsed;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(fn => fn(time));
  };
  const change = value => {
    element('al-initial').value = String(value);
    element('al-initial').emit('input'); element('al-initial').emit('change');
  };
  const reveal = () => { click('al-reveal'); tick(1); tick(7000); };
  const pointer = (t, y) => ({
    clientX: 46 + (t + .45) / 5.45 * (width - 60),
    clientY: 24 + (5.5 - y) / 7.5 * (height - 63)
  });
  return {
    element, click, tick, change, reveal, pointer, choices, window, storage,
    resize(w, h) { width = w; height = h; resizes.forEach(fn => fn()); }
  };
}

test('the displayed analytic solution satisfies the IVP and the ODE', () => {
  const expression = script.match(/const solution = (.*);/)[1];
  const solution = vm.runInNewContext('(' + expression + ')');
  for (const y0 of [-1.5, -1, 0, 1, 4]) {
    assert(Math.abs(solution(0, y0) - y0) < 1e-12);
    for (const t of [0, .2, Math.log(2), 2, 5]) {
      const h = 1e-5;
      const derivative = (solution(t + h, y0) - solution(t - h, y0)) / (2 * h);
      assert(Math.abs(derivative - (t - solution(t, y0))) < 1e-8);
    }
  }
});

test('prediction, reveal, pause, resume, and comparison form a complete flow', () => {
  const app = harness(), e = app.element;
  assert.equal(e('al-solution-path').getAttribute('d'), '');
  assert.equal(e('al-keep').disabled, true);
  app.choices[1].emit('click');
  app.click('al-reveal'); app.tick(1); app.tick(1000);
  assert(Number(e('al-plot').dataset.progress) > .15);
  app.click('al-reveal');
  const paused = e('al-plot').dataset.progress;
  app.tick(1500);
  assert.equal(e('al-plot').dataset.progress, paused);
  app.click('al-reveal'); app.tick(1); app.tick(7000);
  assert.equal(e('al-plot').dataset.progress, '1');
  assert.equal(e('al-feedback-title').textContent, 'Your starting direction checks out.');
  app.click('al-keep'); app.change(2);
  assert.equal(e('al-solution-path').getAttribute('d'), '');
  assert(e('al-kept-layer').innerHTML.includes('lab-kept'));
  assert.equal(app.choices[1].getAttribute('aria-pressed'), 'false');
  app.reveal(); app.click('al-keep'); app.change(-1); app.reveal(); app.click('al-keep');
  app.change(3); app.reveal();
  assert.equal(e('al-keep').disabled, true);
  assert.equal(e('al-keep').textContent, 'Three curves kept');
  app.click('al-reset');
  assert.equal(e('al-kept-layer').innerHTML, '');
  assert.equal(e('al-plot').dataset.solutionVisible, 'false');
});

test('pointer inspection, initial dragging, sketching, and resizing keep valid geometry', () => {
  const app = harness(), e = app.element, plot = e('al-plot');
  plot.emit('pointerdown', app.pointer(2, 1)); plot.emit('pointerup', app.pointer(2, 1));
  assert(e('al-probe-readout').textContent.includes('y′ = 1.00'));
  plot.emit('pointerdown', app.pointer(0, 1));
  plot.emit('pointermove', app.pointer(0, 3)); plot.emit('pointerup', app.pointer(0, 3));
  assert.equal(plot.dataset.y0, '3');
  app.click('al-draw');
  plot.emit('pointerdown', app.pointer(0, 3));
  plot.emit('pointermove', app.pointer(1, 1));
  plot.emit('pointermove', app.pointer(3, 2)); plot.emit('pointerup', app.pointer(3, 2));
  assert(e('al-sketch-path').getAttribute('d').includes('L'));
  app.click('al-erase');
  assert.equal(e('al-sketch-path').getAttribute('d'), '');
  e('al-zero').checked = true; e('al-zero').emit('change');
  assert(e('al-zero-layer').innerHTML.includes('y = t'));
  app.reveal(); app.resize(292, 340);
  assert(!plot.innerHTML.includes('NaN'));
  assert(!e('al-solution-path').getAttribute('d').includes('NaN'));
});

test('state restores across reloads, and storage failure does not break the experiment', () => {
  const app = harness();
  app.change(2.2); app.reveal(); app.click('al-keep');
  const snapshot = JSON.parse(app.storage.get('amath351:follow-the-slope:v1'));
  const restored = harness({ stored: snapshot });
  assert.equal(restored.element('al-plot').dataset.y0, '2.2');
  assert.equal(restored.element('al-plot').dataset.solutionVisible, 'true');
  assert(restored.element('al-kept-layer').innerHTML.includes('lab-kept'));
  const unavailable = harness({ storageThrows: true });
  unavailable.change(-1); unavailable.reveal();
  assert.equal(unavailable.element('al-plot').dataset.progress, '1');
});

test('reduced-motion mode reveals the entire curve without animation', () => {
  const app = harness({ reduced: true });
  app.click('al-reveal');
  assert.equal(app.element('al-plot').dataset.progress, '1');
  assert.equal(app.element('al-reveal').textContent, 'Replay the solution');
});
