"""A lower-bound calculator, not a GPU benchmark. Decimal GB/TB; binary GiB."""
import argparse
import json


def estimate(params=7e9, weight_bytes=2, layers=32, kv_heads=8, head_dim=128,
             context=4096, batch=1, bandwidth=1e12, compute=100e12, kv_bytes=2):
    values = [params, weight_bytes, layers, kv_heads, head_dim, context, batch, bandwidth, compute, kv_bytes]
    if any(v <= 0 for v in values):
        raise ValueError('All inputs must be positive')
    weights = params * weight_bytes
    kv = 2 * layers * kv_heads * head_dim * context * batch * kv_bytes
    # Approximate dense linear layers plus QK/AV attention arithmetic. Query heads
    # need their own configuration for an exact attention FLOP count; omit here.
    linear_flops = 2 * params * batch
    return {'kind': 'analytical lower bound; not measured', 'weight_GB': weights / 1e9,
            'kv_GiB': kv / 2**30, 'weight_only_ms': weights / bandwidth * 1000,
            'weight_plus_kv_read_ms': (weights + kv) / bandwidth * 1000,
            'linear_compute_ms': linear_flops / compute * 1000,
            'optimistic_step_ms': max((weights + kv) / bandwidth, linear_flops / compute) * 1000,
            'linear_arithmetic_intensity': linear_flops / weights}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--params-b', type=float, default=7)
    p.add_argument('--batch', type=int, default=1)
    p.add_argument('--context', type=int, default=4096)
    p.add_argument('--bandwidth-tbs', type=float, default=1)
    a = p.parse_args()
    print(json.dumps(estimate(params=a.params_b * 1e9, batch=a.batch, context=a.context,
                              bandwidth=a.bandwidth_tbs * 1e12), indent=2))
