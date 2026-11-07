# UI audit art delivery

40/40 deliverables. Bounding boxes use x,y,width,height; coordinates start at zero. B/C pivot y=56 means last ink row55, matching build-item-art.mjs. Four redraws preserve original canvas and bottom ink row. Sprite natives: nearest-neighbour, binary alpha, palette24. Event card is the unsnapped painterly exception. Icons are authored directly as grids. No game code, importer, git or release operations.

Built-in image_gen generated the raster art; sources.json records source paths and prompt summary. event_quidditch master is nearest enlarged from generated 1672x941 source to 2560x1440; it does not contain additional painted detail.

| id | master path | native path | native ink box | verdict |
|---|---|---|---|---|
| tan_suc | garden-v05/masters-items/ui-audit/tan_suc.png | docs/codex-briefs/ui-audit/native/tan_suc.png | 13,8,38,48 | good |
| chapter_1 | garden-v05/masters-items/ui-audit/chapter_1.png | docs/codex-briefs/ui-audit/native/chapter_1.png | 7,8,50,48 | good |
| chapter_2 | garden-v05/masters-items/ui-audit/chapter_2.png | docs/codex-briefs/ui-audit/native/chapter_2.png | 7,8,49,48 | good |
| chapter_3 | garden-v05/masters-items/ui-audit/chapter_3.png | docs/codex-briefs/ui-audit/native/chapter_3.png | 8,8,48,48 | good |
| chapter_4 | garden-v05/masters-items/ui-audit/chapter_4.png | docs/codex-briefs/ui-audit/native/chapter_4.png | 6,17,52,39 | good |
| chapter_5 | garden-v05/masters-items/ui-audit/chapter_5.png | docs/codex-briefs/ui-audit/native/chapter_5.png | 6,17,52,39 | good |
| chapter_6 | garden-v05/masters-items/ui-audit/chapter_6.png | docs/codex-briefs/ui-audit/native/chapter_6.png | 6,8,51,48 | good |
| chapter_7 | garden-v05/masters-items/ui-audit/chapter_7.png | docs/codex-briefs/ui-audit/native/chapter_7.png | 6,19,52,37 | good |
| bubble_heart_small | garden-v05/masters-items/ui-audit/bubble_heart_small.png | docs/codex-briefs/ui-audit/native/bubble_heart_small.png | 0,0,9,8 | good |
| ach_sprout_apprentice | garden-v05/masters-items/ui-audit/ach_sprout_apprentice.png | docs/codex-briefs/ui-audit/native/ach_sprout_apprentice.png | 15,16,33,40 | good |
| ach_creature_friend | garden-v05/masters-items/ui-audit/ach_creature_friend.png | docs/codex-briefs/ui-audit/native/ach_creature_friend.png | 16,16,32,40 | good |
| ach_herbology_artisan | garden-v05/masters-items/ui-audit/ach_herbology_artisan.png | docs/codex-briefs/ui-audit/native/ach_herbology_artisan.png | 15,16,33,40 | good |
| ach_master_brewer | garden-v05/masters-items/ui-audit/ach_master_brewer.png | docs/codex-briefs/ui-audit/native/ach_master_brewer.png | 15,16,33,40 | good |
| ach_forest_architect | garden-v05/masters-items/ui-audit/ach_forest_architect.png | docs/codex-briefs/ui-audit/native/ach_forest_architect.png | 15,16,33,40 | good |
| ach_landscape_artist | garden-v05/masters-items/ui-audit/ach_landscape_artist.png | docs/codex-briefs/ui-audit/native/ach_landscape_artist.png | 15,16,33,40 | good |
| ach_keepsake_curator | garden-v05/masters-items/ui-audit/ach_keepsake_curator.png | docs/codex-briefs/ui-audit/native/ach_keepsake_curator.png | 14,16,36,40 | good |
| ach_hippogriff_rider | garden-v05/masters-items/ui-audit/ach_hippogriff_rider.png | docs/codex-briefs/ui-audit/native/ach_hippogriff_rider.png | 14,16,36,40 | good |
| ach_unicorn_guardian | garden-v05/masters-items/ui-audit/ach_unicorn_guardian.png | docs/codex-briefs/ui-audit/native/ach_unicorn_guardian.png | 14,16,36,40 | good |
| ach_dragon_tamer | garden-v05/masters-items/ui-audit/ach_dragon_tamer.png | docs/codex-briefs/ui-audit/native/ach_dragon_tamer.png | 14,16,36,40 | good |
| ach_forest_envoy | garden-v05/masters-items/ui-audit/ach_forest_envoy.png | docs/codex-briefs/ui-audit/native/ach_forest_envoy.png | 14,16,35,40 | good |
| ach_grand_keeper | garden-v05/masters-items/ui-audit/ach_grand_keeper.png | docs/codex-briefs/ui-audit/native/ach_grand_keeper.png | 14,16,35,40 | good |
| seed_packet | garden-v05/masters-items/ui-audit/seed_packet.png | docs/codex-briefs/ui-audit/native/seed_packet.png | 12,8,40,48 | good |
| bubble_meal_ready | garden-v05/masters-items/ui-audit/bubble_meal_ready.png | docs/codex-briefs/ui-audit/native/bubble_meal_ready.png | 2,2,23,32 | good |
| bubble_hungry | garden-v05/masters-items/ui-audit/bubble_hungry.png | docs/codex-briefs/ui-audit/native/bubble_hungry.png | 2,2,23,32 | good |
| hero_yule | garden-v05/masters-items/ui-audit/hero_yule.png | docs/codex-briefs/ui-audit/native/hero_yule.png | 4,3,120,178 | good |
| hero_halloween | garden-v05/masters-items/ui-audit/hero_halloween.png | docs/codex-briefs/ui-audit/native/hero_halloween.png | 5,2,119,76 | good |
| hero_herbology | garden-v05/masters-items/ui-audit/hero_herbology.png | docs/codex-briefs/ui-audit/native/hero_herbology.png | 2,2,132,154 | good |
| cottage_corner | garden-v05/masters-items/ui-audit/cottage_corner.png | docs/codex-briefs/ui-audit/native/cottage_corner.png | 28,9,96,58 | good |
| event_quidditch | garden-v05/masters-items/ui-audit/event_quidditch.png | docs/codex-briefs/ui-audit/native/event_quidditch.png | 0,0,640,360 | good |
| star | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#star | docs/codex-briefs/ui-audit/native/star.png | 1,2,14,12 | good |
| star_empty | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#star_empty | docs/codex-briefs/ui-audit/native/star_empty.png | 1,2,14,12 | good |
| heart_empty | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#heart_empty | docs/codex-briefs/ui-audit/native/heart_empty.png | 1,3,14,12 | good |
| tansuc | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#tansuc | docs/codex-briefs/ui-audit/native/tansuc.png | 2,2,11,13 | good |
| work | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#work | docs/codex-briefs/ui-audit/native/work.png | 1,1,14,14 | good |
| acp | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#acp | docs/codex-briefs/ui-audit/native/acp.png | 2,1,13,14 | good |
| seal | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#seal | docs/codex-briefs/ui-audit/native/seal.png | 1,1,14,14 | good |
| guest_hagrid | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#guest_hagrid | docs/codex-briefs/ui-audit/native/guest_hagrid.png | 1,1,14,14 | good |
| guest_sprout | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#guest_sprout | docs/codex-briefs/ui-audit/native/guest_sprout.png | 1,0,14,15 | good |
| guest_newt | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#guest_newt | docs/codex-briefs/ui-audit/native/guest_newt.png | 1,1,14,14 | good |
| guest_charlie | docs/codex-briefs/ui-audit/pixel-icons-new.mjs#guest_charlie | docs/codex-briefs/ui-audit/native/guest_charlie.png | 1,1,14,14 | good |
