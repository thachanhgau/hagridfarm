// «Harry và bạn bè ghé vườn» (25.0 S6): five visits a day, 06–21 h Vietnam time, one group each, in an order the day
// picks; the server (HPVNN functions/games/garden-friend-core.js) keeps the same schedule and gives one small gift a
// visit, three a day (fence #36). Visitors walk the aisles like the gia tinh (garden-elves.mjs) and use its 80×80
// frame; Harry and Ron hover behind the plots passing the Quaffle, Fred and George light fireworks.
// Loaded 10 s after the first frame (mobile-game.mjs); its frames load the first time they are drawn.
import {elfPose} from './garden-elves.mjs?v=25.0.2';

const FRAME = {width: 80, height: 80, pivotX: 40, pivotY: 76, bounds: {x: 11, y: 8, w: 58, h: 69}};
const HOUR = 3600000, VN_OFFSET = 7 * HOUR, FIRST_HOUR = 6, VISIT_HOURS = 3, VISITS_PER_DAY = 5;
const LIFT = 34; // px a broom hovers above its spot
const PASS_MS = 1600; // the Quaffle crosses once per pass

export const GROUPS = Object.freeze({
  'harry-ron': ['harry', 'ron'], hermione: ['hermione'], neville: ['neville'], luna: ['luna'], ginny: ['ginny'], twins: ['fred', 'george'],
});

// Stops as in garden-elves.mjs ([col, row, pose, stay ms, faces right?]) where a standing visitor hides no plot frame
// and nothing covers it: row 1 behind Thửa 2, clear of the elves' spots on row 8 (garden-friends.test.mjs,
// character-cover.test.mjs). They may share spots with each other (one group at a time), never stand on an elf. Lines follow Lý Lan's wording («bồ», «banh
// tuyết», «pháo hoa bung xòe», «Kẻ Lý Sự», «vong mã», «Nhân sâm»).
export const FRIENDS = Object.freeze({
  harry: {name: 'Harry', poses: ['idle', 'walk-1', 'walk-2', 'fly-throw', 'fly-catch', 'snowball'], fly: [6.5, 1.9, true],
    lines: ['Chụp nè Ron!', 'Vườn của bác Hagrid đẹp quá trời!', 'Bồ có thấy Hedwig bay ngang đây không?']},
  ron: {name: 'Ron', poses: ['idle', 'walk-1', 'walk-2', 'fly-throw', 'fly-catch', 'snowball'], fly: [11.5, 1.9, false],
    lines: ['Bồ chụp trái Quaffle hay dữ!', 'Má mình gửi bánh cho bác Hagrid đó.', 'Ối, suýt rớt khỏi chổi!']},
  hermione: {name: 'Hermione', poses: ['idle', 'walk-1', 'walk-2', 'read', 'knit', 'snowball'],
    stops: [[7, 1, 'read', 5200], [10, 1, 'knit', 5200]],
    lines: ['Mình đan nón len cho gia tinh, bồ phụ mình nha?', 'Bồ vô Hội Vận động cho Quyền lợi Gia tinh không?', 'Sách nói Nhân sâm khóc là chết người đó!']},
  neville: {name: 'Neville', poses: ['idle', 'walk-1', 'walk-2', 'tend', 'pull', 'cheer'],
    stops: [[8.5, 1, 'tend', 5200], [11, 1, 'pull', 3200]],
    lines: ['Nhổ Nhân sâm phải bịt tai nha!', 'Bà nội mình mà thấy vườn này chắc mê lắm.', 'Trevor! Mày lại trốn đâu rồi?']},
  luna: {name: 'Luna', poses: ['idle', 'walk-1', 'walk-2', 'feed', 'read', 'cheer'],
    stops: [[8, 1, 'feed', 5200], [11.5, 1, 'read', 5200]],
    lines: ['Vong mã hiền lắm, tụi nó thích bồ đó.', 'Ba mình mới in số Kẻ Lý Sự mới.', 'Tuyết hôm nay có mùi bánh gừng.']},
  ginny: {name: 'Ginny', poses: ['idle', 'walk-1', 'walk-2', 'snowball', 'fly-throw', 'cheer'],
    stops: [[9.5, 1, 'snowball', 3600], [12, 1, 'cheer', 2400]],
    lines: ['Banh tuyết tới nè!', 'Coi chừng nha, mình là Truy thủ đó!', 'Anh Fred với anh George lại bày trò rồi.']},
  fred: {name: 'Fred', poses: ['idle', 'walk-1', 'walk-2', 'light', 'cheer', 'wave'],
    stops: [[7.5, 1, 'light', 4200], [9, 1, 'cheer', 2600]],
    lines: ['Pháo hoa bung xòe đây!', 'Đừng méc má nha!']},
  george: {name: 'George', poses: ['idle', 'walk-1', 'walk-2', 'light', 'cheer', 'wave'], art: 'fred',
    stops: [[10.5, 1, 'light', 4200], [12, 1, 'cheer', 2600]],
    lines: ['Tụi này mới chế loại pháo mới đó.', 'Fred, châm ngòi đi!']},
});

