// Exact quantities behind the area-matching experiment, y' = t*y, y(0) = 1.
(function (root) {
  const timeArea = t => t * t / 2;
  const stateArea = y => Math.log(y);
  const solution = t => Math.exp(timeArea(t));
  const tolerance = .002;
  const matches = (t, y) => Number.isFinite(t) && Number.isFinite(y) && Math.abs(timeArea(t) - stateArea(y)) <= tolerance;
  const fresh = () => ({ t:1.2, y:1.5, points:[], revealed:false });
  function restore(raw) {
    const state = fresh();
    if (!raw || raw.version !== 1) return state;
    if (Number.isFinite(raw.t)) state.t = Math.round(Math.max(0, Math.min(2, raw.t)) * 100) / 100;
    if (Number.isFinite(raw.y)) state.y = Math.max(1, Math.min(8, raw.y));
    state.revealed = raw.revealed === true;
    if (Array.isArray(raw.points)) {
      const seen = new Set();
      for (const p of raw.points) {
        if (!p || !Number.isFinite(p.t) || !Number.isFinite(p.y)) continue;
        const t = Math.round(p.t * 100) / 100;
        if (t <= 0 || t > 2 || p.y < 1 || p.y > 8 || !matches(t,p.y) || seen.has(t)) continue;
        seen.add(t); state.points.push({t,y:p.y});
        if (state.points.length === 12) break;
      }
      state.points.sort((a,b)=>a.t-b.t);
    }
    return state;
  }
  const model = Object.freeze({timeArea,stateArea,solution,tolerance,matches,fresh,restore});
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.Amath351Separable = model;
})(globalThis);
