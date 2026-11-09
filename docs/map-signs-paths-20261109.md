# Clean plot borders, pen plaques and edge approach

Owner screenshots show a soft doubled plot outline, an isolated orange trail patch and cropped/occluded pen numbers. Built plots now retain their native raised border without a second translucent vector stroke; selected plots use an integral one-pixel staircase outline. Empty/unbuilt construction previews retain their existing rendering.

Pen names move to compact wooden plaques at each west-gate approach, col=pen.col-.75 and row=pen.row+height/2. Reuse the existing plot plaque style and label-scale behavior. Render complete plaques after scene objects, so fence posts/rails cannot overwrite the words. Keep construction percentage/locked-level states and existing pen numbering.

Remove the isolated edge/trail bitmap draw. Add a continuous native path from(26,16) to(44.5,16) only after edge land is open. It connects the main spine to the pasture/orchard aisle through the exact row15.5–16.5 gap between actual pens4/5. No plot/pen footprint, saved placement, economy or asset changes.

420 source checks pass,2 existing skips,0 failures (same historical progression fixture exclusion). Regression failed before the fix on pen-text render order and missing connected approach, then passed. New geometry check proves route avoids actual pen floors; selected outline uses integral1×1 edge pixels. Actual3026 evidence recorded separately in HPVNN. No push/deploy.
