# AMATH 351 Lab

Interactive experiments accompanying AMATH 351, Autumn 2026, at the University
of Washington.

**Live demo:** https://shzhang3.github.io/amath351-lab/

**Repository:** https://github.com/shzhang3/amath351-lab

## Lecture 01: From fluids to differential equations

A short opening sequence connects a current research question to the ODEs in
this course. Allow about 5–8 minutes before the direction-field experiment.

1. Follow the links to OpenAI's September 8, 2026 announcement and Figure 1 in
   its paper. The reported NS construction uses smooth external forcing and
   develops unbounded velocity while kinetic energy remains bounded.
2. **Track a particle:** predict its motion, change its starting radius or
   height, turn rotation off, and scrub time. The original 3D illustration uses
   the prescribed local field `u = (-a*x - omega*y, omega*x - a*y, 2*a*z)` with
   `a = 0.24`. Its exact trajectories contract radially, rotate, and stretch
   axially. Its divergence is zero. This teaching field has no finite-time
   singularity; it is not the NS solution constructed in the paper.
3. **Can a solution end?** Explore `y' = y^2`, `y(0) = 1`, and compare it with
   `y' = y`. The exact solution `1/(1-t)` is evaluated only before `t = 1`.
   Values above the fixed plot height remain visible in a numeric readout.
   This scalar example explains finite-time blowup; it is not a reduction of NS.
4. Continue to **Follow the slope** below. Return to the particle example when
   the course reaches systems of ODEs.

The page links to the official materials and includes our own drawings. No
OpenAI graphic assets or proof code are copied or bundled. Sources:

- [OpenAI announcement](https://openai.com/index/navier-stokes-solution/)
- [Paper, Figure 1 on page 4](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf#page=4)
- [Public Lean formalization](https://github.com/openai/NavierStokesAndEuler)

Both opening experiments start paused. Keyboard controls, time sliders,
chapter navigation, and a reduced-motion mode are provided. Opening experiments
reset on reload; the direction-field experiment retains its existing local state.

## Experiment 01: Follow the slope

Explore the initial value problem y′ = t − y, y(0) = y₀.

- Inspect slopes by selecting points in the direction field.
- Predict the initial direction and sketch a solution.
- Reveal, pause, and replay the solution with its moving tangent.
- Change the initial value with the draggable point or keyboard-accessible slider.
- Keep up to three solution curves for comparison.
- Show the zero-slope line y = t.

The displayed solution is evaluated analytically:

    y(t) = t - 1 + (y0 + 1) exp(-t)

The exact formula keeps this first experiment focused on direction fields and
initial conditions. Numerical approximation will be a separate learning step.
Interaction state is stored locally in the viewer's browser when storage is
available. No login or server-side application is required.

## Edit and build

The direction-field experiment is **src/experiment.html**. The opening sequence
is **src/prologue.html**, with exact mathematical models in
**src/prologue-model.cjs**. **src/page.html** supplies the standalone document.
**build.py** embeds all three into **index.html**, the deployable page. The lab
has no runtime dependencies, external scripts, or background network requests.

After editing the source:

    python3 build.py
    python3 build.py --check
    node --test tests/*.test.cjs

The build uses only the Python standard library. Node.js checks the ODEs,
incompressibility, singular-time behavior, and application events with a small
DOM substitute. These checks do not replace visual or browser accessibility
testing. To preview from the repository root:

    python3 -m http.server 8000

Open http://localhost:8000/.

## Publishing

This repository has its own GitHub Pages workflow. Each push to **main** checks
the build and interactions, then deploys the standalone page. Shiheng Zhang's
personal homepage provides a link to this project.

Good contributions include a clearer explanation, a revealing initial
condition, a classroom prediction question, an accessibility improvement, or a
small interaction fix. Keep mathematical behavior and learning goals explicit.

## License

MIT. See LICENSE.
