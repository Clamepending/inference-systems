export const REPO = "https://github.com/Clamepending/inference-systems";
export const phases = [
  {
    id: 1,
    title: "The anatomy of inference",
    short: "Foundations",
    weeks: "01–03",
    color: "#758b5e",
    description:
      "Build a cost model before you build an optimization. Understand the work, the memory, and the measurements.",
    output: "A decoder and a defensible performance model",
    icon: "layers",
  },
  {
    id: 2,
    title: "Think like a GPU",
    short: "GPU & kernels",
    weeks: "04–07",
    color: "#b78752",
    description:
      "Follow the bytes from HBM to registers. Write kernels, explain their bottlenecks, and make the right shapes faster.",
    output: "An optimized kernel with a shape-by-shape report",
    icon: "cpu",
  },
  {
    id: 3,
    title: "Build an inference engine",
    short: "Serving engines",
    weeks: "08–11",
    color: "#67958c",
    description:
      "Turn a model into a system. Manage pages, schedule tokens, share prefixes, and keep latency promises.",
    output: "A small, correct continuous-batching engine",
    icon: "workflow",
  },
  {
    id: 4,
    title: "Scale beyond one device",
    short: "Distributed systems",
    weeks: "12–15",
    color: "#8680a3",
    description:
      "Model communication, place experts, separate prefill from decode, and understand when scaling loses.",
    output: "An MoE runtime and a scaling study",
    icon: "network",
  },
  {
    id: 5,
    title: "Read the frontier critically",
    short: "Frontier algorithms",
    weeks: "16–19",
    color: "#b37c62",
    description:
      "Reproduce speculation, test numerical tradeoffs, and dissect DeepSeek’s released inference stack.",
    output: "A source-grounded reproduction with ablations",
    icon: "flask",
  },
  {
    id: 6,
    title: "Inference in a moving world",
    short: "VLMs & robotics",
    weeks: "20–22",
    color: "#728b99",
    description:
      "Serve images, video, and action policies. Optimize the age of information as carefully as throughput.",
    output: "A streaming perception and policy service",
    icon: "scan",
  },
  {
    id: 7,
    title: "Make an original contribution",
    short: "Research capstone",
    weeks: "23–24",
    color: "#8a8e57",
    description:
      "Turn an observation into a falsifiable hypothesis, a reproducible artifact, and an honest technical report.",
    output: "A public research artifact and technical report",
    icon: "sparkles",
  },
];
export const projects = [
  {
    id: "engine",
    number: "01",
    title: "Build a small inference engine",
    tag: "SYSTEMS PROJECT",
    weeks: "Weeks 01–11",
    phase: 3,
    hardware: "CPU → 1 GPU",
    summary:
      "From a correct cached decoder to a server that schedules real requests and owns every byte of its KV cache.",
    question:
      "How much goodput can careful memory management and scheduling recover under a fixed latency budget?",
    prereqs:
      "Lessons 01–11; PyTorch tensors, Python concurrency, and basic HTTP.",
    start: "python3 labs/03_scheduler.py",
    milestones: [
      "Establish cached vs uncached logit equivalence on several prompt lengths; retain the exact input seeds.",
      "Implement a block allocator with page tables, reference counts, copy-on-write, and a test that every page is reclaimed after cancellation.",
      "Add request arrivals, continuous batching, a token budget, and chunked prefill. Separate admission from execution.",
      "Expose a streaming endpoint with cancellation, bounded queues, request IDs, and metrics at client and server.",
      "Replay the same open-loop trace against your engine and a pinned vLLM installation on the same model and device.",
      "Publish correctness tests, raw request events, TTFT/ITL distributions, goodput, and a report explaining regressions.",
    ],
    baseline:
      "First compare against your own fixed-batch, contiguous-cache decoder. A vLLM comparison is a later systems baseline: use the same checkpoint, precision, sampling, request trace, and device. Do not compare the toy random decoder to a pretrained production model.",
    experiments:
      "Sweep input lengths {128, 1024, 4096}, output lengths {32, 128, 512}, and offered load from clearly unsaturated to overloaded. Include mixed lengths, bursts, shared prefixes, cancellations, and a slow client. At each point, repeat independent runs and count rejected or failed requests in the offered-load accounting.",
    rubric: [
      ["Correctness & lifecycle", 35],
      ["Measurement & reproducibility", 30],
      ["Cost model & explanation", 20],
      ["Implementation & operational behavior", 15],
    ],
    deliverables:
      "Source, environment lockfile, trace generator, allocator tests, raw JSONL events, a benchmark runner, a profile trace, and a 4–6 page report.",
    stretch:
      "Implement preemption and resumable decoding, then compare swapping versus recomputing KV under a memory-constrained trace.",
    gate: "A faster result fails this project if it changes output semantics without disclosure, drops hard requests from the denominator, or leaks pages after cancellation.",
  },
  {
    id: "moe",
    number: "02",
    title: "Make expert parallelism work",
    tag: "DISTRIBUTED PROJECT",
    weeks: "Weeks 12–19",
    phase: 5,
    hardware: "CPU simulation → 2+ GPUs",
    summary:
      "Build dispatch and combine, provoke expert skew, and prove when replication is worth its cost.",
    question:
      "When does reducing the busiest rank’s workload outweigh the extra memory and communication of expert replication?",
    prereqs:
      "Lessons 12–19; collective operations, MoE routing, and single-device profiling.",
    start: "python3 labs/06_moe.py",
    milestones: [
      "Implement a deterministic single-device MoE oracle: top-k routing, expert execution, weighted combine, and stable token IDs.",
      "Run the supplied load simulator; produce uniform, Zipf-like, and shifting-hotspot traces with fixed random seeds.",
      "Implement two-rank dispatch and combine. Match the oracle for outputs, duplicates, empty experts, and non-divisible batches.",
      "Instrument dispatch, expert GEMM, combine, rank idle time, and end-to-end iteration latency separately.",
      "Implement one placement or replication policy and account for replica memory, update cost, and token redistribution.",
      "Evaluate an unseen workload shift, publish per-rank tails, and state the operating region where your policy loses.",
    ],
    baseline:
      "Use fixed placement with identical routing and no token dropping. Report both the one-device oracle and the distributed baseline; their timings answer different questions. A simulator validates policy logic, not interconnect performance.",
    experiments:
      "Sweep expert count, top-k, tokens per iteration, routing skew, network payload size, and hotspot duration. Record topology using the platform tools. Include an ablation with the same extra memory budget but random placement to test whether intelligence, rather than added capacity, causes the gain.",
    rubric: [
      ["Dispatch/combine correctness", 30],
      ["Communication & skew analysis", 30],
      ["Controlled policy comparison", 25],
      ["Artifact & limitations", 15],
    ],
    deliverables:
      "Oracle, runtime, routing traces, topology record, numerical tolerances, per-rank timing data, one policy ablation, and a reproducible report.",
    stretch:
      "Overlap dispatch with grouped GEMMs using separate streams. Verify overlap on a timeline rather than inferring it from asynchronous API calls.",
    gate: "No performance conclusion from the CPU simulator alone. A distributed claim requires real ranks and measured communication. If hardware is unavailable, submit the clearly labeled simulation track.",
  },
  {
    id: "embodied",
    number: "03",
    title: "Serve a world that keeps moving",
    tag: "MULTIMODAL PROJECT",
    weeks: "Weeks 20–22",
    phase: 6,
    hardware: "Recorded inputs → 1 GPU",
    summary:
      "Build a streaming VLM and policy service that knows when its observations—and its actions—are too old.",
    question:
      "Can freshness-aware scheduling reduce deadline misses while preserving perception quality and closed-loop task success?",
    prereqs:
      "Lessons 20–22; timestamps, asynchronous queues, and basic vision model inference.",
    start: "python3 labs/08_freshness.py",
    milestones: [
      "Create a timestamped recorded-camera source; preserve capture time, sequence, source ID, and preprocessing metadata.",
      "Run a VLM with configurable frame sampling and image token budgets. Measure preprocessing, encoding, queueing, decoding, and transport.",
      "Compare FIFO, bounded latest-frame-wins, and a fixed-rate sampler on identical arrivals and compute budgets.",
      "Add a policy endpoint using recorded or simulated observations, action chunks, explicit validity intervals, and deadline rejection.",
      "Inject slow inference, network jitter, a camera restart, out-of-order replies, and a stalled consumer.",
      "Report observation age, update gaps, deadline misses, perception quality, and simulated task outcomes together.",
    ],
    baseline:
      "Use a blocking FIFO pipeline with the same model, image resolution, observation trace, and compute allocation. Do not let the freshness policy silently improve its score by producing almost no outputs: record coverage and maximum output gaps.",
    experiments:
      "Vary source rate, service-time distribution, frame resolution, queue capacity, chunk horizon, and injected delay. Choose deadline definitions before the sweep. For visual caching, compare against recomputation and measure drift on scene changes. Run the control experiment in simulation or recorded replay first.",
    rubric: [
      ["Time semantics & lifecycle", 30],
      ["Freshness and quality evaluation", 30],
      ["Failure injection & deadlines", 25],
      ["Reproducibility", 15],
    ],
    deliverables:
      "Replayable observations, service code, sequence diagrams, timestamp schema, policy traces, tail-age plots, and a report separating open-loop replay from closed-loop evidence.",
    stretch:
      "Build an adaptive scheduler that changes visual token budget under load, then evaluate it on a held-out scene and an abrupt motion change.",
    gate: "A completed inference on an old observation is not a fresh decision. Reject invalid action chunks and demonstrate that late results cannot overwrite newer state.",
  },
  {
    id: "research",
    number: "04",
    title: "Contribute something new",
    tag: "RESEARCH CAPSTONE",
    weeks: "Weeks 23–24 and beyond",
    phase: 7,
    hardware: "Chosen by the hypothesis",
    summary:
      "Choose one narrow bottleneck. Make a prediction strong enough to be wrong. Build the evidence that survives review.",
    question:
      "What measurable inference bottleneck can you improve under explicit constraints, and where does your method stop helping?",
    prereqs: "At least one completed systems project and lessons 23–24.",
    start: "Open docs/EXPERIMENT_TEMPLATE.md",
    milestones: [
      "Write a one-paragraph claim with a target workload, hardware class, quality constraint, primary metric, and falsification condition.",
      "Review at least three closest primary sources and inspect the relevant code at recorded commit SHAs.",
      "Reproduce the strongest feasible baseline and freeze the evaluation protocol before tuning your idea.",
      "Implement the smallest intervention that tests your mechanism. Keep an ablation that removes only that mechanism.",
      "Evaluate repeated runs, held-out workloads, adverse cases, numerical behavior, and full-system overhead.",
      "Release an artifact another person can run and write a report that distinguishes observations, explanations, and unresolved hypotheses.",
    ],
    baseline:
      "Choose the best applicable implementation you can run correctly. Compare against tuned baselines with equal memory, precision, hardware, and quality constraints; disclose any mismatch. Novelty is a literature claim requiring evidence, not a course badge.",
    experiments:
      "Suggested directions: adaptive speculation with quality-preserving sampling; expert replication under nonstationary routing; cache admission under mixed prefix locality; deadline-aware visual encoding. Use one primary outcome and register your intended sweeps in the notebook before execution.",
    rubric: [
      ["Question & prior work", 20],
      ["Baseline & validity", 30],
      ["Mechanism & ablations", 25],
      ["Evidence & communication", 25],
    ],
    deliverables:
      "A public repository, exact reproduction commands, hardware and dependency manifest, raw results, analysis script, limitations, and a 6–8 page technical report.",
    stretch:
      "Ask an independent reader to reproduce one figure. File a minimal upstream issue or contribution if your results reveal a concrete engine problem.",
    gate: "A negative result is acceptable. An irreproducible positive result or an unsupported novelty claim is not.",
  },
];
