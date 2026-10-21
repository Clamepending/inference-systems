import React from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Play,
  FileText,
  Code2,
  Check,
  Camera,
} from "lucide-react";
import { projects, REPO } from "./catalog";
export const portfolio = {
  engine: {
    headline: "I built an LLM server. Here is where every millisecond went.",
    hook: "A live request waterfall that changes as you switch scheduling policies.",
    demo: "Show 20 mixed-length requests arriving on a timeline. Toggle fixed batching, continuous batching, and chunked prefill. Display queue wait, prompt processing, decode steps, live KV page occupancy, TTFT, and tail ITL. Cancel a request and show the pages return to the free pool.",
    story: [
      "Predict the bottleneck before profiling.",
      "Walk through one request from admission to final token.",
      "Show a workload where your optimization helps and one where it loses.",
      "Explain a memory-lifecycle bug and the invariant that caught it.",
    ],
    evidence:
      "One identical replay trace, two policies, raw client event logs, pinned model and engine commits, and output-equivalence checks.",
    clip: "0–15s: the overloaded baseline. 15–40s: switch policies and inspect one request. 40–60s: cancel a request and inspect page reclamation. 60–90s: show the measured latency frontier and a losing case.",
    visual: "scheduler",
    artifact: "An interactive scheduling dashboard + an engine deep dive",
    signal:
      "Systems ownership: correctness, resource accounting, profiling, and honest end-to-end evaluation.",
  },
  moe: {
    headline: "One hot expert stalled my GPUs. I made the imbalance visible.",
    hook: "An animated token-routing map with per-rank load and critical-path timing.",
    demo: "Stream token IDs into an expert-by-rank grid. Toggle uniform traffic, a hot expert, and a moving hotspot. Show dispatch volume, compute queues, and combine time. Turn replication on and display memory cost beside any measured tail-latency improvement.",
    story: [
      "Build the simplest correct dispatch/combine oracle.",
      "Explain why average utilization hides the busiest rank.",
      "Use an ablation to separate added capacity from a smarter policy.",
      "Identify the traffic-shift rate where migration stops paying back.",
    ],
    evidence:
      "Per-rank traces, numerical equivalence to the oracle, topology diagram, communication volume, replica memory, and held-out routing patterns.",
    clip: "0–20s: all ranks balanced. 20–40s: inject a hot expert. 40–65s: enable the policy and inspect the critical path. 65–90s: shift the hotspot faster than migration can follow.",
    visual: "roofline",
    artifact: "A distributed routing visualizer + a reproducible scaling study",
    signal:
      "Distributed reasoning: communication, stragglers, resource tradeoffs, and behavior under changing workloads.",
  },
  embodied: {
    headline: "My vision model was fast. Its answers were already obsolete.",
    hook: "Two synchronized video panes: what the camera sees now and what inference is actually processing.",
    demo: "Replay a recorded moving scene with a controllable GPU-delay slider. Compare FIFO and latest-observation scheduling side by side. Overlay capture time, result age, processed-frame coverage, and action validity. Inject a late reply and show it being rejected.",
    story: [
      "Distinguish capture time, enqueue time, and completion time.",
      "Show why good average inference latency can hide stale decisions.",
      "Measure the freshness-versus-coverage frontier.",
      "Demonstrate one missed event and explain the policy’s limitation.",
    ],
    evidence:
      "The exact replay, source timestamps, stage timings, dropped-frame accounting, action validity checks, and a task-quality evaluation.",
    clip: "0–20s: synchronized pipelines under light load. 20–45s: increase service time. 45–70s: compare age and coverage. 70–90s: inject an obsolete action and show rejection.",
    visual: "freshness",
    artifact: "A live freshness demo + a multimodal systems case study",
    signal:
      "Embodied systems judgment: timing semantics, bounded queues, quality constraints, and failure handling.",
  },
  research: {
    headline:
      "A small change to inference—and the experiment that proved its limits.",
    hook: "One falsifiable claim, one controlled intervention, and one result another engineer can reproduce.",
    demo: "Build a compact experiment explorer: choose workload and hardware, inspect raw points with uncertainty, compare the baseline, and open the exact command that produced each point. Include the counterexample prominently.",
    story: [
      "State your claim with a defined workload and metric.",
      "Explain the closest prior work and what differs.",
      "Show the mechanism-removal ablation.",
      "Publish the region where your method loses.",
    ],
    evidence:
      "A frozen protocol, a tuned baseline, repeated runs, quality checks, raw data, analysis code, and independent reproduction of one figure.",
    clip: "0–15s: the question. 15–35s: the mechanism. 35–60s: controlled evidence. 60–90s: the failure region and the reproducible artifact.",
    visual: "speculation",
    artifact: "An experiment explorer + a research report",
    signal:
      "Research taste: a narrow question, strong controls, calibrated claims, and reproducibility.",
  },
};
export function PortfolioPage() {
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">BUILD IN PUBLIC</span>
        <h1>
          Work worth <em>showing.</em>
        </h1>
        <p>
          Leave with artifacts people can inspect, run, and remember. The demo
          earns attention. The evidence earns trust.
        </p>
      </div>
      <div className="portfolio-banner">
        <div>
          <span className="eyebrow">YOUR FINAL PORTFOLIO</span>
          <h2>
            Three systems. One original idea.
            <br />A body of work with substance.
          </h2>
        </div>
        <p>
          These are project specifications for you to build. The course’s visual
          labs illustrate the ideas; your final demos must connect to your own
          implementations and measurements.
        </p>
      </div>
      <div className="portfolio-list">
        {projects.map((p) => {
          const s = portfolio[p.id];
          return (
            <article className="portfolio-card" key={p.id}>
              <div className="portfolio-number">{p.number}</div>
              <div>
                <span className="eyebrow">{s.artifact}</span>
                <h2>{s.headline}</h2>
                <p>{s.hook}</p>
                <div className="portfolio-details">
                  <div>
                    <h3>
                      <Play size={16} />
                      The demo
                    </h3>
                    <p>{s.demo}</p>
                  </div>
                  <div>
                    <h3>
                      <FileText size={16} />
                      The blog post
                    </h3>
                    <ol>
                      {s.story.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ol>
                  </div>
                </div>
                <details>
                  <summary>
                    <Camera size={16} />
                    90-second demo storyboard
                  </summary>
                  <p>{s.clip}</p>
                </details>
                <details>
                  <summary>
                    <Check size={16} />
                    Evidence an experienced reviewer can verify
                  </summary>
                  <p>{s.evidence}</p>
                  <p>
                    <b>What this demonstrates:</b> {s.signal}
                  </p>
                </details>
                <div className="portfolio-actions">
                  <a className="button primary" href={`#/projects/${p.id}`}>
                    Open project brief
                    <ArrowRight size={16} />
                  </a>
                  <a className="text-button" href={`#/lab/${s.visual}`}>
                    Explore the concept
                    <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="callout">
        <Code2 size={24} />
        <div>
          <h3>Give every result a path back to the code.</h3>
          <p>
            Use the included experiment and portfolio-post templates. Label
            simulations, predictions, and hardware measurements explicitly.
            Never replace an unmeasured result with an attractive chart.
          </p>
          <a
            href={`${REPO}/blob/main/docs/PORTFOLIO_POST_TEMPLATE.md`}
            target="_blank"
            rel="noreferrer"
          >
            Open the writing template ↗
          </a>
        </div>
      </div>
    </>
  );
}
