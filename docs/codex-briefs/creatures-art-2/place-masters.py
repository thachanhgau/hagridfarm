"""Crop/place generated art only, nearest-neighbour; no painting or quantization."""
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent

def bounds(im):
    return im.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()

def cuts(im, count, axis):
    """Find the largest transparent gutters, not nominal source-cell edges."""
    a = im.getchannel('A')
    length, breadth = (im.width, im.height) if axis == 'x' else (im.height, im.width)
    data = a.load()
    occupied = [sum((data[i, j] if axis == 'x' else data[j, i]) >= 128
                    for j in range(breadth)) >= 4 for i in range(length)]
    ink = [i for i, value in enumerate(occupied) if value]
    if not ink:
        raise ValueError('Empty source')
    gaps = []
    start = None
    for i in range(ink[0], ink[-1]+1):
        if not occupied[i] and start is None:
            start = i
        elif occupied[i] and start is not None:
            gaps.append((i-start, (start+i)//2))
            start = None
    chosen = sorted(gaps, reverse=True)[:count-1]
    if len(chosen) != count-1 or min(gap for gap, _ in chosen) < 16:
        raise ValueError('Insufficient transparent gutters')
    return [0] + sorted(mid for _, mid in chosen) + [length]

def place_sheet(im, cols, rows, cell, kind, species):
    pieces = []
    ys = cuts(im, rows, 'y')
    for r in range(rows):
        row_im = im.crop((0, ys[r], im.width, ys[r+1]))
        xs = cuts(row_im, cols, 'x')
        for c in range(cols):
            p = row_im.crop((xs[c], 0, xs[c+1], row_im.height))
            box = bounds(p)
            if box is None:
                raise ValueError(f'Empty cell {r},{c}')
            pieces.append((r, c, p.crop(box)))
    out = Image.new('RGBA', (cols*cell, rows*cell))
    if kind == 'motion':
        scale = min(min(192/p.width, 180/p.height) for _, _, p in pieces)
    for r, c, p in pieces:
        if kind == 'items':
            scale = min(400/p.width, 360/p.height)
        elif kind == 'growth':
            adult = {'crup': 150, 'knarl': 135, 'salamander': 110}[species]
            target = round(adult * [0.38, 0.59, 0.79, 1][c])
            scale = min(192/p.width, target/p.height)
        p = p.resize((max(1, round(p.width*scale)), max(1, round(p.height*scale))), Image.Resampling.NEAREST)
        base = 440 if kind == 'items' else 210
        out.alpha_composite(p, (c*cell+(cell-p.width)//2, r*cell+base-p.height))
    return out

for job in json.loads((HERE/'prompts.json').read_text())['items']:
    dest = ROOT/job['master']
    if dest.exists():
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    if job['master'].startswith('docs/'):
        shutil.copyfile(job['generatedFile'], dest)
        continue
    if job.get('componentSources'):
        out = Image.new('RGBA', (1536, 1024))
        for i, source in enumerate(job['componentSources']):
            p = Image.open(ROOT/source).convert('RGBA')
            p = p.crop(bounds(p))
            scale = min(400/p.width, 360/p.height)
            p = p.resize((round(p.width*scale), round(p.height*scale)), Image.Resampling.NEAREST)
            out.alpha_composite(p, ((i%3)*512+(512-p.width)//2, (i//3)*512+440-p.height))
        out.save(dest)
        print(job['id'], out.size)
        continue
    im = Image.open(job['generatedFile']).convert('RGBA')
    ident = job['id']
    if '-motion-' in ident:
        im = place_sheet(im, 4, 4, 256, 'motion', ident.split('-')[0])
    elif '-growth-' in ident:
        im = place_sheet(im, 4, 2, 256, 'growth', ident.split('-')[0])
    elif ident == 'items-sheet':
        im = place_sheet(im, 3, 2, 512, 'items', '')
    else:
        box = bounds(im)
        if box is None:
            raise ValueError('Empty object')
        im = im.crop(box)
        scale = min(800/im.width, 800/im.height)
        im = im.resize((round(im.width*scale), round(im.height*scale)), Image.Resampling.NEAREST)
        canvas = Image.new('RGBA', (1024, 1024))
        canvas.alpha_composite(im, ((1024-im.width)//2, (1024-im.height)//2))
        im = canvas
    im.save(dest)
    print(ident, im.size)
