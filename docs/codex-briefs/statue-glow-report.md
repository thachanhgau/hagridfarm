# 25.0 — Aura overlays for both elf statues

Completed 5/5 brief steps: two selected image-generated masters with exact prompts, 12 native glow PNGs, 12 lossless WebPs, four-facing preview and per-file verification. No commit, push, deployment or game-code integration.

Preview: [statue-glow-preview.png](statue-glow-preview.png). Four sections in order: dark default, dark turned, spring default, spring turned. Each contains the 1× strip followed by nearest-neighbour 3×. Columns: day; night; night + g0; night + g1; night + g2. Grass #3F6A45; night rgba(10,18,34,.44) composited before glow. Inspected all four sections. This is offline asset/composite evidence; runtime integration belongs to Claude Code.

## Masters and provenance

Built-in imagegen, referenced from the four original event-assets/native PNGs enlarged 3× nearest-neighbour into 1152×1056 reference sheets. One selected six-cell sheet per statue, default above turned, columns g0/g1/g2. The initial aura masters are retained in masters/variants/aura-v1/. Imagegen then corrected ONLY the ground halo into a visible flattened ellipse at the rear and sides of the plinth. Selected generated files: exec-9d85dad3-4675-48ad-b1b3-60a38a9f8b8a.png and exec-128ac0ad-a09c-49d8-903d-49eb2e9c952f.png, from generated_images/01a1a6d7-3944-70b2-84e7-4888fb900e1c.

- `masters/ev_dark_dobby_red.png`: 1310×1201, 2109901 B; SHA256 `8c9d470a05bc5135b0744b4aa9078f44a957467d9e1267eca5493c376e560e8a`. Exact original and selected-master edit prompts: `masters/ev_dark_dobby_red.txt`.
- `masters/ev_dobby_spring_rider.png`: 1310×1201, 2168904 B; SHA256 `c3148c2eacc2a8d97aad32a10a16ee3bfb58ef91c355d0f67018c5c763164bba`. Exact original and selected-master edit prompts: `masters/ev_dobby_spring_rider.txt`.

Before replacement, the six current dark-Dobby native PNGs and its current master/prompt were MOVED to masters/variants/trial-v1/. Earlier masters/variants/ev_dark_dobby_red-v1.* remain intact. The approved trial's registered eyes, runes and upper-left rim are preserved for the normal frame; the new generated master supplies its external aura and expanded ground halo.

## Native extraction and registration

Native overlays retain 128×176 RGBA canvas and (64,160) pivot. No original statue pixels were changed. Original statue ink boxes: dark default (14,10)–(114,159), dark turned (19,10)–(108,159); spring default (17,10)–(111,159), spring turned (18,10)–(110,159).

Selected-master statue registration boxes (inclusive, columns g0/g1/g2):
- Dark default: (48,35)–(382,541); (476,34)–(814,546); (923,38)–(1251,541).
- Dark turned: (64,635)–(374,1143); (498,629)–(812,1146); (938,636)–(1243,1137).
- Spring default: (62,34)–(374,536); (492,33)–(816,540); (942,35)–(1246,533).
- Spring turned: (64,626)–(380,1134); (495,625)–(819,1141); (945,631)–(1247,1130).

Crop/map each box to the corresponding original ink box with nearest-neighbour sampling. Extract only generated bright warm/cool pixels, quantise to the requested palette colours and register individual parts by up to 3 native pixels. No code-generated replacement art. Feature masks keep the eye cores inside original eye regions, the ember glyphs on original carved glyph pixels and the thin rim on original upper/left alpha edges. Spring includes all three eyes and a few coil sparkle pixels. Aura sits outside original alpha, with a bright first ring and checker-thinned outer band; stronger upper-left, sparser lower-right. Tiny recesses are not filled merely to force a complete outline. Plinth stone faces receive no glow except dark-Dobby's original carved runes.

Ground halo is sampled from imagegen's elliptical rear/side arcs, clipped to abs(x−64)/64 + abs(y−128)/32 ≤ 1 and fully outside original alpha. The plinth occludes the front/central ellipse. It is clearly visible at 1× and 3× without masking the runes. All ground-height aura pixels also obey this diamond. Every overlay remains in x4…123 with at least 1 transparent pixel around the canvas.

