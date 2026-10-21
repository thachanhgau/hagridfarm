// «Sổ tay bác Hagrid» (owner decision 18/10/2026): after the first-three-minutes tutorial,
// one short lesson at a time walks a new player through every action up to level 20.
// A lesson opens at its level, shows only when it can be acted on, lights the button to
// press (first visible selector wins) and finishes from the real game fact or event, so a
// player who already did it is never asked. «Đã hiểu» always finishes it too.
// With a wallet the finished ids live on the server (garden.tutorial.guide, action guideDone).

const L = (id, level, title, line, targets, done, when = null) => Object.freeze({id, level, title, line, targets: Object.freeze(targets), done, when});

export const GUIDE = Object.freeze([
  L('care', 1, 'Chăm cây', 'Hàng cây đang lớn thì bấm Chăm: chín sớm 1/4 thời gian, mỗi ngày 3 lượt.',
    ['#contextAction', '#cropCareButton', '#seedOptionsButton'], f => f.ev.has('care'), f => f.growing),
  L('owl-claim', 1, 'Thư cú', 'Làm xong việc cú giao thì mở thư cú nhận quà nhé!',
    ['#owlMailButton'], f => f.ev.has('claimQuest'), f => f.questReady),
  L('chest', 1, 'Rương Cú Vàng', 'Xong cả ba việc cú giao, mở Rương Cú Vàng lấy Nước phép!',
    ['#owlMailButton'], f => f.ev.has('claimChest'), f => f.chestReady),
  L('shop', 1, 'Cửa hàng', 'Sắp hết hạt hay nước thì ghé Cửa hàng mua thêm.',
    ['#shopButton'], f => f.ev.has('buy'), f => f.connected && f.lowSupplies),
  L('mix', 2, 'Gieo xen', 'Cúc trắng mở rồi! Mỗi thửa trồng được tới ba loại cây.',
    ['#seedTray [data-id="daisy"]', '#sowTool'], f => f.planted('daisy')),
  L('decor', 3, 'Trang trí', 'Mở Trang trí xem đồ mới cho vườn nhé con.',
    ['#sceneryButton'], f => f.ev.has('panel:scenery') || f.decorated),
  L('roadmap', 4, 'Lộ trình', 'Bấm vào cấp của con để xem đường lên cấp và quà sắp mở.',
    ['#levelButton'], f => f.ev.has('panel:profile') || f.ev.has('panel:roadmap')),
  L('build-intro', 5, 'Xây dựng', 'Nông sản để dành mở thửa, mở chuồng. Xem ở nút Xây dựng.',
    ['#buildTool'], f => f.ev.has('mode:build')),
  L('boost', 6, 'Nước phép', 'Chọn hàng đang lớn, bấm Nước phép trên khay: cả hàng lớn nhanh hơn.',
    ['#dockBoost', '#boostButton', '#contextOptions', '#seedOptionsButton'], f => f.ev.has('boost'), f => f.growing && f.boost > 0),
  L('pattern', 7, 'Gieo lại theo mẫu', 'Gặt xong, «Gieo lại» trồng lại đúng mẫu cũ của thửa.',
    ['#replantButton', '#contextOptions', '#seedOptionsButton'], f => f.ev.has('replant')),
  L('craft', 9, 'Bàn thức ăn', 'Đem bí ngô làm Khẩu phần Bí ngô ở Bàn thức ăn.',
    ['#craftTool'], f => f.has('puff_feed') || f.ev.has('craft')),
  L('pen', 10, 'Mở chuồng', 'Chuồng đầu tiên miễn phí! Vào Xây dựng mở chuồng nào.',
    ['#buildTool'], f => f.built('pen_1') || f.building('pen_1')),
  L('adopt', 10, 'Đón Puffskein', 'Chuồng xong rồi, đón Puffskein về nuôi thôi!',
    ['#adoptButton', '#creatureTool'], f => f.creatures > 0, f => f.built('pen_1')),
  L('feed', 10, 'Cho ăn', 'Cho sinh vật ăn; đủ bữa nó lớn và cho sản phẩm.',
    ['#feedButton', '#creatureTool'], f => f.fed, f => f.creatures > 0),
  L('claim-animal', 10, 'Thu sản phẩm', 'Ăn xong rồi! Bấm Nhận để thu sản phẩm.',
    ['#claimAnimalButton', '#creatureTool'], f => f.ev.has('claimAnimals'), f => f.mealReady),
  L('pet', 10, 'Vuốt ve', 'Vuốt ve mỗi ngày cho sinh vật thân với con hơn; con đang ăn thì bữa xong sớm hơn.',
    ['#petButton', '#creatureOptionsButton', '#creatureTool'], f => f.ev.has('pet'), f => f.creatures > 0),
  L('plot4', 12, 'Thửa thứ tư', 'Đủ bí ngô với yến mạch là mở được thửa thứ tư!',
    ['#buildTool'], f => f.built('plot_4') || f.building('plot_4')),
  L('fruit', 13, 'Khẩu phần trái cây', 'Bàn thức ăn có món mới: Khẩu phần trái cây.',
    ['#craftTool'], f => f.has('puff_fruit') || f.ev.has('craft:puff_fruit')),
  L('cake', 14, 'Bánh Bí ngô', 'Bánh Bí ngô để dành cho Puffskein đó con.',
    ['#craftTool'], f => f.has('puff_cake') || f.ev.has('craft:puff_cake')),
  L('dittany', 16, 'Bạch tiễn', 'Bạch tiễn mở rồi, gieo thử một hàng đi con!',
    ['#seedTray [data-id="dittany"]', '#sowTool'], f => f.planted('dittany')),
  L('insects', 17, 'Hộp côn trùng', 'Hộp côn trùng nuôi mồi cho Que Xạo; chờ xong thì nhận.',
    ['#craftTool'], f => f.has('insects') || f.ev.has('craft:insects')),
  L('bowtruckle', 18, 'Đón Que Xạo', 'Que Xạo tới rồi! Nhớ làm sẵn khẩu phần cành lá.',
    ['#adoptButton', '#creatureTool'], f => f.hasCreature('bowtruckle')),
  L('level20', 20, 'Cấp 20', 'Cây, bữa ăn và chế biến vẫn nhanh gấp đôi, mãi mãi; Nước phép và Chăm cây còn rút thêm.',
    [], () => false),
]);

