"""Deterministic single-server camera replay. Capture time is preserved through the queue.

latest policy discards pending frames; neither policy preempts an in-flight inference.
Results drain after the arrival horizon. Report update gaps alongside freshness.
"""
import json


def simulate(policy='fifo',period_ms=33,service_ms=70,frames=120):
    if policy not in ('fifo','latest') or min(period_ms,service_ms,frames)<=0: raise ValueError('Invalid configuration')
    arrivals=[i*period_ms for i in range(frames)]
    now,index,dropped=0.0,0,0; queue=[]; results=[]
    while index<len(arrivals) or queue:
        if not queue and index<len(arrivals): now=max(now,arrivals[index])
        while index<len(arrivals) and arrivals[index]<=now:
            queue.append((index,arrivals[index])); index+=1
        if policy=='latest' and len(queue)>1:
            dropped+=len(queue)-1; queue=queue[-1:]
        seq,capture=queue.pop(0)
        now+=service_ms
        results.append({'sequence':seq,'capture_ms':capture,'complete_ms':now,'age_ms':now-capture})
    gaps=[b['complete_ms']-a['complete_ms'] for a,b in zip(results,results[1:])]
    ages=sorted(r['age_ms'] for r in results)
    return {'kind':'simulation, not robotics task success','policy':policy,'processed':len(results),'dropped':dropped,
            'p95_age_ms':ages[int(.95*(len(ages)-1))],'max_update_gap_ms':max(gaps,default=0),
            'deadline_miss_fraction_at_100ms':sum(r['age_ms']>100 for r in results)/len(results),
            'coverage':len(results)/frames,'results':results}


if __name__=='__main__':
    runs=[simulate('fifo'),simulate('latest')]
    for run in runs: run.pop('results')
    print(json.dumps(runs,indent=2))
