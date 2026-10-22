"""Read-only PNG analysis. Writes metadata only; never edits a master image."""
from pathlib import Path
import json, hashlib
import sys
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
TARGET_ID = 'three-headed-dog'
TARGET_WHITE_MASTER = 'masters/three-headed-dog-white-v01.png'


def parse_only(argv):
    """Return the one supported scoped target, or None for a full analysis."""
    only = None
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == '--help':
            print('Usage: python3 analyze-sources.py [--only=three-headed-dog]')
            raise SystemExit(0)
        if arg == '--only':
            i += 1
            if i >= len(argv):
                raise SystemExit('--only requires an item id: three-headed-dog')
            value = argv[i]
        elif arg.startswith('--only='):
            value = arg.split('=', 1)[1]
        else:
            raise SystemExit(f'Unknown argument: {arg}')
        if only is not None:
            raise SystemExit('--only may be specified once')
        if value != TARGET_ID:
            raise SystemExit(f'Unsupported --only item: {value}; expected {TARGET_ID}')
        only = value
        i += 1
    return only


only = parse_only(sys.argv[1:])
data = json.loads((ROOT/'source-data.json').read_text())
fixes = {'dragon':'dragon-facing-v02.png','pumpkin':'pumpkin-consistency-v02.png',
         'three-headed-dog':'three-headed-dog-white-v01.png', 'bowtruckle':'bowtruckle-v03.png', 'puffskein':'puffskein-v03.png', 'mandrake':'mandrake-v03.png'}


def valley(a, ratio, radius):
    lo,hi=int(len(a)*(ratio-radius)),int(len(a)*(ratio+radius))
    ids=np.flatnonzero(a[lo:hi] == a[lo:hi].min())+lo
    groups=np.split(ids,np.where(np.diff(ids)>1)[0]+1)
    g=max(groups,key=lambda b:(len(b),-abs(b.mean()-len(a)*ratio)))
    return int(round(g.mean()))
report=[]
if only:
    target = next((item for item in data['items'] if item['id'] == only), None)
    if target is None:
        raise SystemExit(f'No source-data item found for --only={only}')
    selected = [target]
else:
    selected = data['items']

for item in selected:
    item.setdefault('originalFile',item['file'])
    if only and item['id'] == TARGET_ID:
        item['file'] = TARGET_WHITE_MASTER
    elif item['id'] in fixes:
        item['file']='masters/'+fixes[item['id']]
    source_path = ROOT/item['file']
    if not source_path.is_file():
        raise SystemExit(f'Missing source master for {item["id"]}: {item["file"]}')
    a=np.asarray(Image.open(source_path).convert('RGBA'))
    mask=a[:,:,3]>=192
    h,w=mask.shape
    rows = 4 if item['id'] == TARGET_ID else 3
    item['sourceRows'] = rows
    item['sourceColumns'] = 4
    ys=[0]+[valley(mask.sum(1),r,.10) for r in [i/rows for i in range(1, rows)]]+[h]
    frames=[]; cuts=[]
    for row in range(rows):
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
    if item['id']=='puffskein' and len(frames) >= 12:
        base=float(np.median([f['y']+f['h'] for f in frames[8:12]]))
        for f in frames[8:12]: f['pivotY']=base-f['y']
    item.update(width=w,height=h,frames=frames,sourceSha256=hashlib.sha256(source_path.read_bytes()).hexdigest())
    report.append(dict(id=item['id'],cuts=cuts,edgeOpaquePixels=int(mask[0].sum()+mask[-1].sum()+mask[:,0].sum()+mask[:,-1].sum())))

if only:
    existing_report_path = ROOT/'source-analysis.json'
    if existing_report_path.is_file():
        existing_report = json.loads(existing_report_path.read_text())
        report = [row for row in existing_report if row.get('id') != only] + report
(ROOT/'source-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
(ROOT/'source-data.js').write_text('window.SOURCE_DATA='+json.dumps(data,ensure_ascii=False)+';')
(ROOT/'source-analysis.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
