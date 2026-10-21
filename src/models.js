export function roofline({
  params = 7,
  batch = 1,
  context = 4096,
  heads = 8,
  bandwidth = 1,
  compute = 100,
  bytes = 2,
}) {
  const weightBytes = params * 1e9 * bytes;
  const kvBytes = 2 * 32 * heads * 128 * context * batch * 2;
  const flops = 2 * params * 1e9 * batch;
  return {
    weights: weightBytes / 1e9,
    kv: kvBytes / 2 ** 30,
    memoryMs: ((weightBytes + kvBytes) / (bandwidth * 1e12)) * 1000,
    computeMs: (flops / (compute * 1e12)) * 1000,
    intensity: flops / (weightBytes + kvBytes),
    ridge: compute / bandwidth,
  };
}
export function onlineSteps(
  scores = [2, 1, 4, 0, 3, 5],
  values = [1, 3, 2, 4, 0, 2],
) {
  let m = -Infinity,
    l = 0,
    o = 0;
  return scores.map((s, i) => {
    const next = Math.max(m, s),
      correction = Math.exp(m - next);
    l = l * correction + Math.exp(s - next);
    o = o * correction + Math.exp(s - next) * values[i];
    m = next;
    return { m, l, o, result: o / l, correction, score: s, value: values[i] };
  });
}
export function specExpected(a, gamma) {
  return Array.from({ length: gamma + 1 }, (_, i) => a ** i).reduce(
    (a, b) => a + b,
    0,
  );
}
export function freshness(policy, period = 33, service = 70, frames = 24) {
  const arrivals = Array.from({ length: frames }, (_, i) => i * period);
  let now = 0,
    index = 0,
    dropped = 0,
    queue = [],
    results = [];
  while (index < frames || queue.length) {
    if (!queue.length && index < frames) now = Math.max(now, arrivals[index]);
    while (index < frames && arrivals[index] <= now) {
      queue.push({ id: index, capture: arrivals[index] });
      index++;
    }
    if (policy === "latest" && queue.length > 1) {
      dropped += queue.length - 1;
      queue = queue.slice(-1);
    }
    const item = queue.shift();
    const start = now;
    now += service;
    results.push({ ...item, start, end: now, age: now - item.capture });
  }
  return {
    results,
    dropped,
    mean: results.reduce((s, r) => s + r.age, 0) / results.length,
    coverage: results.length / frames,
  };
}
export function schedulerTrace(chunked = true) {
  // Fixed instructional trace, equal work: A prefill 2 units, 4 decode units;
  // B arrives at 2, prefill 6 units, 3 decode units. Each slot is one time unit.
  const a = [{ type: "prefill", start: 0, end: 2 }];
  const b = [];
  if (chunked) {
    for (let i = 0; i < 4; i++)
      a.push({ type: "decode", start: 2 + i * 2, end: 3 + i * 2 });
    for (let i = 0; i < 4; i++)
      b.push({ type: "prefill", start: 3 + i * 2, end: 4 + i * 2 });
    b.push({ type: "prefill", start: 10, end: 12 });
    for (let i = 0; i < 3; i++)
      b.push({ type: "decode", start: 12 + i, end: 13 + i });
  } else {
    b.push({ type: "prefill", start: 2, end: 8 });
    for (let i = 0; i < 4; i++)
      a.push({ type: "decode", start: 8 + i, end: 9 + i });
    for (let i = 0; i < 3; i++)
      b.push({ type: "decode", start: 12 + i, end: 13 + i });
  }
  return { a, b, firstA: chunked ? 3 : 9, firstB: 13, finish: 15 };
}
