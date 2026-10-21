"""Exact one-token rejection correction for a finite categorical target.

Extending this to autoregressive multi-token verification is a learner task.
The speedup function assumes constant independent acceptance and fixed round costs.
"""
import random
import json


def sample(weights,rng): return rng.choices(range(len(weights)),weights=weights,k=1)[0]


def corrected_sample(p,q,rng):
    proposal=sample(q,rng)
    if rng.random()<min(1,p[proposal]/q[proposal]): return proposal,True
    residual=[max(0,a-b) for a,b in zip(p,q)]
    # A rejected proposal guarantees positive residual mass for normalized p,q.
    return sample(residual,rng),False


def expected_tokens(acceptance,gamma):
    if not 0<=acceptance<=1 or gamma<0: raise ValueError('Invalid acceptance or draft length')
    return sum(acceptance**i for i in range(gamma+1))


def experiment(n=100000,seed=23):
    rng=random.Random(seed); p=[.55,.30,.15]; q=[.20,.35,.45]
    counts=[0]*3; accepted=0
    for _ in range(n):
        token,ok=corrected_sample(p,q,rng); counts[token]+=1; accepted+=ok
    return {'kind':'Monte Carlo correctness experiment','target':p,'draft':q,
            'empirical':[c/n for c in counts],'acceptance':accepted/n,
            'theoretical_acceptance':sum(min(a,b) for a,b in zip(p,q))}


if __name__=='__main__': print(json.dumps(experiment(),indent=2))
