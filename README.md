# AMATH 351 Lab

Interactive experiments accompanying AMATH 351, Autumn 2026, at the University
of Washington.

**Live demo:** https://shzhang3.github.io/amath351-lab/

**Repository:** https://github.com/shzhang3/amath351-lab

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

The editable experiment is **src/experiment.html**. Its markup, styles, and
interaction logic are kept together. **src/page.html** supplies the standalone
document. **index.html** is the generated, deployable page. The experiment has
no runtime dependencies, external scripts, or network requests.

After editing the source:

    python3 build.py
    python3 build.py --check
    node --test tests/experiment.test.cjs

The build uses only the Python standard library; the interaction checks use
Node.js built-in modules. To preview from the repository root:

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
