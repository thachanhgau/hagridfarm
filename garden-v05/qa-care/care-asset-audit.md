# Garden v05 care asset audit: PASS

Filesystem-only verification. This report does not claim browser rendering or interaction proof.

- Scope: 6 species / 24 care PNG frames.
- Palette: exact match to `motion-data.json`: `True`; alpha threshold `192`.
- Original level/master preservation: `True` (300/300 hashes preserved).
- Contact sheet: [`contact-sheet.html`](./contact-sheet.html).
- Runtime data contract: [`runtime-contract-check.json`](./runtime-contract-check.json) is a separate VM-only check; it confirms eight frames per target, growth `[0,1,2,3]`, and the requested idle/eat/care clips.

## Species

| Species | Canvas/pivot | Neutral scale | Output edge/clipping | Clips/timing | Result |
| --- | --- | ---: | --- | --- | --- |
| `mooncalf` | 96×128 / 48,112 | 0.295302 | edge frames 0; clipped `False` | finite `True` | `True` |
| `kneazle` | 96×96 / 48,80 | 0.249042 | edge frames 0; clipped `False` | finite `True` | `True` |
| `diricawl` | 96×96 / 48,80 | 0.224806 | edge frames 0; clipped `False` | finite `True` | `True` |
| `fwooper` | 96×96 / 48,80 | 0.250000 | edge frames 0; clipped `False` | finite `True` | `True` |
| `thestral` | 160×160 / 80,144 | 0.353535 | edge frames 0; clipped `False` | finite `True` | `True` |
| `unicorn` | 160×160 / 80,144 | 0.365854 | edge frames 0; clipped `False` | finite `True` | `True` |

## Cautions

- None.

## Issues

- None.

## Re-run

```sh
PYTHON=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
ROOT=/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/garden-v05
$PYTHON $ROOT/qa-care/verify_care_assets.py --root $ROOT
```
