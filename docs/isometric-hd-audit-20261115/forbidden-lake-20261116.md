# Larger Forbidden Lake, 16 November 2026

Owner steering superseded the first decorative-pond draft: make this the Forbidden Lake, larger and darker with dense woodland, leaving water for later creatures. All three built pond tiers now share the same ancient forest-lake scene. Physical footprint 11×8 (88 tiles), previously 9×6 (54): +62.96%. Native canvas 608×486, pivot (304,476), ground centre (304,332); genuine HD 1216×972. No new creature capacity or economy values were requested or changed.

Source generation uses built-in image_gen with the frozen `forbidden-guide.png` and actual garden/previous lake references. Selected normal/winter masters, export crop/placement, input guide coordinates and hashes live under `garden-v05/environment/pond/masters/coordinate-locked-20261116/`. Same shared crop and uniform export for both seasons; palette snapped to the existing sprite palette plus winter white, binary alpha. No post-export skew/rotation. The front/side shoreline is irregular organic terrain; local observed plank support (0.75 native px) and its exact mirrored view are documented in `forbidden-lake-proof.json`, without asserting exact whole-shore/corner certification. Winter snow covers that exposed plank segment.

The footprint stays inside reserved POND_LAND: cols15–26, rows−11.5…−3.5, centred on the existing col20.5 approach. The nook moves one column left to clear the larger bank; six existing thickets move around the outside. All tiers share the same location and image size, so upgrades do not jump the lake. Dynamic fish and creatures remain separate from the artwork. Source and HPVNN server balance metadata use the same footprints; prices, unlocks, times, capacities, saves and backend behavior remain unchanged.

Rebuild: `node garden-v05/build-coordinate-pond.mjs`, WebP, HD, WebP, then runtime check. The old pond builder delegates these three tiers to the new authored export, preventing accidental rollback. The winter provenance inventory now identifies the new 1× native masters rather than the superseded 2× cluster exports; legacy winter assets retain their original tests.

Verification: `qa-v19/check-forbidden-lake.mjs` verifies all six native/HD exports and frozen source hashes. Geometry test covers reserved land, all ten paddies, the nook and the approach. Existing 107 replacement pixel checks and 13 protected image checks pass. Full test counts and actual HTTP results are recorded in the HPVNN follow-up report.

The full-suite pass also caught two earlier aura integration gaps: one off-palette sparkle literal and an unstamped module export. These are repaired using the existing gold palette and release-stamped import; approved aura shape/motion is retained.

Rejected decorative-pond drafts and the first larger-lake draft were copied, hash-verified and retained under primary `resource/hagrid/isometric-hd-audit-20261115/pond-prototype-drafts-20261116/`, not shipped as selected art. No push, deployment or production data changes.
