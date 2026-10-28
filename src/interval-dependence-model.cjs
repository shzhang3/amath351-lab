(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IntervalDependence = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const intervals = {
    real: { label: 'ℝ', window: [-2, 2], multiplier: null },
    positive: { label: '(0, ∞)', window: [0, 2], multiplier: 1 },
    negative: { label: '(−∞, 0)', window: [-2, 0], multiplier: -1 }
  };
  const f = x => x ** 3;
  const g = x => Math.abs(x) ** 3;
  const df = x => 3 * x * x;
  const dg = x => 3 * x * Math.abs(x);
  const ratio = x => x === 0 ? null : Math.sign(x);
  const wronskian = x => f(x) * dg(x) - df(x) * g(x);
  const matches = (interval, k) => intervals[interval].multiplier !== null && k === intervals[interval].multiplier;
  return { intervals, f, g, df, dg, ratio, wronskian, matches };
});
