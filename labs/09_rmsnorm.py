"""Triton RMSNorm reference with correctness and synchronized CUDA-event timing.

Requires a supported NVIDIA GPU, CUDA-enabled PyTorch, and Triton. Run on Linux.
The reference uses FP32 accumulation. It is not claimed to beat vendor kernels.
"""
import argparse
import json
import statistics


try:
    import torch
    import triton
    import triton.language as tl
except ImportError:
    raise SystemExit('GPU lab requires CUDA PyTorch and Triton. See docs/COURSE_GUIDE.md; CPU labs need neither.')


@triton.jit
def kernel(X,W,Y,N:tl.constexpr,EPS:tl.constexpr,BLOCK:tl.constexpr):
    row=tl.program_id(0); cols=tl.arange(0,BLOCK); mask=cols<N
    x=tl.load(X+row*N+cols,mask=mask,other=0).to(tl.float32)
    w=tl.load(W+cols,mask=mask,other=0).to(tl.float32)
    variance=tl.sum(x*x,axis=0)/N
    y=x*tl.rsqrt(variance+EPS)*w
    tl.store(Y+row*N+cols,y,mask=mask)


def main():
    if not torch.cuda.is_available():
        raise SystemExit('No CUDA device available. Use the CPU online-softmax lab while provisioning a supported GPU.')

    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--rows',type=int,default=1024);p.add_argument('--width',type=int,default=4096)
    args=p.parse_args()
    if args.rows<1 or not 1<=args.width<=16384: raise SystemExit('rows must be positive; width must be 1..16384')
    torch.manual_seed(4);x=torch.randn(args.rows,args.width,device='cuda',dtype=torch.float16)
    w=torch.randn(args.width,device='cuda',dtype=torch.float16);y=torch.empty_like(x)
    def run(): kernel[(args.rows,)](x,w,y,args.width,1e-6,triton.next_power_of_2(args.width))
    reference=(x.float()*torch.rsqrt(x.float().square().mean(-1,keepdim=True)+1e-6)*w.float()).to(x.dtype)
    run();torch.testing.assert_close(y,reference,rtol=2e-3,atol=2e-3)
    for _ in range(30): run()
    torch.cuda.synchronize();samples=[]
    for _ in range(100):
        start=torch.cuda.Event(enable_timing=True);end=torch.cuda.Event(enable_timing=True)
        start.record();run();end.record();end.synchronize();samples.append(start.elapsed_time(end))
    print(json.dumps({'kind':'measured kernel latency','device':torch.cuda.get_device_name(),
        'torch':torch.__version__,'triton':triton.__version__,'shape':[args.rows,args.width],
        'dtype':'float16, FP32 reduction','warmup':30,'repeats':100,
        'median_ms':statistics.median(samples),'min_ms':min(samples),
        'max_abs_error':(y-reference).abs().max().item()},indent=2))


if __name__=='__main__': main()
