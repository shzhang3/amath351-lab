(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NonhomogeneousModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const domain = [-0.8, 0.8];
  const particulars = {
    constant: { shift: 0, label: '−3' },
    exponential: { shift: 1, label: '−3 + e²ˣ' }
  };
  const fresh = () => ({ a: 1, b: 0.5, particular: 'constant', x: 0, family: false,
    visible: { total: true, complementary: true, particular: true } });
  const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
  function restore(saved) {
    const state = fresh();
    if (!saved || saved.version !== 1) return state;
    for (const key of ['a','b']) if (Number.isFinite(saved[key])) state[key] = Math.round(clamp(saved[key],-3,3)*10)/10;
    if (Object.hasOwn(particulars,saved.particular)) state.particular = saved.particular;
    if (Number.isFinite(saved.x)) state.x = clamp(saved.x,...domain);
    if (typeof saved.family === 'boolean') state.family = saved.family;
    for (const key of Object.keys(state.visible)) {
      if (saved.visible && typeof saved.visible[key] === 'boolean') state.visible[key] = saved.visible[key];
    }
    return state;
  }
  function coefficients(state) {
    return { c1: state.a-particulars[state.particular].shift, c2: state.b };
  }
  function terms(state,x) {
    const ep = Math.exp(2*x), em = Math.exp(-2*x);
    const shift = particulars[state.particular].shift;
    const yc = (state.a-shift)*ep+state.b*em, yp = -3+shift*ep;
    // Evaluate the total independently of the decomposition. Changing the
    // particular solution preserves the entire curve, not only a sample point.
    const y = state.a*ep+state.b*em-3;
    const ddc = 4*yc, ddp = 4*shift*ep, ddy = 4*(state.a*ep+state.b*em);
    return {
      complementary: { value: yc, second: ddc, operator: ddc-4*yc },
      particular: { value: yp, second: ddp, operator: ddp-4*yp },
      total: { value: y, second: ddy, operator: ddy-4*y }
    };
  }
  function initial(state) { return { value: state.a+state.b-3, slope: 2*(state.a-state.b) }; }
  function matchInitial(state,value,slope) {
    const a=(value+3)/2+slope/4, b=(value+3)/2-slope/4;
    return { ...state,a,b };
  }
  const family = () => [-0.5,0.5,1.5,2.5].flatMap(a => [-0.5,0.5,1.5].map(b => ({a,b})));
  function sample(state,count=241) {
    return Array.from({length:count},(_,i)=>{
      const x=domain[0]+(domain[1]-domain[0])*i/(count-1);
      return {x,...terms(state,x)};
    });
  }
  function yDomain(state) {
    // Include both decompositions so switching y_p cannot rescale the axes.
    const values=[0];
    for (const particular of Object.keys(particulars)) {
      for (const p of sample({...state,particular},81)) {
        values.push(p.total.value,p.complementary.value,p.particular.value);
      }
    }
    if (state.family) for (const pair of family()) {
      for (const p of sample({...state,...pair},81)) values.push(p.total.value);
    }
    const lo=Math.min(...values),hi=Math.max(...values),pad=Math.max(1,(hi-lo)*0.12);
    return [lo-pad,hi+pad];
  }
  return { domain, particulars, fresh, restore, coefficients, terms, initial, matchInitial, family, sample, yDomain };
});
