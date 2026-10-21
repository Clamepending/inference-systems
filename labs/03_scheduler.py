"""Deterministic scheduling simulation. Times come from a toy cost model, NOT GPU measurements.

Extend this with KV admission, page ownership, cancellation, and real model execution.
The reference intentionally isolates mixed prefill/decode interference.
"""
import argparse
import json
import random
from dataclasses import dataclass, field


@dataclass
class Request:
    id: int
    arrival: float
    prompt: int
    output: int
    remaining: int = 0
    tokens: list = field(default_factory=list)

    def __post_init__(self):
        self.remaining = self.prompt


def percentile(values, q):
    if not values:
        return 0.0
    ordered = sorted(values)
    return ordered[min(len(ordered)-1, int((len(ordered)-1)*q))]


def simulate(policy='chunked', seed=7, count=48, chunk=128):
    if policy not in ('chunked', 'prefill-first') or count < 1 or chunk < 1:
        raise ValueError('Invalid scheduler configuration')
    rng = random.Random(seed)
    requests = [Request(i, i * 11.0, rng.choice([128, 512, 2048]), rng.choice([16, 32, 64])) for i in range(count)]
    now, steps = 0.0, 0
    while any(len(r.tokens) < r.output for r in requests):
        active = [r for r in requests if r.arrival <= now and len(r.tokens) < r.output]
        if not active:
            now = min(r.arrival for r in requests if r.arrival > now)
            continue
        prefill = next((r for r in active if r.remaining), None)
        decodes = [r for r in active if r.remaining == 0]
        if policy == 'prefill-first' and prefill:
            decodes = []
        n = min(prefill.remaining, chunk) if prefill and policy == 'chunked' else (prefill.remaining if prefill else 0)
        # Deliberately simple additive cost: overhead + prefill token cost + per-sequence decode cost.
        now += 0.3 + n * 0.018 + len(decodes) * 0.12
        for r in decodes:
            r.tokens.append(now)
        if prefill:
            prefill.remaining -= n
            if prefill.remaining == 0:
                prefill.tokens.append(now)  # prefill logits generate the first token
        steps += 1
    ttft = [r.tokens[0] - r.arrival for r in requests]
    itl = [b-a for r in requests for a,b in zip(r.tokens,r.tokens[1:])]
    good = sum(r.tokens[0]-r.arrival <= 100 and max([b-a for a,b in zip(r.tokens,r.tokens[1:])],default=0) <= 20 for r in requests)
    return {'kind':'simulation, milliseconds', 'policy':policy, 'seed':seed, 'requests':count,
            'steps':steps, 'p95_ttft_ms':percentile(ttft,.95), 'p95_itl_ms':percentile(itl,.95),
            'elapsed_ms':now, 'tokens_per_second':sum(r.output for r in requests)/(now/1000),
            'request_goodput_per_second':good/(now/1000),
            'slo':'TTFT <=100ms and maximum per-request ITL <=20ms',
            'events':[{'id':r.id,'arrival':r.arrival,'token_times':r.tokens} for r in requests]}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--policy', choices=['chunked','prefill-first'],default='chunked')
    p.add_argument('--chunk',type=int,default=128)
    p.add_argument('--events',action='store_true')
    a=p.parse_args(); result=simulate(a.policy,chunk=a.chunk)
    if not a.events: result.pop('events')
    print(json.dumps(result,indent=2))
