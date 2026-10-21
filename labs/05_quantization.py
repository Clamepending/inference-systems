"""Symmetric integer quantization and reconstruction; NOT an accelerated low-bit GEMM."""
import json
import random


def quantize(values, bits=8):
    if not values or bits<2 or bits>16: raise ValueError('Invalid values or bits')
    qmax=2**(bits-1)-1
    scale=max(abs(v) for v in values)/qmax or 1.0
    q=[max(-qmax,min(qmax,round(v/scale))) for v in values]
    return q,scale


def mse(a,b): return sum((x-y)**2 for x,y in zip(a,b))/len(a)


def experiment(bits=4):
    rng=random.Random(17)
    rows=[[rng.gauss(0, 20 if i==0 else .2) for _ in range(128)] for i in range(16)]
    flat=[x for row in rows for x in row]
    q,s=quantize(flat,bits)
    tensor=mse(flat,[v*s for v in q])
    reconstructed=[]
    for row in rows:
        qr,sr=quantize(row,bits)
        reconstructed.extend(v*sr for v in qr)
    return {'kind':'synthetic reconstruction error; not model quality or speed', 'bits':bits,
            'tensor_scale_mse':tensor,'per_row_scale_mse':mse(flat,reconstructed),
            'metadata_bytes_if_fp32_scale_per_row':len(rows)*4}


if __name__=='__main__':
    print(json.dumps([experiment(4),experiment(8)],indent=2))
