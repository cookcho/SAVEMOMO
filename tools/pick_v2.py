import json, math, glob, sys
def target(r):
    lv=r['lv'];t=0.13+0.5*math.exp(-lv/40)
    if r['boss']:t*=0.72
    elif lv%10==1 and lv>1:t*=1.15
    if r.get('intro'):t*=1.12
    return min(t,.75)
C={}
for v in range(4):
    for f in glob.glob(f'q{v}_*.json'):
        for r in json.load(open(f)): C[(r['lv'],v)]=r
def F_at(r,I):
    per=r['per']; 
    if not per: return 0
    return sum((0.5+0.5*hp/100) for w,hp,ink in per if w and ink<=I)/len(per)
SF={}
for v in range(4):
    for f in glob.glob(f's{v}_*.json'):
        for x in json.load(open(f)): SF[(x['lv'],v)]=x['iss']
chosen=[];out=[]
for lv in range(1,151):
    best=None
    for v in range(4):
        r=C.get((lv,v))
        if not r or not r['minInk']: continue
        need=r['minInk']; T=target(r)
        lo,hi=need*1.3,need*(2.6 if lv<=20 else 2.2 if lv<=50 else 1.9)
        I=lo
        while I<hi and F_at(r,I)<T: I+=10
        I=min(I,hi); Fv=F_at(r,I)
        cost=abs(Fv-T)
        if r['arch'] in [c['arch'] for c in chosen[-2:]] and r['arch']!='fall': cost+=0.2
        if r['arch']=='fall' and sum(1 for c in chosen[-2:] if c['arch']=='fall')==2: cost+=0.15  # 낙하 3연속은 피함
        if r.get('dead'): cost+=0.6*len(r['dead'])
        if SF.get((lv,v)): cost+=0.6*len(SF[(lv,v)])  # 맵 구조 문제(지형에 박힌 기지 등)  # 선 없이도 모모에게 못 오는 적이 있으면(장애물에 막힘 등) 피함
        if lv==2 and v!=1: cost+=1
        if best is None or cost<best[0]: best=(cost,v,r,round(I),Fv,T)
    if best is None: print('NO SOLUTION', lv); best=(9,0,C[(lv,0)],0,0,0)
    chosen.append(best[2]); out.append({'lv':lv,'v':best[1],'ink':best[3],'need':best[2]['minInk'] or 0,'F':round(best[4],3),'T':round(best[5],3),'arch':best[2]['arch'],'fall':best[2]['fall'],'hz':best[2]['hz'],'twin':best[2]['twin']})
json.dump(out,open('pickv2.json','w'))
err=sum(abs(o['F']-o['T']) for o in out)/len(out)
print('err',round(err,3))
from collections import Counter
print(Counter((o['arch']+('/'+o['fall'] if o['fall'] else '')) for o in out))
print(Counter(o['hz'] for o in out))
import statistics
print('need median',statistics.median([o['need'] for o in out]),'ink median',statistics.median([o['ink'] for o in out]))
for i in range(0,150,10): seg=out[i:i+10]; print(i+1,'need',round(sum(o['need'] for o in seg)/10),'ink',round(sum(o['ink'] for o in seg)/10),'F',round(sum(o['F'] for o in seg)/10,2),'T',round(sum(o['T'] for o in seg)/10,2))
