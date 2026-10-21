"""Numerical and semantic tests for the educational reference labs."""
import importlib.util
import math
from pathlib import Path
import random
import sys
import unittest

def load(name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).resolve().parents[1]/'labs'/f'{name}.py')
    module=importlib.util.module_from_spec(spec);sys.modules[name]=module;spec.loader.exec_module(module);return module

cost=load('01_cost_model');scheduler=load('03_scheduler');softmax=load('04_online_softmax')
quant=load('05_quantization');moe=load('06_moe');spec=load('07_speculation');fresh=load('08_freshness')

class LabTests(unittest.TestCase):
    def test_units(self):
        r=cost.estimate();self.assertEqual(r['kv_GiB'],.5);self.assertEqual(r['weight_only_ms'],14)
        self.assertAlmostEqual(r['linear_compute_ms'],.14)
        with self.assertRaises(ValueError):cost.estimate(batch=0)

    def test_online_prefix_equivalence_and_extreme_scores(self):
        rng=random.Random(9)
        for n in [1,7,31,129]:
            scores=[rng.uniform(-1000,1000) for _ in range(n)];values=[rng.uniform(-3,3) for _ in scores]
            expected=softmax.dense(scores,values)
            for tile in [1,3,16,64]:
                actual,trace=softmax.online(scores,values,tile)
                self.assertAlmostEqual(actual,expected,places=12)
                for step in trace:self.assertAlmostEqual(step['output'],softmax.dense(scores[:step['tokens']],values[:step['tokens']]),places=12)

    def test_quantization_error_bound(self):
        values=[-3.1,-.003,0,.027,1.7]
        for bits in [4,8]:
            q,s=quant.quantize(values,bits)
            for a,b in zip(values,q):self.assertLessEqual(abs(a-b*s),s/2+1e-12)
        q,s=quant.quantize([0,0]);self.assertEqual(q,[0,0]);self.assertTrue(math.isfinite(s))
        self.assertLess(quant.experiment()['per_row_scale_mse'],quant.experiment()['tensor_scale_mse'])

    def test_dispatch_combine_matches_token_oracle(self):
        tokens=[1,2,-3];experts=[lambda x:x*2,lambda x:x*x,lambda x:-x]
        routes=[[(0,.2),(1,.8)],[(1,.5),(2,.5)],[(0,.7),(0,.3)]]
        expected=[sum(w*experts[e](x) for e,w in r) for x,r in zip(tokens,routes)]
        self.assertEqual(moe.dispatch_combine(tokens,routes,experts),expected)
        self.assertEqual(sum(moe.loads()['rank_token_counts']),4096)

    def test_exact_sampling_recovers_target(self):
        result=spec.experiment(n=120000)
        for p,q in zip(result['target'],result['empirical']):self.assertLess(abs(p-q),.006)
        rng=random.Random(1)
        self.assertTrue(all(spec.corrected_sample([.5,.5],[.5,.5],rng)[1] for _ in range(100)))
        self.assertAlmostEqual(spec.expected_tokens(.8,4),3.3616)

    def test_freshness_no_time_travel_and_full_accounting(self):
        fifo,latest=fresh.simulate('fifo'),fresh.simulate('latest')
        self.assertEqual(fifo['dropped'],0);self.assertEqual(fifo['processed'],120)
        self.assertEqual(latest['processed']+latest['dropped'],120)
        self.assertLess(latest['p95_age_ms'],fifo['p95_age_ms'])
        for run in [fifo,latest]:
            self.assertTrue(all(r['age_ms']>=70 for r in run['results']))
            ids=[r['sequence'] for r in run['results']];self.assertEqual(ids,sorted(set(ids)))
        self.assertEqual(fresh.simulate('latest',100,10)['coverage'],1)

    def test_scheduler_completion_and_timestamps(self):
        for policy in ['chunked','prefill-first']:
            result=scheduler.simulate(policy,count=8)
            self.assertEqual(len(result['events']),8)
            for e in result['events']:
                self.assertIn(len(e['token_times']),[16,32,64]);self.assertGreater(e['token_times'][0],e['arrival'])
                self.assertTrue(all(b>a for a,b in zip(e['token_times'],e['token_times'][1:])))
        self.assertEqual(scheduler.simulate(count=4),scheduler.simulate(count=4))

    @unittest.skipUnless(importlib.util.find_spec('torch'),'optional PyTorch not installed')
    def test_cached_decoder_chunk_and_position_equivalence(self):
        tiny=load('02_tiny_decoder');tiny.torch.set_num_threads(1)
        _,error=tiny.verify();self.assertLess(error,2e-5)

if __name__=='__main__':unittest.main()
