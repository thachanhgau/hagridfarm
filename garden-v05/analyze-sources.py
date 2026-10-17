"""Read-only PNG analysis. Writes metadata only; never edits a master image."""
from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT/'source-data.json').read_text())
fixes = {'dragon':'dragon-facing-v02.png','pumpkin':'pumpkin-consistency-v02.png',
         'three-headed-dog':'three-headed-dog-spacing-v02.png', 'bowtruckle':'bowtruckle-v03.png', 'puffskein':'puffskein-v03.png', 'mandrake':'mandrake-v03.png'}
def valley(a, ratio, radius):
    lo,hi=int(len(a)*(ratio-radius)),int(len(a)*(ratio+radius))
    ids=np.flatnonzero(a[lo:hi] == a[lo:hi].min())+lo
    groups=np.split(ids,np.where(np.diff(ids)>1)[0]+1)
    g=max(groups,key=lambda b:(len(b),-abs(b.mean()-len(a)*ratio)))
    return int(round(g.mean()))
report=[]
for item in data['items']:
    item.setdefault('originalFile',item['file'])
    if item['id'] in fixes: item['file']='masters/'+fixes[item['id']]
    a=np.asarray(Image.open(ROOT/item['file']).convert('RGBA'))
    mask=a[:,:,3]>=192
    h,w=mask.shape
    ys=[0]+[valley(mask.sum(1),r,.10) for r in [1/3,2/3]]+[h]
    frames=[]; cuts=[]
    for row in range(3):
        top,bottom=ys[row:row+2]
        xs=[0]+[valley(mask[top:bottom].sum(0),r,.07) for r in [.25,.5,.75]]+[w]
        for cut in xs[1:-1]: cuts.append(int(mask[top:bottom,cut].sum()))
        for col in range(4):
            left,right=xs[col:col+2]
            y,x=np.where(mask[top:bottom,left:right])
            x0,x1=left+int(x.min()),left+int(x.max())+1
            y0,y1=top+int(y.min()),top+int(y.max())+1
            foot=mask[max(y0,y1-max(3,int((y1-y0)*.06))):y1,x0:x1]
            fy,fx=np.where(foot)
            px=float(np.median(fx))
            frames.append(dict(x=x0,y=y0,w=x1-x0,h=y1-y0,pivotX=round(px,2),pivotY=y1-y0,
                               sourceCell=[left,top,right,bottom]))
    # The hop is authored above the ground line. Do not re-ground its feet.
    if item['id']=='puffskein':
        base=float(np.median([f['y']+f['h'] for f in frames[8:12]]))
        for f in frames[8:12]: f['pivotY']=base-f['y']
    item.update(width=w,height=h,frames=frames,sourceSha256=hashlib.sha256((ROOT/item['file']).read_bytes()).hexdigest())
    report.append(dict(id=item['id'],cuts=cuts,edgeOpaquePixels=int(mask[0].sum()+mask[-1].sum()+mask[:,0].sum()+mask[:,-1].sum())))
(ROOT/'source-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
(ROOT/'source-data.js').write_text('window.SOURCE_DATA='+json.dumps(data,ensure_ascii=False)+';')
(ROOT/'source-analysis.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
