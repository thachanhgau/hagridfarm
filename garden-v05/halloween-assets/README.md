# Hagrid Farm — Halloween

Complete artwork package: **30/30 items, 60 views**. The original five masters
are retained byte for byte; the remaining 25 masters complete the collection
in `specs.json`. This seasonal collection is separate from the 30 Harry Potter
special products in `special-products-assets/`.

## Files and import

- `masters/`: 30 generated two-angle source PNGs; left default, right alternate.
- `native/`: 60 base PNGs plus 240 idle frames, at the declared native sizes.
- `spritesheets/`: 30 sheets, four frame columns and two angle rows.
- `thumbnails/2x/`, `thumbnails/3x/`: 120 integer-nearest thumbnails.
- `qa/collection-overview.png`: labelled collection; `qa/contact-sheet.png`: both views.
- `manifest.json`: import source, schema `hagrid-farm.decor-assets.v1`.
- `provenance.json`, `generation-log.json`, `prompts.json`: source/output hashes and generation records.
- `qa/validation.json` and `qa/final-integrity.json`: export and final checks.

Each item provides its ID, label/group/subject, footprint in tiles, native
width/height, bottom pivot, two base paths, four frame paths per angle,
durations, sprite sheet, thumbnails, palette and motion metadata. Each item
uses three ramps / at most 12 colors within the global 24-color sprite palette.
Native alpha is binary. No chapter references are invented for these generic
Halloween designs.

There are **19 items with localized glow and 11 static items**. Static items
retain four identical poses: blink, sway, bubbles and interactive actions are
not implemented without explicit semantic masks. Use `motionRendered` and
`framesIdentical` rather than treating the requested motion as finished.

The repository already imported the first five seasonal items. Import this
full manifest into the existing festival route while preserving their IDs,
ownership, prices and saves; add the other 25 once. The package itself changes
no runtime, wallet or server catalog. In-game, phone and production QA remain
part of the import task.

## Rebuild

With Node and Sharp available:

```sh
node build-assets.mjs
node qa/build-overview.mjs
```

If Sharp is installed elsewhere, set `SHARP_MODULE` to its module path for
each command. Full export fails when a required master is missing.
