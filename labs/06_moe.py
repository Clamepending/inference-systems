"""MoE load and weighted dispatch/combine reference. Counts are not network timings."""
import json
import random


def dispatch_combine(tokens, routes, experts):
    buckets=[[] for _ in experts]
    for token_id,(x,routing) in enumerate(zip(tokens,routes)):
        for expert_id,weight in routing:
            buckets[expert_id].append((token_id,x,weight))
    out=[0.0]*len(tokens)
    for expert_id,bucket in enumerate(buckets):
        for token_id,x,weight in bucket:
            out[token_id]+=weight*experts[expert_id](x)
    return out


def loads(count=4096, expert_count=16, ranks=4, skew=1.4, seed=4, replicate=False):
    if count<1 or expert_count<ranks or ranks<1: raise ValueError('Invalid sizes')
    rng=random.Random(seed); weights=[1/(i+1)**skew for i in range(expert_count)]
    routes=rng.choices(range(expert_count),weights=weights,k=count)
    load=[0]*ranks; experts=[0]*expert_count
    for e in routes:
        owner=e%ranks
        # Toy replication policy: expert 0 is present on every rank; choose least loaded.
        if replicate and e==0: owner=min(range(ranks),key=lambda r:load[r])
        load[owner]+=1; experts[e]+=1
    return {'rank_token_counts':load,'expert_counts':experts,'max_to_mean':max(load)/(count/ranks),
            'additional_expert_copies':ranks-1 if replicate else 0}


if __name__=='__main__':
    print(json.dumps({'kind':'load simulation; equal per-token expert cost assumed',
                      'fixed':loads(),'replicated_hot_expert':loads(replicate=True)},indent=2))
