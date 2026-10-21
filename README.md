# Inference Atelier

**Learn to reason about, build, and measure inference systems.**

[Open the course](https://clamepending.github.io/inference-systems/) ·
[Course and setup guide](docs/COURSE_GUIDE.md) ·
[Experiment template](docs/EXPERIMENT_TEMPLATE.md) ·
[Portfolio writing template](docs/PORTFOLIO_POST_TEMPLATE.md)

A complete 24-week, advanced self-study pathway through LLM, VLM, and VLA inference.
It assumes ML and programming experience and emphasizes first-principles reasoning,
implementation correctness, measurement, and research communication.

- 24 original chapters (over 20,000 words of article text).
- 72 worked exercises and 120 reasoning questions with explanations.
- Six interactive visual explanations: roofline, KV caching, online attention,
  scheduling, speculative decoding, and observation freshness.
- Nine Python reference labs, with seven requiring only the standard library.
- Four flagship project specifications with rubrics, demo storyboards, and blog briefs.
- A source-linked resource library and browser-local progress/notebook with export/import.
- Responsive design, keyboard navigation, reduced-motion support, light/dark themes,
  self-hosted typefaces, and rendered mathematical notation.

## Run the website

Use Node.js 22 LTS (22.12+) or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:4173`).

```sh
npm test
npm run build
npm run preview
```

The site is a static React/Vite application with hash routing, so lesson links work
on GitHub Pages without a rewrite server. No secrets or backend are needed.
Course content is ordinary JSON containing Markdown in `content/`. Visualizations
and their analytical models live in `src/Visuals.jsx` and `src/models.js`.

## Run the labs

```sh
python3 labs/01_cost_model.py
python3 labs/03_scheduler.py --policy chunked
python3 labs/04_online_softmax.py
python3 labs/05_quantization.py
python3 labs/06_moe.py
python3 labs/07_speculation.py
python3 labs/08_freshness.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

`02_tiny_decoder.py` additionally requires PyTorch. `09_rmsnorm.py` requires CUDA
PyTorch, Triton, and a compatible NVIDIA GPU. See the course guide. The curriculum
explicitly distinguishes supplied references from assignments for the learner to build.
CPU simulators do not establish GPU performance, and open-loop camera replay does
not establish closed-loop control quality.

## Publishing

The GitHub Actions workflow validates content and numerical models, builds the site,
and deploys `dist/` to GitHub Pages on pushes to `main`. In repository Settings →
Pages, select **GitHub Actions** as the build source. Pull requests run the same
checks without deploying. To use a fork, update the repository links in
`src/catalog.js`, README, and course documentation to your own repository.

## Progress and privacy

No account, analytics, server database, or paid API. Progress and notes are saved in
this browser’s local storage. Export from My notebook to back up or move devices.
Import merges by lesson/project ID, replacing matching entries. Completion is
self-attestation plus an 80% quiz threshold; it is not an independently graded credential.

## Editorial scope

Edition 01, October 21, 2026. Primary-source links support framework-specific claims.
The DeepInfer source audit uses a pinned upstream commit. The general explanations
and exercises are original course material, not reproduced papers. Upstream APIs
and hardware requirements change; verify them before provisioning an experiment.

The time budget is a suggested progression. Frontier-level ability requires actual
implementations, experiments, critical reading, and feedback beyond finishing a course.

## Contributing

For a correction, cite a lesson and provide the arithmetic, primary source, or minimal
reproduction. Preserve the distinction between measured data, analytical bounds, and
illustrative simulations. Run `npm test`, the Python suite, and `npm run build` before
submitting. For visual changes, check desktop and mobile layouts and keyboard access.

## License

Original course code and content are released under the MIT license. Linked papers,
videos, repositories, and third-party dependencies retain their own licenses.
