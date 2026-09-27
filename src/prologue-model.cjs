// Exact teaching models, shared by the page and the mathematical checks.
// This local velocity field is an illustration, not the paper's NS construction.
(function (root) {
  const strain = 0.24;
  function velocityAt(point, omega) {
    return {
      x: -strain * point.x - omega * point.y,
      y: omega * point.x - strain * point.y,
      z: 2 * strain * point.z
    };
  }
  function particleAt(seed, time, omega) {
    const radius = seed.radius * Math.exp(-strain * time);
    const angle = seed.angle + omega * time;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: seed.z * Math.exp(2 * strain * time) };
  }
  function blowupAt(time) {
    return time < 1 ? 1 / (1 - time) : null;
  }
  const model = Object.freeze({ strain, velocityAt, particleAt, blowupAt });
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.Amath351Intro = model;
})(globalThis);
