"""A tiny random causal decoder with explicit per-layer KV caches.

Requires PyTorch. No checkpoint download. Compares cached and uncached logits,
including multi-token suffixes and absolute position offsets. Random weights
are for correctness, not meaningful text generation or serving comparisons.
"""
import argparse
import json
import math
import statistics
import time

try:
    import torch
    from torch import nn
except ImportError:
    raise SystemExit('Install the optional dependency first: python -m pip install torch')


class Block(nn.Module):
    def __init__(self, width=64, heads=4):
        super().__init__(); self.heads=heads; self.dim=width//heads
        self.norm1=nn.LayerNorm(width); self.qkv=nn.Linear(width,width*3,bias=False)
        self.proj=nn.Linear(width,width,bias=False); self.norm2=nn.LayerNorm(width)
        self.mlp=nn.Sequential(nn.Linear(width,width*4),nn.GELU(),nn.Linear(width*4,width))

    def forward(self,x,cache=None):
        b,t,c=x.shape
        q,k,v=self.qkv(self.norm1(x)).chunk(3,dim=-1)
        q,k,v=[a.view(b,t,self.heads,self.dim).transpose(1,2) for a in (q,k,v)]
        past=0 if cache is None else cache[0].shape[-2]
        if cache is not None:
            k=torch.cat([cache[0],k],dim=-2); v=torch.cat([cache[1],v],dim=-2)
        score=q@k.transpose(-1,-2)/math.sqrt(self.dim)
        # Query positions are global. A chunk-local triangular mask is insufficient.
        query_positions=past+torch.arange(t,device=x.device)
        key_positions=torch.arange(k.shape[-2],device=x.device)
        allowed=key_positions[None,:]<=query_positions[:,None]
        score=score.masked_fill(~allowed,float('-inf'))
        y=(score.softmax(-1)@v).transpose(1,2).contiguous().view(b,t,c)
        x=x+self.proj(y); x=x+self.mlp(self.norm2(x))
        return x,(k,v)


class Decoder(nn.Module):
    def __init__(self,vocab=128,width=64,layers=2,max_length=512):
        super().__init__(); self.token=nn.Embedding(vocab,width); self.position=nn.Embedding(max_length,width)
        self.blocks=nn.ModuleList([Block(width) for _ in range(layers)])
        self.norm=nn.LayerNorm(width); self.head=nn.Linear(width,vocab,bias=False)

    def forward(self,tokens,caches=None):
        offset=0 if caches is None else caches[0][0].shape[-2]
        x=self.token(tokens)+self.position(torch.arange(offset,offset+tokens.shape[1],device=tokens.device))
        new=[]
        for i,block in enumerate(self.blocks):
            x,c=block(x,None if caches is None else caches[i]); new.append(c)
        return self.head(self.norm(x)),new


@torch.inference_mode()
def verify(device='cpu'):
    torch.manual_seed(42); model=Decoder().to(device).eval()
    errors=[]
    for batch,length in [(1,1),(1,17),(2,31)]:
        tokens=torch.randint(0,128,(batch,length),device=device)
        reference,_=model(tokens)
        for chunk in [1,3,7]:
            parts=[]; caches=None
            for start in range(0,length,chunk):
                logits,caches=model(tokens[:,start:start+chunk],caches); parts.append(logits)
            cached=torch.cat(parts,dim=1)
            error=(reference-cached).abs().max().item(); errors.append(error)
            torch.testing.assert_close(cached,reference,rtol=2e-4,atol=2e-5)
    return model,max(errors)


@torch.inference_mode()
def benchmark(model,device='cpu',prompt=64,output=16,repeats=7):
    ids=torch.randint(0,128,(1,prompt+output),device=device)
    def sync():
        if device.startswith('cuda'): torch.cuda.synchronize()
        elif device=='mps': torch.mps.synchronize()
    def run(cached):
        cache=None
        for n in range(prompt,prompt+output):
            if cached:
                _,cache=model(ids[:,:n] if cache is None else ids[:,n-1:n],cache)
            else: model(ids[:,:n])
    timing={}
    for cached in (False,True):
        for _ in range(2): run(cached)
        sync(); samples=[]
        for _ in range(repeats):
            sync(); start=time.perf_counter(); run(cached); sync()
            samples.append((time.perf_counter()-start)*1000)
        timing['cached' if cached else 'uncached']={'median_ms':statistics.median(samples),'samples_ms':samples}
    return timing


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('--device',default='cpu')
    p.add_argument('--benchmark',action='store_true'); args=p.parse_args()
    torch.set_num_threads(1)
    model,error=verify(args.device)
    result={'kind':'random-weight decoder correctness','device':args.device,'torch':torch.__version__,
            'maximum_logit_error':error,'tested':'single-token and chunked suffixes, batch sizes 1/2, position offsets'}
    if args.benchmark: result['measured_tiny_model_timings']=benchmark(model,args.device)
    print(json.dumps(result,indent=2))
