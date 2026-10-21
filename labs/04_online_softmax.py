"""Numerically stable streamed attention over scalar values; no N-by-N score matrix.

This CPU reference proves the recurrence, not the performance of a fused GPU kernel.
"""
import math
import random
import json


def dense(scores, values):
    if not scores or len(scores) != len(values):
        raise ValueError('Nonempty matching scores and values required')
    m=max(scores); weights=[math.exp(s-m) for s in scores]
    return sum(w*v for w,v in zip(weights,values))/sum(weights)


def online(scores, values, tile=16):
    if not scores or len(scores)!=len(values) or tile<1:
        raise ValueError('Invalid inputs')
    m, denominator, numerator = -math.inf, 0.0, 0.0
    trace=[]
    for start in range(0,len(scores),tile):
        block=scores[start:start+tile]; vals=values[start:start+tile]
        new_m=max(m,max(block)); correction=math.exp(m-new_m)
        exps=[math.exp(s-new_m) for s in block]
        denominator=denominator*correction+sum(exps)
        numerator=numerator*correction+sum(e*v for e,v in zip(exps,vals))
        m=new_m
        trace.append({'tokens':start+len(block),'max':m,'denominator':denominator,'output':numerator/denominator})
    return numerator/denominator, trace


if __name__=='__main__':
    rng=random.Random(7)
    scores=[rng.uniform(-1000,1000) for _ in range(131)]
    values=[rng.uniform(-2,2) for _ in scores]
    reference=dense(scores,values)
    errors={tile:abs(online(scores,values,tile)[0]-reference) for tile in [1,7,16,64,131]}
    assert max(errors.values())<1e-12
    print(json.dumps({'kind':'CPU numerical correctness demonstration','max_errors_by_tile':errors},indent=2))