// FNV-1a 32-bit, as on the server: the day's order of groups.
function fnv(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/** Who is visiting at `now` (ms): {group, members, endsAt} or null at night. Same as the server's friendVisit. */
export function friendVisit(now) {
  const vn = new Date(now + VN_OFFSET);
  const slot = Math.floor((vn.getUTCHours() - FIRST_HOUR) / VISIT_HOURS);
  if (slot < 0 || slot >= VISITS_PER_DAY) return null;
  const dayKey = vn.toISOString().slice(0, 10);
  const group = Object.keys(GROUPS).sort((a, b) => fnv(`${dayKey}:${a}`) - fnv(`${dayKey}:${b}`))[slot];
  const endsAt = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate(), FIRST_HOUR + (slot + 1) * VISIT_HOURS) - VN_OFFSET;
  return {group, members: [...GROUPS[group]], endsAt};
}

const artOf = (id) => FRIENDS[id].art || id;
export const friendFile = (id, pose) => `environment/friends/${artOf(id)}/${pose}.png`;
export const FRIEND_FILES = [...new Set(Object.keys(FRIENDS).flatMap((id) => FRIENDS[id].poses.map((pose) => friendFile(id, pose))))];

// [col, row, pose, faces right?, lift px] of one visitor. Ginny throws snowballs only in winter and flies otherwise.
export function friendPose(id, clock, {winter = false} = {}) {
  const friend = FRIENDS[id];
  if (friend.fly) {
    const [col, row, right] = friend.fly;
    const passes = clock > 0 ? Math.floor(clock / PASS_MS) : 0, mine = (passes % 2 === 0) === (id === 'harry');
    const bob = clock > 0 ? Math.round(Math.sin(clock / 420 + (id === 'ron' ? 2 : 0)) * 3) : 0;
    return [col, row, mine ? 'fly-throw' : 'fly-catch', right, LIFT + bob];
  }
  const [col, row, pose, right] = elfPose(id, clock, friend.stops);
  if (pose === 'snowball' && !winter && friend.poses.includes('fly-throw')) return [col, row, 'fly-throw', right, LIFT];
  return [col, row, pose, right, 0];
}

const QUAFFLE = ['#874056', '#C75B4B'];
const SPARKS = ['#FFC36B', '#E07A9E', '#B7DEE0', '#B378FF', '#F5D69A'];

// The Quaffle between the two brooms (a 4 px ball on a low arc) and the twins' fireworks (rings of 2 px sparks).
function quaffle(from, to, clock) {
  const k = (clock % PASS_MS) / PASS_MS, x = Math.round(from[0] + (to[0] - from[0]) * k), y = Math.round(from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 18);
  return {kind: 'fx', xy: [x, y + 200], draw: (ctx) => { ctx.fillStyle = QUAFFLE[0]; ctx.fillRect(x - 2, y - 1, 4, 3); ctx.fillStyle = QUAFFLE[1]; ctx.fillRect(x - 1, y - 2, 3, 3); }};
}
export function fireworks(xy, clock, seed) {
  const t = (clock + seed * 700) % 2100;
  if (t > 1000) return null;
  const r = Math.round(6 + t / 1000 * 24), cx = xy[0] + ((Math.floor((clock + seed * 700) / 2100) * 37 + seed * 23) % 60) - 30, cy = xy[1] - 130;
  const color = SPARKS[(Math.floor(clock / 2100) + seed) % SPARKS.length], inner = SPARKS[(Math.floor(clock / 2100) + seed + 2) % SPARKS.length];
  return {kind: 'fx', xy: [cx, xy[1] + 300], draw: (ctx) => {
    for (const [ring, size, fill] of [[r, 3, color], [Math.round(r * 0.55), 2, inner]]) {
      ctx.fillStyle = fill;
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; ctx.fillRect(Math.round(cx + Math.cos(a) * ring) - 1, Math.round(cy + Math.sin(a) * ring * 0.8) - 1, size, size); }
    }
  }};
}

