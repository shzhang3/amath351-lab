// Exact trajectories used by the Section 1.2 motion experiments.
(function (root) {
  const position = t => 1 + (4 / 3) * ((t + 4) ** 1.5 - 8) - 5 * t;
  const velocity = t => 2 * Math.sqrt(t + 4) - 5;
  const acceleration = t => 1 / Math.sqrt(t + 4);
  const gravity = 2 * 20 / (2 * 2);
  const impactTime = height => Math.sqrt(2 * height / gravity);
  const altitude = (height, time) => Math.max(0, height - gravity * time * time / 2);
  const fallingVelocity = time => -gravity * time;
  const impactSpeed = height => gravity * impactTime(height);
  function restoreMotion(raw) {
    return raw?.version === 1 && Number.isFinite(raw.time) ? Math.max(0, Math.min(6, raw.time)) : 0;
  }
  function restoreDrop(raw) {
    const state = {height:200, time:0, gravityRevealed:false};
    if (raw?.version !== 1) return state;
    if (Number.isFinite(raw.height)) state.height = Math.max(20, Math.min(400, Math.round(raw.height / 20) * 20));
    if (Number.isFinite(raw.time)) state.time = Math.max(0, Math.min(impactTime(state.height), raw.time));
    state.gravityRevealed = raw.gravityRevealed === true;
    return state;
  }
  const model = Object.freeze({position, velocity, acceleration, gravity, impactTime, altitude, fallingVelocity, impactSpeed, restoreMotion, restoreDrop});
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.Amath351Motion = model;
})(globalThis);
