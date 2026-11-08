"""Place generated artwork only; no painting, palette reduction or native export."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
RECORDS = Path(__file__).with_name('generation-records.json')

def bounds(im):
    # Ignore faint generation residue for placement; preserve the source alpha.
    return im.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()

def sheet(im, cols, rows, cell, kind):
    out = Image.new('RGBA', (cols * cell, rows * cell))
    pieces = []
    for row in range(rows):
        for col in range(cols):
            piece = im.crop((round(col * im.width / cols), round(row * im.height / rows),
                             round((col + 1) * im.width / cols), round((row + 1) * im.height / rows)))
            box = bounds(piece)
            if not box:
                raise ValueError('Empty source cell')
            pieces.append((row, col, piece.crop(box)))
    if kind == 'motion':
        scale = min(min(192 / p.width, 180 / p.height) for _, _, p in pieces)
    for row, col, p in pieces:
        if kind == 'items':
            scale = min(416 / p.width, 380 / p.height)
        elif kind == 'growth':
            scale = min(192 / p.width, [65, 100, 135, 170][col] / p.height)
        p = p.resize((round(p.width * scale), round(p.height * scale)), Image.Resampling.NEAREST)
        base = 440 if kind == 'items' else 210
        out.alpha_composite(p, (col * cell + (cell - p.width) // 2, row * cell + base - p.height))
    return out

jobs = json.loads(RECORDS.read_text())
for job in jobs:
    dest = ROOT / job['master']
    if dest.exists():
        raise FileExistsError(dest)
    im = Image.open(job['generatedFile']).convert('RGBA')
    ident = job['id']
    if 'motion' in ident:
        im = sheet(im, 4, 4, 256, 'motion')
    elif ident == 'grindylow-growth-v01':
        im = sheet(im, 4, 2, 256, 'growth')
    elif ident == 'items-sheet':
        im = sheet(im, 2, 2, 512, 'items')
    else:
        im = im.resize(tuple(job['size']), Image.Resampling.NEAREST)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest)
    print(ident, im.size, dest.relative_to(ROOT))

prompts = ROOT / 'garden-v05/environment/pond/prompts.json'
data = json.loads(prompts.read_text()) if prompts.exists() else {'items': []}
data['items'].extend({k: job[k] for k in ['id', 'master', 'prompt', 'generatedFile', 'referenceFiles']} for job in jobs)
prompts.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
