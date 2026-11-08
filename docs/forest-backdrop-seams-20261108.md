# Forest backdrop seams and repeated clearings

Owner reported two large empty areas outside the garden and sliced canopies at the world edge. The repeating CSS forest had the whole final-stage farm clearing removed in every repeated tile, and additional world-only forest placements were clipped by the world canvas without matching pixels on the surrounding background.

Use a dense periodic canopy background, with the actual world canvas alone owning the playable clearing. Wrapped canopy families are admitted/rejected together when they cross a world edge, so stage clearance cannot discard only one half. World-only perimeter, meadow-edge and unopened-stage trees must fit completely inside the world; wrapped wallpaper owns edge-crossing trees. Existing ground, trail, seasonal assets, saved grid and gameplay stay unchanged.

Checks: forest composition/clearance tests include a wooded background within the tile's former farm hole and matching canopy halves at opposite edges. Source suite405 pass /2 skip /0 fail, excluding the previously documented missing historical progression fixture; WebP pack1382+8 verified. Actual3026 visual acceptance is recorded with the HPVNN import. No push/deploy or physical-device claim.