/** The visit at `now`: visitors (kind 'elf', drawn and picked like gia tinh) go into `elves`; returns the Quaffle and
 * fireworks (objects with their own `draw`). */
export function friendObjects(iso, clock, now = Date.now(), elves = [], {night = false, winter = false, cheering = {}, all = false} = {}) {
  // `all` (QA ?friends=all): every friend at once, for review.
  const visit = !night && (all ? {group: 'all', members: Object.keys(FRIENDS)} : friendVisit(now));
  if (!visit) return [];
  const people = visit.members.map((id) => {
    let [col, row, pose, flip, lift] = friendPose(id, clock, {winter});
    if (cheering[id] && !lift) pose = FRIENDS[id].poses.includes('cheer') ? 'cheer' : 'idle';
    const [x, y] = iso(col, row);
    return {kind: 'elf', id, friend: true, feet: [col, row], xy: [Math.round(x), Math.round(y) - lift], flip, asset: {...FRAME, file: friendFile(id, pose)}};
  });
  elves.push(...people);
  const fx = [];
  if (clock > 0 && visit.members.includes('harry')) {
    const [harry, ron] = ['harry', 'ron'].map((id) => people.find((o) => o.id === id)), hand = (o) => [o.xy[0] + (o.flip ? 14 : -14), o.xy[1] - 44];
    const harryThrows = Math.floor(clock / PASS_MS) % 2 === 0;
    fx.push(quaffle(...(harryThrows ? [hand(harry), hand(ron)] : [hand(ron), hand(harry)]), clock));
  }
  if (clock > 0) fx.push(...people.filter((o) => o.id === 'fred' || o.id === 'george').map((o, i) => fireworks(o.xy, clock, i)).filter(Boolean));
  return fx;
}

// The line a tap shows: the n-th tap on that friend picks the n-th line, looping.
export const friendLine = (id, taps) => FRIENDS[id].lines[taps % FRIENDS[id].lines.length];

// A greetFriend receipt as a toast: «Hermione tặng 💧 2 · Vớ len gia tinh 1 (2/3 hôm nay)».
const GIFT_LABEL = {water: '💧', boost: '✨'}, ITEM_LABEL = {elf_sock: 'Vớ len gia tinh', mandrake: 'Nhân sâm'};
export const friendGiftText = (friend) => `${FRIENDS[friend.friendId].name} tặng ${GIFT_LABEL[friend.gift.kind]} ${friend.gift.amount}`
  + (friend.gift.itemId ? ` · ${ITEM_LABEL[friend.gift.itemId] || friend.gift.itemId} ${friend.gift.bonusQty}` : '') + ` (${friend.gifts}/${friend.cap} hôm nay)`;

// A tap (`taps` counts from 1): a cheer, the line in a bubble over the friend (`line`), and the visit's gift once
// (server greetFriend, 3 a VN day) as a toast (`say`).
export function tapFriend(id, taps, {snapshot, claim, say, line, cheer}) {
  cheer(id);
  line(id, friendLine(id, taps - 1));
  const f = snapshot?.friends;
  if (!f?.visit || f.visit.gifted || f.gifts >= f.cap || !f.visit.members.includes(id)) return;
  claim({action: 'greetFriend', friendId: id}).then((r) => { if (r.ok && r.receipt?.friend) setTimeout(() => say(friendGiftText(r.receipt.friend)), 900); });
}
