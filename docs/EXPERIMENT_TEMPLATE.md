# Experiment record

## Claim before measurement

- Hypothesis, mechanism, and one primary metric:
- Target workload and quality constraints:
- Expected operating region:
- Outcome that would falsify the hypothesis:
- Confidence before experiment: low / moderate / high, and why:

## Reproduction contract

- Git commit and uncommitted diff:
- Hardware, topology, memory, clocks/power configuration:
- OS, driver, CUDA, framework and library versions:
- Model, tokenizer, revision, precision, quantization calibration:
- Sampling settings and stop rules:
- Input trace, generation procedure, seed, and checksum:
- Exact command and environment variables (exclude credentials):
- Warmup, sample size, repetitions, and synchronization method:
- Client arrival model: open loop / closed loop; planned vs actual send timestamps:
- Timing boundaries; tokenizer, transport, queue, prefill, and decode treatment:

## Correctness and quality

- Reference implementation and tolerance:
- Adversarial shapes, masks, offsets, cancellation, and empty-input behavior:
- Exact vs approximate semantics:
- Held-out quality set and acceptance thresholds:
- Failed, rejected, timed-out, retried, and cancelled request accounting:

## Baselines and controls

- Baseline tuning budget and constraints:
- Equal hardware, memory, precision, model, workload, and quality:
- Ablation removing the proposed mechanism:
- Unseen workload and adverse operating region:
- Randomized run order; thermal and shared-device interference:

## Evidence

- Raw data path and checksum:
- Analysis command and generated figure paths:
- Per-request timestamps and end-to-end latency distributions:
- TTFT, per-request TPOT, ITL distribution, and measurement population:
- Throughput and SLO-conforming goodput with denominator defined:
- Peak allocated/reserved memory and cache accounting:
- Effect size, run-level variation, uncertainty method, and sample count:
- Profiler evidence and whether profiling changed performance:

## Interpretation

Separate observations from explanations. What is measured? What is inferred?
What alternative explanation still fits? What does the mechanism-removal ablation say?
Does the claim survive full-system overhead and its quality constraint?

## Limits and next question

Record negative results, unsupported platforms, and untested conditions.
Confidence after experiment: low / moderate / high, with evidence.
Give the smallest next experiment that would resolve the largest uncertainty.
