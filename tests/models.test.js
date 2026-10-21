import test from "node:test";
import assert from "node:assert/strict";
import {
  roofline,
  onlineSteps,
  specExpected,
  freshness,
  schedulerTrace,
} from "../src/models.js";
import { validateProgress } from "../src/storage.js";

test("roofline uses bytes and separates decimal GB from GiB", () => {
  const r = roofline({
    params: 7,
    batch: 1,
    context: 4096,
    heads: 8,
    bandwidth: 1,
    compute: 100,
    bytes: 2,
  });
  assert.equal(r.weights, 14);
  assert.equal(r.kv, 0.5);
  assert.ok(Math.abs(r.computeMs - 0.14) < 1e-12);
  assert.ok(Math.abs(r.memoryMs - 14.536870912) < 1e-10);
});
test("streamed attention matches independent dense softmax at every prefix", () => {
  const scores = [2, 1, 4, 0, 3, 5],
    values = [1, 3, 2, 4, 0, 2];
  onlineSteps(scores, values).forEach((step, i) => {
    const w = scores.slice(0, i + 1).map(Math.exp);
    const expected =
      w.reduce((s, x, j) => s + x * values[j], 0) /
      w.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(step.result - expected) < 1e-12);
  });
});
test("speculation includes the correction or bonus token", () => {
  assert.equal(specExpected(0, 4), 1);
  assert.equal(specExpected(1, 4), 5);
  assert.ok(Math.abs(specExpected(0.8, 4) - 3.3616) < 1e-12);
});
test("freshness accounting preserves source time and reports the coverage cost", () => {
  const a = freshness("fifo"),
    b = freshness("latest");
  assert.equal(a.results.length, 24);
  assert.equal(a.dropped, 0);
  assert.equal(b.results.length + b.dropped, 24);
  assert.ok(b.mean < a.mean);
  assert.ok(b.coverage < 1);
  for (const r of b.results)
    assert.ok(r.start >= r.capture && r.age === r.end - r.capture);
  const light = freshness("latest", 100, 10);
  assert.equal(light.dropped, 0);
  assert.equal(light.mean, 10);
});
test("scheduling visualization conserves work and shifts latency", () => {
  const a = schedulerTrace(true),
    b = schedulerTrace(false);
  const work = (trace) =>
    [...trace.a, ...trace.b].reduce((s, x) => s + x.end - x.start, 0);
  assert.equal(work(a), 15);
  assert.equal(work(b), 15);
  assert.ok(a.firstA < b.firstA);
  for (const trace of [a, b]) {
    const all = [...trace.a, ...trace.b].sort((x, y) => x.start - y.start);
    all.slice(1).forEach((x, i) => assert.ok(x.start >= all[i].end));
  }
});
test("progress import rejects malformed roots and strips unexpected keys", () => {
  assert.throws(() =>
    validateProgress({ version: 1, lessons: [], projects: {} }),
  );
  assert.throws(() =>
    validateProgress({ version: 2, lessons: {}, projects: {} }),
  );
  const clean = validateProgress({
    version: 1,
    lessons: {
      "01": {
        notes: "hello",
        complete: true,
        exercises: [0, 1, 8],
        quiz: { score: 100, answers: [1, 9], submitted: true },
      },
      99: { notes: "bad" },
    },
    projects: { engine: [1, 20], unknown: [0] },
    admin: true,
  });
  assert.equal(clean.lessons["01"].notes, "hello");
  assert.deepEqual(clean.lessons["01"].exercises, [0, 1]);
  assert.equal(clean.lessons["01"].quiz.score, 5);
  assert.equal(clean.lessons["99"], undefined);
  assert.equal(clean.admin, undefined);
  assert.deepEqual(clean.projects.engine, [1]);
});

test("unfinished evidence survives progress round trips without duplicate credit", () => {
  const original = {
    version: 1,
    lessons: {
      "02": {
        complete: false,
        checklist: [0, 0, 2, 9, "1"],
        exercises: [1, 1, 2],
      },
    },
    projects: {},
  };
  const restored = validateProgress(JSON.parse(JSON.stringify(original)));
  assert.deepEqual(restored.lessons["02"].checklist, [0, 2]);
  assert.deepEqual(restored.lessons["02"].exercises, [1, 2]);
  assert.equal(restored.lessons["02"].complete, false);
  assert.deepEqual(
    validateProgress(JSON.parse(JSON.stringify(restored))),
    restored,
  );
});
