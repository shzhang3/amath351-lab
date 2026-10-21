const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Event/DOM substitute, not a layout test. Range setters include the step
// rounding that real browsers apply; plain string properties miss playback bugs.
module.exports = function harness(name, prefix, modelName, model, {reduced = false} = {}) {
  const html = fs.readFileSync(path.join(__dirname, '../src', name + '.html'), 'utf8');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  const nodes = new Map(), frames = new Map(), presets = [], eulerRows = [];
  let now = 1000, frameId = 0;
  class Element {
    constructor(attrs = {}) {
      this.attrs = attrs; this.events = {}; this.dataset = {};
      this.innerHTML = ''; this.textContent = ''; this.checked = false;
      this.classList = {toggle() {}};
      this.value = attrs.value ?? '';
    }
    set value(value) {
      if (this.attrs.type === 'range') {
        const min = Number(this.attrs.min), max = Number(this.attrs.max), step = Number(this.attrs.step);
        const clamped = Math.max(min, Math.min(max, Number(value)));
        value = Math.max(min, Math.min(max, min + Math.round((clamped - min) / step) * step));
        value = Number(value.toFixed(10));
      }
      this._value = String(value);
    }
    get value() { return this._value; }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    getAttribute(key) { return this.attrs[key]; }
    addEventListener(key, fn) { (this.events[key] ??= []).push(fn); }
    emit(key) { for (const fn of this.events[key] || []) fn({target: this}); }
  }
  for (const match of html.matchAll(/<[a-z][a-z0-9-]*\b([^>]*)>/gi)) {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const element = new Element(attrs);
    if (attrs.id) nodes.set(attrs.id, element);
    if (attrs['data-preset']) { element.dataset.preset = attrs['data-preset']; presets.push(element); }
    if (/\bdata-euler\b/.test(match[1])) eulerRows.push(element);
  }
  for (const match of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    nodes.get(match[1]).value = match[2].match(/<option value="([^"]+)" selected>/)[1];
  }
  const document = new Element();
  document.getElementById = id => nodes.get(id);
  document.querySelectorAll = selector => selector.endsWith('[data-preset]') ? presets : eulerRows;
  const context = vm.createContext({
    document, [modelName]: model, matchMedia: () => ({matches: reduced}),
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); }
  });
  new vm.Script(script).runInContext(context);
  const element = id => nodes.get(prefix + '-' + id);
  const tick = elapsed => {
    now += elapsed;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(fn => fn(now));
  };
  return {
    element, document, tick,
    click(id) { element(id).emit('click'); },
    input(id, value) { element(id).value = value; element(id).emit('input'); },
    preset(index = 0) { presets[index].emit('click'); },
    advance(seconds, hz) { for (let i = 0; i < Math.round(seconds * hz); i++) tick(1000 / hz); },
    frames: () => frames.size
  };
};