/** Facts a lesson reads. `ev` holds this session's events: actions, 'craft:<recipe>', 'panel:<name>', 'mode:<mode>'. */
export function guideFacts({E, state, now, snapshot = null, connected = false, ev = new Set()}) {
  const slots = (state.plots || []).flatMap(plot => plot?.slots || []).filter(Boolean);
  const daily = snapshot?.daily;
  const supplies = snapshot?.garden?.supplies;
  const decorations = snapshot?.garden?.decorations;
  const creatures = state.creatures || [];
  return {
    ev, connected,
    growing: slots.some(entry => entry.type === 'crop' && !E.growth(entry, now).mature),
    questReady: Boolean(daily?.quests?.some(q => !q.claimed && q.progress >= q.target)),
    chestReady: Boolean(daily?.chest?.ready),
    lowSupplies: Boolean(supplies) && (supplies.water < 3 || Object.values(supplies.seeds || {}).reduce((a, b) => a + b, 0) < 3),
    boost: supplies?.boost ?? 0,
    decorated: Boolean(decorations?.placements?.some(Boolean)),
    creatures: creatures.length,
    fed: creatures.some(c => c.meal || c.mealsCompleted > 0),
    mealReady: creatures.some(c => c.meal && c.meal.readyAt <= now),
    planted: species => slots.some(entry => entry.species === species) || (state.inventory?.[species] || 0) > 0,
    has: id => (state.inventory?.[id] || 0) > 0,
    built: id => (state.built || []).includes(id),
    building: id => (state.construction || []).some(job => job.id === id),
    hasCreature: id => creatures.some(c => c.species === id),
  };
}

export const GUIDE_LAST_LEVEL = 20;

/** Lessons up to `level` whose fact is already true: finish them without showing. */
export function guideAutoDone(level, facts, done) {
  if (level > GUIDE_LAST_LEVEL) return [];
  return GUIDE.filter(lesson => lesson.level <= level && !done.has(lesson.id) && lesson.done(facts)).map(lesson => lesson.id);
}

/** The lesson to show now: lowest level first, open, not done, and actionable. Past level 20 the notebook rests. */
export function nextLesson(level, facts, done) {
  if (level > GUIDE_LAST_LEVEL) return null;
  return GUIDE.find(lesson => lesson.level <= level && !done.has(lesson.id) && !lesson.done(facts) && (!lesson.when || lesson.when(facts))) || null;
}
