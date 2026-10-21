import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  FlaskConical,
} from "lucide-react";
import {
  roofline,
  onlineSteps,
  specExpected,
  freshness,
  schedulerTrace,
} from "./models";

export const experiments = [
  {
    id: "roofline",
    n: "01",
    title: "Where does the time go?",
    topic: "The roofline model",
    description: "Change the batch. Watch the bottleneck move.",
    lesson: "01",
  },
  {
    id: "cache",
    n: "02",
    title: "Remember, don’t recompute.",
    topic: "KV cache & GQA",
    description: "Generate one token at a time and follow the memory.",
    lesson: "02",
  },
  {
    id: "attention",
    n: "03",
    title: "Softmax without looking back.",
    topic: "Online attention",
    description: "A running maximum makes a global operation streamable.",
    lesson: "07",
  },
  {
    id: "scheduler",
    n: "04",
    title: "Who gets the GPU next?",
    topic: "Prefill meets decode",
    description: "One long prompt can hold everyone else up.",
    lesson: "09",
  },
  {
    id: "speculation",
    n: "05",
    title: "Guess ahead. Verify exactly.",
    topic: "Speculative decoding",
    description: "Explore why more draft tokens can make you slower.",
    lesson: "16",
  },
  {
    id: "freshness",
    n: "06",
    title: "A correct answer can be too late.",
    topic: "Age of information",
    description: "Trade coverage for freshness in a streaming pipeline.",
    lesson: "21",
  },
];
function Slider({ label, value, onChange, min, max, step = 1, unit = "" }) {
  return (
    <label className="slider-control">
      <span>
        {label}
        <strong>
          {value.toLocaleString()}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function Stat({ label, value, detail }) {
  return (
    <div className="sim-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
function Prediction({ question, answer }) {
  const [show, setShow] = useState(false);
  return (
    <div className="prediction">
      <span className="eyebrow">PAUSE & PREDICT</span>
      <p>{question}</p>
      <button
        className="text-button"
        onClick={() => setShow(!show)}
        aria-expanded={show}
      >
        {show ? "Hide explanation" : "Reveal the reasoning"}
        <ChevronRight size={14} />
      </button>
      {show && <p className="prediction-answer">{answer}</p>}
    </div>
  );
}
function Roofline() {
  const [batch, setBatch] = useState(1),
    [context, setContext] = useState(4096),
    [heads, setHeads] = useState(8);
  const r = roofline({ batch, context, heads });
  const bound = r.memoryMs >= r.computeMs;
  const scale = Math.max(r.memoryMs, r.computeMs) * 1.2;
  return (
    <>
      <div className="sim-canvas roofline-canvas">
        <div className="canvas-caption">
          <span>7B DENSE MODEL · BF16</span>
          <span>ANALYTICAL MODEL</span>
        </div>
        <svg
          viewBox="0 0 660 245"
          role="img"
          aria-label={`Memory lower bound ${r.memoryMs.toFixed(1)} milliseconds; compute lower bound ${r.computeMs.toFixed(1)} milliseconds`}
        >
          <defs>
            <pattern
              id="grid"
              width="44"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 44 0 L 0 0 0 40"
                fill="none"
                stroke="#ffffff"
                strokeOpacity=".06"
              />
            </pattern>
          </defs>
          <rect width="660" height="245" fill="url(#grid)" />
          <text x="32" y="45" fill="#aabcb3" fontSize="13">
            TIME PER DECODE STEP
          </text>
          <text x="32" y="95" fill="#e1e9df" fontSize="14">
            Read weights + KV
          </text>
          <rect
            x="195"
            y="75"
            width={Math.max(2, (r.memoryMs / scale) * 360)}
            height="31"
            rx="4"
            fill="#d8e6a4"
          />
          <text
            x={205 + (r.memoryMs / scale) * 360}
            y="96"
            fill="#e1e9df"
            fontSize="14"
          >
            {r.memoryMs.toFixed(1)} ms
          </text>
          <text x="32" y="152" fill="#e1e9df" fontSize="14">
            Linear-layer compute
          </text>
          <rect
            x="195"
            y="132"
            width={Math.max(2, (r.computeMs / scale) * 360)}
            height="31"
            rx="4"
            fill="#75b6ac"
          />
          <text
            x={205 + (r.computeMs / scale) * 360}
            y="153"
            fill="#e1e9df"
            fontSize="14"
          >
            {r.computeMs.toFixed(1)} ms
          </text>
          <text x="32" y="216" fill="#aabcb3" fontSize="13">
            Same weights, {batch} sequence{batch === 1 ? "" : "s"}. Weight reads
            are amortized across the batch.
          </text>
        </svg>
        <div className="canvas-foot">
          <span className="live-dot" />
          {bound
            ? "Memory traffic dominates this lower bound"
            : "Linear compute dominates this lower bound"}
        </div>
      </div>
      <div className="sim-controls">
        <Slider
          label="Batch size"
          value={batch}
          onChange={setBatch}
          min={1}
          max={256}
        />
        <Slider
          label="Context length"
          value={context}
          onChange={setContext}
          min={128}
          max={16384}
          step={128}
        />
        <Slider
          label="KV heads"
          value={heads}
          onChange={setHeads}
          min={1}
          max={32}
        />
      </div>
      <div className="sim-stats">
        <Stat
          label="Weights"
          value="14 GB"
          detail="7 × 10⁹ parameters × 2 bytes"
        />
        <Stat
          label="KV cache"
          value={`${r.kv.toFixed(2)} GiB`}
          detail="32 layers · head dimension 128"
        />
        <Stat
          label="Optimistic step time"
          value={`${Math.max(r.computeMs, r.memoryMs).toFixed(1)} ms`}
          detail="max(memory time, linear compute time)"
        />
      </div>
      <p className="model-note">
        Assumes 1 TB/s effective bandwidth, 100 TFLOP/s effective linear
        compute, full KV reads, and weight reuse within a batch. Excludes
        attention FLOPs, KV writes, communication, launch overhead, and overlap
        constraints. This is a lower bound, not a device benchmark.
      </p>
      <Prediction
        question="Why doesn’t doubling the batch necessarily double the step time?"
        answer="The weight tensor is shared by all sequences. In an ideal implementation it is read once while doing more useful work. KV traffic and arithmetic still grow, so this benefit ends when another cost dominates. Increasing context can keep even a large batch bandwidth-bound."
      />
    </>
  );
}
function Cache() {
  const [tokens, setTokens] = useState(4),
    [heads, setHeads] = useState(8),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setTokens((t) => (t < 12 ? t + 1 : 1)), 900);
    return () => clearInterval(i);
  }, [playing]);
  const memory = (2 * 32 * heads * 128 * tokens * 2) / 1024;
  return (
    <>
      <div className="sim-canvas">
        <div className="canvas-caption">
          <span>ONE SEQUENCE · {tokens} TOKENS</span>
          <span>LOGICAL VIEW · ONE LAYER</span>
        </div>
        <div className="cache-animation">
          <div className="token-stream">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className={i < tokens ? "active" : ""}>
                {i < tokens
                  ? [
                      "The",
                      "fast",
                      "path",
                      "is",
                      "to",
                      "move",
                      "fewer",
                      "bytes",
                      ",",
                      "then",
                      "measure",
                      ".",
                    ][i]
                  : "·"}
              </span>
            ))}
          </div>
          {["K", "V"].map((kind) => (
            <div className="cache-row" key={kind}>
              <b>{kind}</b>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className={`cache-cell ${i < tokens ? "filled" : ""} ${i === tokens - 1 ? "new-cell" : ""}`}
                >
                  <span>{i < tokens ? i + 1 : ""}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="cache-read">
            <span className="query-block">
              q<sub>{tokens}</sub>
            </span>
            <ArrowRight />
            <span>
              Read K₁…K{tokens} → scores → weighted sum of V₁…V{tokens}
            </span>
          </div>
        </div>
        <div className="canvas-foot">
          Old K/V stay fixed. Append the new token; query the full visible
          history.
        </div>
      </div>
      <div className="playback">
        <button
          className="button secondary"
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "Pause" : "Animate decode"}
        </button>
        <button
          className="icon-button"
          aria-label="Reset token animation"
          onClick={() => {
            setTokens(1);
            setPlaying(false);
          }}
        >
          <RotateCcw size={16} />
        </button>
        <span>Token {tokens} of 12</span>
      </div>
      <div className="sim-controls">
        <Slider
          label="Sequence length"
          value={tokens}
          onChange={setTokens}
          min={1}
          max={12}
        />
        <Slider
          label="KV heads (32 query heads)"
          value={heads}
          onChange={setHeads}
          min={1}
          max={32}
        />
      </div>
      <div className="sim-stats">
        <Stat
          label="KV across 32 layers"
          value={`${memory.toFixed(0)} KiB`}
          detail="FP16/BF16 · head dimension 128"
        />
        <Stat
          label="Per-token growth"
          value={`${(memory / tokens).toFixed(0)} KiB`}
          detail="2 × layers × KV heads × dim × bytes"
        />
        <Stat
          label="Relative to 32 KV heads"
          value={`${((heads / 32) * 100).toFixed(0)}%`}
          detail="Same sequence length and precision"
        />
      </div>
      <p className="model-note">
        The boxes represent token positions, not physical pages. Fewer KV heads
        reduce memory; a real GQA architecture requires a compatible
        query/KV-head grouping and trained weights. This slider illustrates the
        storage formula, not a way to edit a trained model for free.
      </p>
      <Prediction
        question="Does a KV cache make the attention work per generated token constant?"
        answer="No. It avoids recomputing prior keys and values, but ordinary dense attention still reads and attends to the growing history. The weight-read component can be nearly constant while the KV-read component grows with context."
      />
    </>
  );
}
function Attention() {
  const [step, setStep] = useState(0);
  const trace = onlineSteps(),
    t = trace[step];
  return (
    <>
      <div className="sim-canvas">
        <div className="canvas-caption">
          <span>ONE QUERY · SIX KEY/VALUE PAIRS</span>
          <span>STEP {step + 1} / 6</span>
        </div>
        <div className="softmax-stream">
          {trace.map((x, i) => (
            <div
              key={i}
              className={`${i === step ? "current" : ""} ${i < step ? "visited" : ""}`}
            >
              <small>score {i + 1}</small>
              <b>{x.score}</b>
              <span>value = {x.value}</span>
            </div>
          ))}
        </div>
        <div className="softmax-state">
          <div>
            <small>running max m</small>
            <strong>{t.m}</strong>
          </div>
          <div>
            <small>normalizer ℓ</small>
            <strong>{t.l.toFixed(3)}</strong>
          </div>
          <div>
            <small>weighted sum o</small>
            <strong>{t.o.toFixed(3)}</strong>
          </div>
          <div className="highlight">
            <small>current output o / ℓ</small>
            <strong>{t.result.toFixed(3)}</strong>
          </div>
        </div>
        <div className="canvas-foot">
          {step > 0 && t.correction < 1
            ? `New maximum! Rescale previous accumulators by exp(${trace[step - 1].m} − ${t.m}) = ${t.correction.toFixed(3)}.`
            : "Add this contribution using the current maximum for numerical stability."}
        </div>
      </div>
      <div className="playback">
        <button
          className="button secondary"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Previous pair
        </button>
        <button
          className="button primary"
          disabled={step === 5}
          onClick={() => setStep(step + 1)}
        >
          Next pair
          <ArrowRight size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Reset online softmax"
          onClick={() => setStep(0)}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="equation-strip">
        m′ = max(m, s) · ℓ′ = e<sup>m−m′</sup>ℓ + e<sup>s−m′</sup> · o′ = e
        <sup>m−m′</sup>o + e<sup>s−m′</sup>v
      </div>
      <p className="model-note">
        A scalar output and one pair per step make the recurrence visible. Tiled
        attention applies the same rescaling to block reductions and a vector
        accumulator. This proves streaming equivalence in exact arithmetic;
        floating-point results still require tolerance-based testing.
      </p>
      <Prediction
        question="When a new maximum arrives, why must both accumulators be rescaled?"
        answer="Both sums were expressed relative to the old maximum. Changing the reference scale multiplies every previous exponential by exp(m_old − m_new). Correcting only the denominator changes the weighted average. The cached maximum, denominator, and vector numerator are sufficient statistics for combining the next tile."
      />
    </>
  );
}
function Scheduler() {
  const [chunked, setChunked] = useState(true),
    [step, setStep] = useState(15);
  const trace = schedulerTrace(chunked);
  return (
    <>
      <div className="segmented">
        <button
          className={chunked ? "active" : ""}
          onClick={() => setChunked(true)}
        >
          Chunked prefill
        </button>
        <button
          className={!chunked ? "active" : ""}
          onClick={() => setChunked(false)}
        >
          Prefill first
        </button>
      </div>
      <div className="sim-canvas">
        <div className="canvas-caption">
          <span>FIXED WORK · TWO REQUESTS</span>
          <span>TOY SERIAL GPU TIMELINE</span>
        </div>
        <svg
          viewBox="0 0 680 210"
          role="img"
          aria-label="Request scheduling timeline"
        >
          <text x="20" y="82" fill="#dfe9df" fontSize="14">
            Request A
          </text>
          <text x="20" y="135" fill="#dfe9df" fontSize="14">
            Request B
          </text>
          {Array.from({ length: 16 }, (_, i) => (
            <g key={i}>
              <line
                x1={115 + i * 34}
                x2={115 + i * 34}
                y1="45"
                y2="155"
                stroke="#ffffff"
                strokeOpacity=".08"
              />
              <text x={110 + i * 34} y="182" fill="#9caf9f" fontSize="11">
                {i}
              </text>
            </g>
          ))}
          {[trace.a, trace.b].map((row, y) =>
            row.map((b, i) => (
              <g key={`${y}-${i}`} opacity={b.start < step ? 1 : 0.15}>
                <rect
                  x={115 + b.start * 34}
                  y={60 + y * 53}
                  width={(b.end - b.start) * 34 - 3}
                  height="33"
                  rx="3"
                  fill={b.type === "prefill" ? "#d8e6a4" : "#76b8ae"}
                />
                <text
                  x={121 + b.start * 34}
                  y={81 + y * 53}
                  fill="#173d31"
                  fontSize="12"
                >
                  {b.type === "prefill" ? "P" : "D"}
                </text>
              </g>
            )),
          )}
          <line
            x1={115 + step * 34}
            x2={115 + step * 34}
            y1="38"
            y2="155"
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
        <div className="canvas-foot">
          <span className="legend-square prefill" />
          Prefill work
          <span className="legend-square decode" />
          Decode work<span>Time in arbitrary units</span>
        </div>
      </div>
      <div className="sim-controls">
        <Slider
          label="Inspect the execution"
          value={step}
          onChange={setStep}
          min={0}
          max={15}
        />
      </div>
      <div className="sim-stats">
        <Stat
          label="A’s first decode ends"
          value={`t = ${trace.firstA}`}
          detail="A prefill ends at t = 2"
        />
        <Stat
          label="All work finishes"
          value="t = 15"
          detail="Equal total work in both policies"
        />
        <Stat
          label="Tradeoff"
          value={chunked ? "Interleave" : "Block"}
          detail={
            chunked
              ? "B’s prefill completes later"
              : "A waits behind B’s full prefill"
          }
        />
      </div>
      <p className="model-note">
        This intentionally serial trace isolates interference. P denotes prompt
        processing; D denotes an additional decode step, not necessarily the
        first emitted token (prefill logits can emit it). Real engines can mix
        work in a batch; chunk size changes kernel efficiency and launch cost.
        The runnable scheduler lab adds a configurable cost model.
      </p>
      <Prediction
        question="If total completion time is identical here, what improved?"
        answer="A gets earlier decode updates because B’s prompt no longer monopolizes the device. Throughput alone hides that improvement. B’s prefill latency worsens, so the right choice depends on both TTFT and inter-token-latency objectives. There is no universally best chunk size."
      />
    </>
  );
}
function Speculation() {
  const [a, setA] = useState(0.75),
    [gamma, setGamma] = useState(4),
    [draft, setDraft] = useState(0.1),
    [rejected, setRejected] = useState(3);
  const expected = specExpected(a, gamma),
    speed = expected / (1 + gamma * draft);
  return (
    <>
      <div className="sim-canvas">
        <div className="canvas-caption">
          <span>DRAFT → VERIFY → ACCEPT A PREFIX</span>
          <span>CLICK A TOKEN TO REJECT IT</span>
        </div>
        <div className="draft-chain">
          {Array.from({ length: gamma }, (_, i) => (
            <React.Fragment key={i}>
              <button
                aria-label={`Reject draft token ${i + 1}`}
                onClick={() => setRejected(i)}
                className={
                  i < rejected
                    ? "accepted"
                    : i === rejected
                      ? "rejected"
                      : "discarded"
                }
              >
                <small>
                  {i < rejected
                    ? "accept"
                    : i === rejected
                      ? "reject"
                      : "discard"}
                </small>
                <b>t{i + 1}</b>
              </button>
              {i < gamma - 1 && <ArrowRight size={18} />}
            </React.Fragment>
          ))}
        </div>
        <div className="canvas-foot">
          {Math.min(rejected, gamma)} draft tokens retained, then{" "}
          {rejected < gamma
            ? "one correction sampled from the residual distribution"
            : "one extra token sampled from the target"}
          .
        </div>
      </div>
      <div className="sim-controls">
        <Slider
          label="Mean acceptance (model)"
          value={a}
          onChange={setA}
          min={0}
          max={1}
          step={0.05}
        />
        <Slider
          label="Draft length γ"
          value={gamma}
          onChange={(v) => {
            setGamma(v);
            setRejected(Math.min(rejected, v));
          }}
          min={1}
          max={8}
        />
        <Slider
          label="Draft cost / target step"
          value={draft}
          onChange={setDraft}
          min={0.05}
          max={0.6}
          step={0.05}
        />
      </div>
      <div className="sim-stats">
        <Stat
          label="Expected tokens / round"
          value={expected.toFixed(2)}
          detail="1 + α + α² + … + αγ"
        />
        <Stat
          label="Round cost / target step"
          value={(1 + gamma * draft).toFixed(2)}
          detail="Assumes verification costs one target step"
        />
        <Stat
          label="Modeled speedup"
          value={`${speed.toFixed(2)}×`}
          detail={
            speed < 1
              ? "Slower than target-only decoding"
              : "Optimistic, workload-dependent estimate"
          }
        />
      </div>
      <button className="text-button" onClick={() => setRejected(gamma)}>
        Show an all-accepted round
        <ArrowRight size={14} />
      </button>
      <p className="model-note">
        The clicked trace is illustrative; it does not determine the
        expected-value calculation. That model assumes independent constant
        acceptance, sequential draft costs, and constant target verification
        cost. Real acceptance is conditional and verification grows with shape.
        Exact sampling accepts proposal x with min(1, p(x)/q(x)); rejection uses
        normalized max(p−q, 0).
      </p>
      <Prediction
        question="If the draft model predicts the same top token, can you always accept it when sampling?"
        answer="No. Greedy agreement is not distribution preservation. Exact stochastic decoding requires probability-ratio acceptance and residual correction, with the same temperature, truncation, tokenizer, and conditioning semantics accounted for. A fast heuristic may change the target distribution."
      />
    </>
  );
}
function Freshness() {
  const [period, setPeriod] = useState(33),
    [service, setService] = useState(70);
  const fifo = freshness("fifo", period, service),
    latest = freshness("latest", period, service),
    maxTime = Math.max(...fifo.results.map((r) => r.end)),
    maxAge = Math.max(...fifo.results.map((r) => r.age));
  const points = (run) =>
    run.results
      .map(
        (r) =>
          `${50 + (r.end / maxTime) * 570},${200 - (r.age / maxAge) * 150}`,
      )
      .join(" ");
  return (
    <>
      <div className="sim-canvas">
        <div className="canvas-caption">
          <span>AGE AT RESULT DELIVERY</span>
          <span>24 CAPTURED FRAMES · DRAIN TO COMPLETION</span>
        </div>
        <svg
          viewBox="0 0 680 250"
          role="img"
          aria-label={`FIFO average observation age ${fifo.mean.toFixed(0)} milliseconds, latest-frame average ${latest.mean.toFixed(0)} milliseconds`}
        >
          <line x1="50" x2="625" y1="200" y2="200" stroke="#52695c" />
          <line x1="50" x2="50" y1="30" y2="200" stroke="#52695c" />
          <text x="50" y="23" fill="#aabcb3" fontSize="12">
            age · {maxAge.toFixed(0)} ms max
          </text>
          <polyline
            points={points(fifo)}
            fill="none"
            stroke="#e1b08c"
            strokeWidth="3"
          />
          <polyline
            points={points(latest)}
            fill="none"
            stroke="#d7e6a3"
            strokeWidth="3"
          />
          {latest.results.map((r) => (
            <circle
              key={r.id}
              cx={50 + (r.end / maxTime) * 570}
              cy={200 - (r.age / maxAge) * 150}
              r="3"
              fill="#d7e6a3"
            />
          ))}
          <text x="50" y="225" fill="#aabcb3" fontSize="12">
            0
          </text>
          <text x="500" y="225" fill="#aabcb3" fontSize="12">
            completion time · {maxTime} ms
          </text>
        </svg>
        <div className="canvas-foot">
          <span style={{ color: "#e1b08c" }}>— FIFO</span>
          <span style={{ color: "#d7e6a3" }}>— Latest pending frame</span>
        </div>
      </div>
      <div className="sim-controls">
        <Slider
          label="Capture interval"
          value={period}
          onChange={setPeriod}
          min={10}
          max={100}
          step={1}
          unit=" ms"
        />
        <Slider
          label="Inference service time"
          value={service}
          onChange={setService}
          min={10}
          max={150}
          step={5}
          unit=" ms"
        />
      </div>
      <div className="sim-stats">
        <Stat
          label="FIFO mean age"
          value={`${fifo.mean.toFixed(0)} ms`}
          detail="100% frame coverage"
        />
        <Stat
          label="Latest-frame mean age"
          value={`${latest.mean.toFixed(0)} ms`}
          detail={`${(latest.coverage * 100).toFixed(0)}% frame coverage`}
        />
        <Stat
          label="Pending frames dropped"
          value={latest.dropped}
          detail="In-flight work is never preempted"
        />
      </div>
      <p className="model-note">
        Age = completion time − capture time. The latest-frame policy discards
        older pending frames when the worker becomes free. This deterministic
        simulator ignores transport, variable service time, model quality, and
        control dynamics. Low age alone does not prove a better robot policy.
      </p>
      <Prediction
        question="Why can a throughput-optimal FIFO queue be a poor design for a live camera?"
        answer="When arrivals outrun processing, FIFO faithfully finishes increasingly stale observations. A bounded latest-frame queue limits backlog at the cost of dropped coverage. You must evaluate update gaps, missed events, and task success alongside age, or a system that almost never answers could look deceptively good."
      />
    </>
  );
}
const components = {
  roofline: Roofline,
  cache: Cache,
  attention: Attention,
  scheduler: Scheduler,
  speculation: Speculation,
  freshness: Freshness,
};
export function VisualExperiment({ id }) {
  const C = components[id] || Roofline;
  return (
    <div className="visual-experiment">
      <C />
    </div>
  );
}
export function VisualStudio({ selected }) {
  const id = experiments.some((e) => e.id === selected) ? selected : "roofline";
  const experiment = experiments.find((e) => e.id === id);
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">THE VISUAL LAB</div>
        <h1>
          Make the invisible <em>click.</em>
        </h1>
        <p>
          Change one thing. Predict what happens. Then follow the computation.
        </p>
      </div>
      <div className="studio-layout">
        <nav className="experiment-nav" aria-label="Visual experiments">
          {experiments.map((e) => (
            <a
              className={e.id === id ? "selected" : ""}
              href={`#/lab/${e.id}`}
              key={e.id}
            >
              <span>{e.n}</span>
              <div>
                <b>{e.topic}</b>
                <small>{e.description}</small>
              </div>
            </a>
          ))}
        </nav>
        <div className="studio-main">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPERIMENT {experiment.n}</span>
              <h2>{experiment.title}</h2>
            </div>
            <FlaskConical size={22} />
          </div>
          <VisualExperiment key={id} id={id} />
          <a className="related-lesson" href={`#/learn/${experiment.lesson}`}>
            <span>Connect the intuition to the full derivation</span>
            <b>
              Read lesson {experiment.lesson}
              <ArrowRight size={16} />
            </b>
          </a>
        </div>
      </div>
    </>
  );
}
