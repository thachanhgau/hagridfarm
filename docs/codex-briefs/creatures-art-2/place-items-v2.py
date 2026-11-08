"""Crop/place only; nearest-neighbour, no painting, alpha cleanup or quantization."""
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ORIGINAL = ROOT / 'garden-v05/masters-items/creatures-2/items-sheet.png'
MASTER = 'garden-v05/masters-items/creatures-2/items-sheet-v2.png'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
before = digest(ORIGINAL)
original = Image.open(ORIGINAL).convert('RGBA')
assert original.size == (1536, 1024)
out = original.copy()
inputs = json.loads((HERE / 'redo-items-inputs.json').read_text())
checks = []
for job in inputs:
    dest = HERE / f"{job['id']}-v2-candidate-{job['candidate']}.png"
    shutil.copyfile(job['generatedFile'], dest)
    job['componentSource'] = str(dest.relative_to(ROOT))
    im = Image.open(dest).convert('RGBA')
    # Threshold locates the crop rectangle only; source alpha is never rewritten.
    box = im.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()
    piece = im.crop(box)
    scale = min(320 / piece.width, 320 / piece.height)
    piece = piece.resize((round(piece.width * scale), round(piece.height * scale)), Image.Resampling.NEAREST)
    piece = piece.crop(piece.getchannel('A').getbbox())
    selected = (job['id'], job['candidate']) in [('produce_crup', 'A'), ('salamander_feed', 'B')]
    alpha = im.getchannel('A').histogram()
    checks.append({'id': job['id'], 'candidate': job['candidate'], 'selected': selected,
                   'sourceBounds': box, 'placedSize': piece.size,
                   'partialAlphaSourcePixels': sum(alpha[1:255]), 'sha256': digest(dest)})
    if selected:
        c, r = (0, 0) if job['id'] == 'produce_crup' else (2, 1)
        cell = Image.new('RGBA', (512, 512))
        cell.paste(piece, ((512 - piece.width) // 2, 440 - piece.height))
        bounds = cell.getchannel('A').getbbox()
        assert bounds[0] >= 48 and bounds[1] >= 48 and bounds[2] <= 464 and bounds[3] == 440
        out.paste(cell, (c * 512, r * 512))
        checks[-1]['cellBounds'] = bounds

out.save(ROOT / MASTER)
saved = Image.open(ROOT / MASTER).convert('RGBA')
for c, r in [(1, 0), (2, 0), (0, 1), (1, 1)]:
    box = (c * 512, r * 512, (c + 1) * 512, (r + 1) * 512)
    assert saved.crop(box).tobytes() == original.crop(box).tobytes()
assert digest(ORIGINAL) == before
manifest = json.loads((HERE / 'prompts.json').read_text())
for job in inputs:
    entry = dict(job, id=f"{job['id']}-v2-{job['candidate']}", master=MASTER,
                 referenceFiles=[], selected=(job['id'], job['candidate']) in [('produce_crup', 'A'), ('salamander_feed', 'B')])
    entry['generatedFiles'] = [job['generatedFile']]
    if not any(item['id'] == entry['id'] for item in manifest['items']):
        manifest['items'].append(entry)
selected = [job for job in inputs if (job['id'], job['candidate']) in [('produce_crup', 'A'), ('salamander_feed', 'B')]]
if not any(item['id'] == 'items-sheet-v2' for item in manifest['items']):
    manifest['items'].append({'id': 'items-sheet-v2', 'master': MASTER,
        'prompt': '\n\n'.join(job['prompt'] for job in selected),
        'generatedFiles': [job['generatedFile'] for job in selected],
        'componentSources': [job['componentSource'] for job in selected],
        'referenceFiles': [str(ORIGINAL.relative_to(ROOT))],
        'composition': 'Original RGBA pixels retained in four cells; replace (row1,col1) with fur A and (row2,col3) with twigs B. Crop rectangle from alpha>=128 bounds without rewriting alpha, fit within 320x320 using nearest-neighbour, centre horizontally, bottom-exclusive y440. No painting or alpha modification.'})
(HERE / 'prompts.json').write_text(json.dumps(manifest, indent=2) + '\n')
verification = {'master': MASTER, 'size': saved.size, 'originalSHA256': before,
                'masterSHA256': digest(ROOT / MASTER), 'unchangedCellsPixelExact': 4,
                'originalUnchanged': True, 'candidates': checks}
(HERE / 'items-v2-verification.json').write_text(json.dumps(verification, indent=2) + '\n')
print(json.dumps(verification, indent=2))
