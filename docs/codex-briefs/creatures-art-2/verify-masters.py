"""Read-only master geometry/provenance checks; writes evidence beside this file."""
from pathlib import Path
import json
import hashlib
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
data = json.loads((HERE/'prompts.json').read_text())
selected = [j for j in data['items'] if j['master'].startswith('garden-v05/')]
assert len(selected) == 16
for job in data['items']:
    assert all(k in job for k in ['id', 'master', 'prompt', 'generatedFile', 'referenceFiles'])
    assert (ROOT/job['generatedFile']).is_file()
    assert (ROOT/job['master']).is_file()
    for ref in job['referenceFiles']:
        assert (ROOT/ref).is_file(), ref

proof = []
for job in selected:
    path = ROOT/job['master']
    im = Image.open(path).convert('RGBA')
    alpha = im.getchannel('A')
    hist = alpha.histogram()
    growth = 'growth' in job['id']
    motion = 'motion' in job['id']
    items = job['id'] == 'items-sheet'
    expected = (1024, 512) if growth else (1536, 1024) if items else (1024, 1024)
    assert im.size == expected, (job['id'], im.size)
    assert hist[0] > 0 and sum(hist[128:]) > 0
    entry = {'id': job['id'], 'master': job['master'], 'size': list(im.size),
             'alphaZero': hist[0], 'alphaPartial': sum(hist[1:255]),
             'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    if growth or motion or items:
        cell = 512 if items else 256
        cols = 3 if items else 4
        rows = 2 if growth or items else 4
        base = 440 if items else 210
        margin = 48 if items else 32
        boxes = []
        for row in range(rows):
            for col in range(cols):
                box = alpha.crop((col*cell, row*cell, (col+1)*cell, (row+1)*cell))
                box = box.point(lambda a: 255 if a >= 128 else 0).getbbox()
                assert box and box[3] == base, (job['id'], row, col, box)
                assert min(box[0], cell-box[2]) >= margin, (job['id'], row, col, box)
                if items:
                    assert min(box[1], cell-box[3]) >= margin, (job['id'], row, col, box)
                elif row:
                    above = boxes[(row-1)*cols+col]
                    assert cell-above[3]+box[1] >= 32, (job['id'], row, col, box)
                boxes.append(list(box))
        entry['cellBoundsAlpha128'] = boxes
        if growth:
            heights = [b[3]-b[1] for b in boxes]
            entry['growthHeights'] = heights
            for start in [0, 4]:
                assert 2 <= heights[start+3]/heights[start] <= 3
    proof.append(entry)
(HERE/'verification.json').write_text(json.dumps({'masters': proof, 'promptRecords': len(data['items']), 'refusals': []}, indent=2)+'\n')
print(f'PASS: {len(selected)} masters, {len(data["items"])} prompt records; sizes, real alpha, margins, baselines and growth ratios.')
for entry in proof:
    if 'growthHeights' in entry:
        print(entry['id'], entry['growthHeights'])
