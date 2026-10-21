# [A specific technical result, with no invented speedup]

One paragraph: the problem, your intervention, measured outcome, and scope.
If only the CPU simulation is complete, say so in this paragraph and on the demo.

## Show it in 15 seconds

Embed a short recording or a live demo. Give the viewer one control that changes
the mechanism: request burst, routing skew, draft acceptance, or observation delay.
Show the baseline beside the intervention. Explain units and label synthetic data.
Never make an animated teaching model look like a live GPU benchmark.

## The prediction

Derive the cost model. Use a numerical example and state its assumptions. Explain
what a knowledgeable reader should expect before seeing your measurements.

## The implementation

Show one small architecture diagram and the critical code path. Link exact lines at
a commit. Explain an invariant: page ownership, token identity, probability mass,
or source time. Tell the story of a bug caught by that invariant.

## The experiment

List hardware, versions, model, precision, workload, arrival process, timing
boundaries, correctness checks, and commands. Link raw results and analysis code.
Use the full experiment template in this repository. Hold quality and resources fixed.

## The result

Plot the primary metric over a meaningful workload sweep. Show variability across
independent runs and the number of samples. Include a baseline and the ablation.
Account for failures, dropped work, and tail latency. Explain the shape of the curve.

## Where it loses

Choose a real counterexample. Identify which assumption broke. Quantify extra
memory, compute, communication, quality loss, or maintenance burden where relevant.

## Reproduce it

Provide one command for the small smoke run and another for the full experiment.
State hardware and approximate resource requirements without inventing cloud prices.
Include a short expected-output description; do not imply bitwise reproducibility
where the contract is numerical or distributional equivalence.

## What comes next

Separate measured conclusions from hypotheses. Link the closest prior art and
explain exactly what is yours. A clearly explained negative result can be an excellent post.

## Portfolio review checklist

- [ ] The demo is reachable and has readable labels, units, and provenance.
- [ ] The code and exact commit are public and the README has reproduction steps.
- [ ] Correctness checks run before benchmarks.
- [ ] The baseline is credible and the comparison respects constraints.
- [ ] Raw data and chart-generation code are included.
- [ ] Failed requests and dropped frames appear in the accounting.
- [ ] There is a losing case, not only a selected best result.
- [ ] An independent reader reproduced at least one small result.
