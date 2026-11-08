"""Crop/place generated masters only. Nearest-neighbour; no painting or quantizing."""
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent

def bounds(im):
    return im.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()

def cuts(im, count, axis):
    alpha = im.getchannel('A')
    length, breadth = (im.width, im.height) if axis == 'x' else (im.height, im.width)
    data = alpha.load()
    occupied = [sum((data[i,j] if axis == 'x' else data[j,i]) >= 128
                    for j in range(breadth)) >= 4 for i in range(length)]
    ink = [i for i,v in enumerate(occupied) if v]
    gaps, start = [], None
    for i in range(ink[0], ink[-1]+1):
        if not occupied[i] and start is None:
            start = i
        elif occupied[i] and start is not None:
            gaps.append((i-start, (start+i)//2))
            start = None
    chosen = sorted(gaps, reverse=True)[:count-1]
    assert len(chosen) == count-1 and min(g for g,_ in chosen) >= 16
    return [0] + sorted(mid for _,mid in chosen) + [length]

def sheet(im, rows):
    pieces = []
    ys = cuts(im, rows, 'y')
    for r in range(rows):
        row = im.crop((0,ys[r],im.width,ys[r+1]))
        xs = cuts(row,4,'x')
        for c in range(4):
            p = row.crop((xs[c],0,xs[c+1],row.height))
            pieces.append((r,c,p.crop(bounds(p))))
    scale = min(min(192/p.width,174/p.height) for _,_,p in pieces)
    out = Image.new('RGBA',(1024,rows*256))
    for r,c,p in pieces:
        factor = scale if rows == 4 else min(192/p.width,[63,97,132,164][c]/p.height)
        p = p.resize((round(p.width*factor),round(p.height*factor)),Image.Resampling.NEAREST)
        out.alpha_composite(p,(c*256+(256-p.width)//2,r*256+210-p.height))
    return out

checks = []
for job in json.loads((HERE/'prompts-creatures.json').read_text())['items']:
    dest = ROOT/job['master']
    if dest.exists():
        continue
    if job['master'].startswith('docs/'):
        shutil.copyfile(job['generatedFile'],dest)
        continue
    im = Image.open(job['generatedFile']).convert('RGBA')
    rows = 4 if '-motion-' in job['id'] else 2 if '-growth-' in job['id'] else 0
    if rows:
        im = sheet(im,rows)
    else:
        im = im.crop(bounds(im))
        factor = min(800/im.width,800/im.height)
        im = im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST)
        out = Image.new('RGBA',(1024,1024))
        out.alpha_composite(im,((1024-im.width)//2,(1024-im.height)//2))
        im = out
    im.save(dest)
    cells = []
    if rows:
        for r in range(rows):
            for c in range(4):
                box = bounds(im.crop((c*256,r*256,(c+1)*256,(r+1)*256)))
                assert box and box[3] == 210 and box[0] >= 32 and box[2] <= 224
                assert box[1] >= 32
                cells.append(list(box))
    alpha = im.getchannel('A').histogram()
    assert alpha[0] > 0 and alpha[255] > 0
    checks.append(dict(id=job['id'],path=job['master'],size=list(im.size),cells=cells,
                       transparentPixels=alpha[0],partialAlphaPixels=sum(alpha[1:255]),
                       sha256=hashlib.sha256(dest.read_bytes()).hexdigest()))
    print(job['id'],im.size,len(cells))
(HERE/'verification-creatures.json').write_text(json.dumps(checks,indent=2)+'\n')
