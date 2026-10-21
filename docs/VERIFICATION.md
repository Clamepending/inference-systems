# Edition 01 verification

Verified locally on October 21, 2026. This is an implementation check of the course
and reference artifacts, not evidence that the learner projects have been completed.

## Course structure and mathematical rendering

The content validator checks all 24 ordered lessons, phase placement, substantive
article lengths, 72 complete exercise/solution sets, 120 valid quiz questions, resource
URLs, and local reference paths. All 299 extracted mathematical expressions parse
successfully with KaTeX. Parsing verifies notation support, not mathematical truth;
worked numeric examples also received an editorial arithmetic review.

## Numerical references

Seven JavaScript tests cover the interactive models and progress import validation.
Eight Python tests pass, including the optional PyTorch decoder test. They cover:

- Byte/unit accounting and the weight/KV memory estimate.
- Online attention against a separate dense formula at every processed prefix,
  including extreme scores and irregular tile boundaries.
- Integer quantization error bounds and zero tensors.
- MoE dispatch/combine against a per-token oracle.
- Rejection-corrected categorical sampling against a known target distribution.
- Freshness accounting, source timestamps, dropped coverage, and underloaded behavior.
- Scheduler completion, monotonic token events, and deterministic trace generation.
- Cached decoder equivalence for single-token and multi-token suffixes and position offsets.

Decoder check environment: macOS ARM64, Python 3.9.6, PyTorch 2.8.0, CPU float32,
single PyTorch CPU thread, random seed 42. Maximum observed logit absolute error was
8.344650268554688e-7; checks use rtol=2e-4 and atol=2e-5. These are tiny random-weight
correctness experiments, not a pretrained-model quality study.

## Browser behavior

Checked in Chromium at 1440×1000 and 390×844:

- All 24 chapters render without math errors or runtime exceptions.
- All six visual experiments, controls, and prediction explanations work.
- A full lesson path: exercise checks, 5/5 quiz, evidence checklist, completion.
- Notes, unfinished evidence checklists, and lesson/project progress persist across reloads.
- JSON progress export and import work.
- Search, resource filters, Berkeley resource mappings, and mobile navigation work.
- Fourteen representative mobile routes have no document-level horizontal overflow.
- Light and dark theme transitions work.

Production build and dependency audit pass. The same browser checks passed against
the deployed [GitHub Pages site](https://clamepending.github.io/inference-systems/),
which returned HTTP 200. GitHub Actions built and deployed the published source.

## Explicit limits

The NVIDIA/Triton RMSNorm lab is included but was not executed on this macOS CPU
environment. No multi-GPU, DeepInfer, VLM, or robot hardware experiment is claimed.
Those experiments belong to the learner’s project work. Third-party video playback
and Berkeley account access are not guaranteed; restricted recordings are labeled.