For flicker, g0 is the stable source geometry. g1 retains all g0 locations and adds source-supported outer-band/halo pixels (up to 1 pixel wider); g2 retains a subset of g0 rim/band/halo. Eyes and runes stay lit in every frame. No feature translates. Total glow luminance (g0/g1/g2): dark default 292620/321531/256110; dark turned 277891/304541/244289; spring default 320602/340027/283134; spring turned 285103/305609/253570. g0 is complete as a reduced-motion still.

## Verification and scope

All 12 checked for dimensions, four RGBA channels, alpha 0/255, zero RGB under transparency, PALETTE membership, x/margins, original-alpha feature registration, exterior-only aura, diamond-contained halo and fixed frame geometry. All 12 decoded WebPs match their PNG RGBA bytes exactly. Preview was regenerated from the final native PNGs and inspected at 1× and 3×.

Ran the requested SHARP_MODULE=... node garden-v05/build-runtime-webp.mjs, then node garden-v05/build-runtime-webp.mjs --check. PASS: 1195 lossless conversions + 8 existing WebP; builder verifies RGBA identity during encoding. Masters/variants remain excluded from the runtime inventory. Native/master files and palettes were not passed through the game's tint; tint is preview-only.

Initial checkout already had modified festival-lazy-art.test.mjs, garden-atmosphere.mjs, garden-winter.mjs and scene-renderer.mjs, plus the two generated WebP manifest/URL files and existing untracked glow documents/assets. Unrelated changes were preserved. This run's writes are limited to environment/statue-glow/**, runtime-webp/environment/statue-glow/**, runtime-webp-manifest.json, builder-generated runtime-image-url.mjs, this report and its preview. No event-assets/ or decor-assets/ changes; no handwritten .mjs, CSS, tests, functions/ or HPVNN edits.

## Per-file verdict

Files are relative to garden-v05/environment/statue-glow/. M/R/V/S/A/H = eyes / runes / rim / coil sparkles / aura / ground halo. ✓ confirms every retained part is registered to its feature or exterior/ground mask; 0 means not applicable. “Đạt” means ready for art handoff based on native and composite review, not owner approval or game/production proof.

| File | Canvas · bytes | Glow px | Ink box (inclusive) | M/R/V/S/A/H (px) | Verdict |
|---|---:|---:|---|---|---|
| ev_dark_dobby_red-g0.png | 128×176 · 1881 B | 1728 | (11,7)–(117,147) | 33/58/124/0/1301/212 ✓ | Đạt |
| ev_dark_dobby_red-g1.png | 128×176 · 1954 B | 1980 | (10,6)–(118,147) | 33/58/124/0/1528/237 ✓ | Đạt |
| ev_dark_dobby_red-g2.png | 128×176 · 1824 B | 1439 | (12,8)–(117,147) | 33/58/98/0/1082/168 ✓ | Đạt |
| ev_dark_dobby_red_right-g0.png | 128×176 · 1835 B | 1651 | (16,7)–(114,146) | 25/61/117/0/1220/228 ✓ | Đạt |
| ev_dark_dobby_red_right-g1.png | 128×176 · 1911 B | 1885 | (15,6)–(114,146) | 25/61/117/0/1446/236 ✓ | Đạt |
| ev_dark_dobby_red_right-g2.png | 128×176 · 1791 B | 1385 | (17,8)–(114,146) | 25/61/95/0/1019/185 ✓ | Đạt |
| ev_dobby_spring_rider-g0.png | 128×176 · 1852 B | 1803 | (7,7)–(119,136) | 62/0/305/6/1280/150 ✓ | Đạt |
| ev_dobby_spring_rider-g1.png | 128×176 · 1905 B | 1980 | (7,6)–(119,136) | 62/0/312/8/1434/164 ✓ | Đạt |
| ev_dobby_spring_rider-g2.png | 128×176 · 1765 B | 1513 | (7,8)–(119,136) | 62/0/243/5/1086/117 ✓ | Đạt |
| ev_dobby_spring_rider_right-g0.png | 128×176 · 1705 B | 1609 | (9,7)–(117,137) | 51/0/269/6/1110/173 ✓ | Đạt |
| ev_dobby_spring_rider_right-g1.png | 128×176 · 1757 B | 1792 | (9,6)–(117,137) | 51/0/269/9/1270/193 ✓ | Đạt |
| ev_dobby_spring_rider_right-g2.png | 128×176 · 1673 B | 1360 | (9,8)–(116,137) | 51/0/228/6/935/140 ✓ | Đạt |
