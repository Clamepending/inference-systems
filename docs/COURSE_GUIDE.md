# Inference Atelier: course guide

This is a 24-week advanced self-study course in inference systems, intended for
someone comfortable with machine learning, linear algebra, Python, and programming
large models. It teaches performance reasoning, implementation, experiments, and
research communication. Twenty-four weeks at 15–20 hours/week is a suggested path,
not a guarantee of research expertise. The four projects can take substantially longer.

## What is included

- 24 original technical chapters, 72 exercises with solutions, and 120 quiz questions.
- Six interactive visual explanations with explicit model assumptions.
- Nine runnable reference labs: seven standard-library Python labs, one PyTorch
  cached decoder, and one NVIDIA/Triton RMSNorm lab.
- Four project briefs, each with milestones, a rubric, demo and blog-post requirements.
- Primary papers, source code, documentation, and recorded talks linked by lesson.
- A browser-local notebook, completion tracking, and JSON import/export.

Project extensions are assignments, not finished engines included in the course.
The browser visualizations are analytical models or simulations, not remote GPU runs.
All learning state lives on your device. Export a backup before clearing browser data.
There is no account, paid service, telemetry, or server-side notebook storage.

## Start here

1. Read lesson 01. Write your own estimate before moving the roofline sliders.
2. Clone this repository and run the CPU labs:

```sh
git clone https://github.com/Clamepending/inference-systems.git
cd inference-systems
python3 labs/01_cost_model.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

3. Create a separate environment for the optional PyTorch lab:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install torch
python labs/02_tiny_decoder.py
python labs/02_tiny_decoder.py --benchmark
```

The tiny decoder has random weights and downloads no checkpoint. It validates cache
semantics and timing methodology. Its measured speedup is not a production-serving result.

4. Attempt exercises, then check solutions. Answer the five quiz questions without
looking at the explanations. A score of 4/5 meets the quiz criterion.
5. Record experimental evidence. Completing a lesson requires the exercise checks,
the quiz criterion, and self-attestation of the evidence checklist. It is not a credential.

## Prerequisite diagnostic

Before week 1, you should be able to explain matrix multiplication dimensions,
softmax stability, causal masking, tensor strides, basic probability, and p50/p99.
Implement a matrix multiply with loops and compare it to a library. Write an async
producer/consumer with a bounded queue. Derive why moving N bytes at B bytes/s takes
at least N/B seconds. If any of these are unfamiliar, spend an extra preparation week
with the linked PyTorch, CUDA, and GPU MODE material before advancing.

## Choose a compute path

| Path | What you can complete | What it cannot establish |
| --- | --- | --- |
| Laptop / CPU | All reading, quizzes, derivations, simulators, decoder correctness, policies and portfolio prototypes | GPU kernel speed, communication latency, production capacity |
| One supported NVIDIA GPU | Kernels, small-model serving, quantization experiments, VLM pipeline | Real multi-rank or cross-node scaling |
| Two or more GPUs | Collectives, MoE dispatch/combine, topology and placement studies | Benefits on an untested fabric or much larger cluster |
| Specialist hardware | Specific DeepSeek released kernels when requirements match | General performance on unrelated architectures |

For CUDA labs use a Linux NVIDIA environment. Verify the driver, device model,
CUDA compatibility, available VRAM, and framework support before installing.
Use the current [PyTorch installer](https://pytorch.org/get-started/locally/) for
your platform rather than copying a stale CUDA wheel command. Install Triton in
the same isolated environment, using its [official documentation](https://triton-lang.org/).
Record exact installed versions after the environment works.

```sh
nvidia-smi
python -c 'import torch; print(torch.__version__, torch.cuda.is_available()); print(torch.cuda.get_device_name())'
python labs/09_rmsnorm.py --rows 1024 --width 4096
```

Start GPU rentals with a small correctness run and a bounded experiment matrix.
Record the current provider price yourself; the course does not assume a fixed rental
price or buy compute for you. Stop rented instances when finished. No special hardware
is needed to read the DeepInfer source audit; running its released paths has specific
requirements recorded in lesson 19 and the pinned upstream README.

## Lab map

| Lab | Mechanism | Learner extension |
| --- | --- | --- |
| 01 cost model | Dense weight and KV traffic lower bounds | Attention FLOPs, MoE active weights, measured bandwidth |
| 02 tiny decoder | Causal masks, positions, per-layer KV | Paging, GQA, variable lengths, generation |
| 03 scheduler | Prefill/decode interference | Cache admission, cancellation, preemption, streaming endpoint |
| 04 online softmax | Stable streaming recurrence | Vector values, masked tiles, GPU fusion |
| 05 quantization | Per-tensor vs per-row reconstruction | Real packed GEMM, calibration, held-out quality |
| 06 MoE | Dispatch/combine and skew | Actual collectives, replication cost, multi-rank execution |
| 07 speculation | Exact one-token rejection correction | Conditional multi-token verification and cache rollback |
| 08 freshness | FIFO vs latest pending frame | Jitter, transport, quality, control simulation |
| 09 RMSNorm | Masked Triton reduction | Fused residual, shapes, dtypes, rigorous baseline timing |

## Weekly rhythm

Use roughly 55% of the week to implement, 25% to read, 15% to profile, and 5% to
write. Adjust when an experiment needs a longer report. Before each run, write a
prediction. Afterward, explain the disagreement. Every phase ends in an inspectable
artifact. Refer to the project rubric before spending time on visual polish.

Create a small public result every 2–3 weeks: a derivation illustrated with your
own measured curve, a bug explained with a minimal test, or a comparison with a
counterexample. The portfolio page specifies three substantial systems demos and
one research artifact. They should be built on your code and evidence.

## Berkeley companion track

The [Scalable AI Spring 2026 archive](https://scalable-ai.eecs.berkeley.edu/S2026/)
is an optional companion, with direct lecture and assignment links in our lesson
resource panels. This independent course is not affiliated with UC Berkeley.

| Our lessons | Berkeley material | How to use it |
| --- | --- | --- |
| 01–06 | L2; Assignment 1 | Compare cost models and complete the arithmetic-intensity notebook. The full Mixtral training challenge specifies 8 H100s and is optional. |
| 08–11 | L18; L20 vLLM slides | Map engine concepts to an actual implementation. |
| 12–13 | L4 | Derive collective payloads and distinguish training from inference. |
| 16–17 | L17 | Compare preparation techniques against exactness and quality constraints. |
| 11, 23–24 | Assignment 4 | Review your application, evaluation, and demo against an external brief. |

The downloadable A4 handout is titled **Applications**, despite the schedule’s
inference/serving label. Original assignment rules, including allowed models, belong
to Berkeley’s assignment; they are not requirements of Inference Atelier. We link
the originals rather than redistribute their notebooks or handouts. The lecture
playlist is labeled access restricted because the course page says a Berkeley email
is needed; public slides and GPU MODE recordings remain available alternatives.

## Keeping the course current

This edition was authored against sources reviewed on October 21, 2026. Papers are
stable references; frameworks and hardware support are moving targets. Record
commit SHAs, consult the current upstream documentation, and rerun correctness tests
before adopting a new implementation. Hardware performance and novelty claims require
new evidence. A link to a repository does not certify its current main branch.

## Contribution and reporting

Open an issue with the lesson number, exact statement, proposed correction, and
primary-source evidence or a minimal reproduction. For numerical examples, include
units and arithmetic. For UI problems, include browser, viewport, and route. Contributions
should improve the general explanation rather than special-case one example.
