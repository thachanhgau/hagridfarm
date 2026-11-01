// «Thăm vườn» of real members (owner decision 19/10/2026, server callable visitHagridGarden):
// from level 10 the Thăm vườn panel lists recent member gardens; «Ghé thăm» draws one in the
// tour mode (read only) and «Chăm giúp» takes 15 minutes off its growing crops, 3 gardens a day.
// Owner 01/11/2026: one grid of bare rows, gardens that can be helped first, «Thăm liên tục» walks
// them one after another from the banner (‹ ›), the host is told who helped, and a burning garden shows it.
import {el, button} from './ui-utils.mjs?v=24.9.92';
import {FIRE_SHEETS,fireTimeLeft} from './garden-fire.mjs?v=24.9.92';
import {runtimeImageUrl} from './runtime-image-url.mjs?v=24.9.92';

export const VISIT_ART = Object.freeze({hearth: 'environment/visit/floo-hearth.png', ring: 'environment/visit/portal-ring.png'});

/** A member's garden in the shape the tour mode draws (garden-tour.mjs buildHonorGardenSnapshot). */
export function buildVisitSnapshot(visit, weatherMode = 'clear') {
  const name = visit.username || 'Thành viên';
  return {
    tour: {id: 'visit:' + visit.uid, member: true, uid: visit.uid, ownerName: name, level: visit.level, title: 'Vườn của ' + name},
    visit,
    state: visit.progression,
    decorations: visit.decorations,
    decorationRotations: visit.progression?.decorationRotations || {},
    creatureFacings: {},
    atmosphereMode: 'day',
    weatherMode,
  };
}

const canHelp = v => !v.helped && v.growing > 0;
/** Helpable gardens first (most growing crops first), then the rest in the server's order. */
export function visitOrder(rows) {
  return rows.map((v, i) => [v, i]).sort(([a, i], [b, j]) => (canHelp(b) - canHelp(a)) || (canHelp(a) ? (b.growing - a.growing) : 0) || (i - j)).map(([v]) => v);
}

/** The next garden from `uid` in `queue` (dir 1 or -1), preferring one that can still be helped. */
export function nextVisit(queue, uid, dir = 1) {
  if (!queue.length) return null;
  const at = queue.findIndex(v => v.uid === uid);
  for (let step = 1; step <= queue.length; step += 1) {
    const v = queue[(at + dir * step + queue.length * step) % queue.length];
    if (v.uid !== uid && canHelp(v)) return v;
  }
  const v = queue[(at + dir + queue.length) % queue.length];
  return v && v.uid !== uid ? v : null;
}

function avatar(name, url) {
  return url
    ? el('img', {class: 'visit-avatar', src: url, alt: ''})
    : el('span', {class: 'visit-avatar', 'aria-hidden': 'true', text: (name || '?').trim().charAt(0).toUpperCase()});
}

const art = file => `url("${runtimeImageUrl(file)}")`;
const STATUS = v => v.fire ? ['is-fire', 'Đang cháy'] : v.helped ? ['is-helped', 'Đã giúp'] : v.growing > 0 ? ['can-help', `${v.growing} cây đang lớn`] : ['', 'Chưa có cây'];

/** One garden as a Floo portal: the member's avatar in a vine ring, level on the ring, tap to fly there. */
export function portalTile(v, onVisit, {state: forcedState, text: forcedText} = {}) {
  const [state, text] = forcedState !== undefined ? [forcedState, forcedText] : STATUS(v);
  return el('button', {type: 'button', class: `visit-tile ${state}`, role: 'listitem', onclick: onVisit, 'data-visit': v.uid, 'aria-label': `${v.username || 'Thành viên'}, cấp ${v.level}, ${text}`}, [
    el('span', {class: 'visit-portal'}, [
      avatar(v.initialOf || v.username, v.avatarUrl),
      el('img', {class: 'visit-ring', src: VISIT_ART.ring, alt: '', onerror: e => e.target.remove()}),
      v.fire ? el('span', {class: 'visit-flame', 'aria-hidden': 'true'}) : null,
      el('span', {class: 'visit-level', text: String(v.level)}),
    ]),
    el('strong', {class: 'visit-tile-name', text: v.username || 'Thành viên'}),
    el('small', {class: 'visit-status', text}),
  ]);
}

/** Panel section: locked below the visit level, else the Floo hearth (helps left, gardens waiting, «Bay Floo»),
 * today's helpers as an avatar stack, and every garden as a portal tile. */
export function renderMemberVisits({level, visitLevel = 10, load, onVisit, helpers = []}) {
  const root = el('section', {class: 'member-visits'});
  root.style.setProperty('--hearth', art(VISIT_ART.hearth));
  root.style.setProperty('--flame', art(FIRE_SHEETS.small.file));
  if (level < visitLevel) {
    root.append(el('div', {class: 'visit-hero is-locked'}, [el('div', {class: 'visit-hero-copy'}, [el('b', {text: `Cấp ${visitLevel}`}), el('span', {text: 'mở Thăm vườn'})])]));
    return root;
  }
  const hero = el('div', {class: 'visit-hero'}, [el('div', {class: 'visit-hero-copy'}, [el('b', {text: '…'}), el('span', {text: 'lượt chăm giúp'})])]);
  root.append(hero);
  if (helpers.length) {
    const names = [...new Map(helpers.map(h => [h.name, h])).values()];
    root.append(el('div', {class: 'visit-helpers'}, [
      el('span', {class: 'visit-stack', 'aria-hidden': 'true'}, names.slice(0, 4).map(h => avatar(h.name))),
      el('span', {class: 'visit-name'}, [el('strong', {text: helperNames(helpers)}), el('small', {text: 'chăm giúp hôm nay'})]),
      el('b', {class: 'visit-bonus', text: `+${helpers.length * 15} phút`}),
    ]));
  }
  const grid = el('div', {class: 'visit-grid', role: 'list', 'aria-busy': 'true'}, Array.from({length: 6}, () => el('span', {class: 'visit-tile is-ghost', 'aria-hidden': 'true'}, [el('span', {class: 'visit-portal'})])));
  root.append(grid);
  load().then(res => {
    const rows = visitOrder(res?.visits || []), waiting = rows.filter(canHelp), left = res.helpsLeft ?? 0;
    const go = waiting.length && left > 0;
    hero.replaceChildren(
      el('div', {class: 'visit-hero-copy'}, [el('b', {text: String(left)}), el('span', {text: 'lượt chăm giúp'}), el('small', {text: `${waiting.length} vườn đang chờ`})]),
      button(go ? 'Bay Floo ›' : left > 0 ? 'Chưa vườn nào cần' : 'Hết lượt hôm nay', () => onVisit(waiting[0].uid, rows), {class: 'primary visit-hero-go', disabled: !go, 'data-visit-run': 'true'}),
    );
    grid.removeAttribute('aria-busy');
    grid.replaceChildren(...(rows.length ? rows.map(v => portalTile(v, () => onVisit(v.uid, rows))) : [el('p', {class: 'meta', text: 'Chưa có vườn nào khác.'})]));
  }).catch(e => grid.replaceChildren(el('p', {class: 'meta', text: e.message || 'Chưa tải được danh sách vườn.'})));
  return root;
}

export function helperNames(helpers) {
  const names = [...new Set(helpers.map(h => h.name))];
  return names.length <= 2 ? names.join(' và ') : `${names.slice(0, 2).join(', ')} và ${names.length - 2} người khác`;
}

/** Helpers the host has not been told about yet (newer than `seenAt`), and the toast line for them. */
export function newHelpers(helpers = [], seenAt = 0) {
  const fresh = helpers.filter(h => h.at > seenAt);
  if (!fresh.length) return null;
  const minutes = fresh.length * 15;
  return {text: `🤝 ${helperNames(fresh)} đã chăm giúp vườn con · cây chín sớm ${minutes} phút`, seenAt: Math.max(...fresh.map(h => h.at))};
}

/** The run as a strip of avatars: tap one to fly there; ✓ helped, flame ring burning, glow can still be helped. */
function visitStrip(queue, current, onJump) {
  const strip = el('div', {class: 'visit-strip', role: 'group', 'aria-label': 'Các vườn trong lượt thăm'}, queue.map(v => {
    const state = v.uid === current ? ' is-current' : v.fire ? ' is-fire' : v.helped ? ' is-helped' : canHelp(v) ? ' can-help' : '';
    return el('button', {type: 'button', class: 'visit-dot' + state, onclick: () => v.uid !== current && onJump(v.uid),
      'aria-label': v.username || 'Thành viên', 'aria-current': v.uid === current ? 'true' : 'false', 'data-visit-dot': v.uid}, [avatar(v.initialOf || v.username, v.avatarUrl)]);
  }));
  queueMicrotask(() => strip.querySelector('.is-current')?.scrollIntoView?.({inline: 'center', block: 'nearest'}));
  return strip;
}

/** The banner while visiting a member: who, where in the run, the avatar strip, and ‹ Chăm giúp › Về vườn. */
export function visitBannerParts({tour, visit, helpsLeft = 0, queue = [], onHelp, onMove, onJump, onHome, fireButtons = [], now = Date.now()}) {
  const at = queue.findIndex(v => v.uid === tour.uid);
  const fire = visit.fire && visit.fire.until > now ? visit.fire : null;
  const sub = [`Cấp ${tour.level}`, `còn ${helpsLeft} lượt`, at >= 0 && queue.length > 1 ? `${at + 1}/${queue.length}` : null, fire ? `🔥 cháy ${fireTimeLeft(fire.until, now)}` : null].filter(Boolean).join(' · ');
  const many = queue.length > 1;
  return [
    avatar(tour.initialOf || tour.ownerName, visit.avatarUrl),
    el('div', {class: 'tour-banner-copy'}, [el('strong', {text: tour.ownerName}), el('small', {class: 'visit-sub', text: sub})]),
    many && onJump ? visitStrip(queue, tour.uid, onJump) : null,
    fireButtons.length ? el('div', {class: 'visit-fire-row'}, fireButtons) : null,
    el('div', {class: 'tour-banner-actions'}, [
      many ? button('‹', () => onMove(-1), {class: 'visit-step', 'aria-label': 'Vườn trước', 'data-banner-prev-visit': 'true'}) : null,
      button(visit.helped ? 'Đã giúp' : 'Chăm giúp', onHelp, {class: visit.helped ? '' : 'primary', disabled: visit.helped || helpsLeft < 1 || visit.hostHelpsLeft < 1, 'data-banner-help-visit': tour.uid}),
      many ? button('Vườn tiếp ›', () => onMove(1), {class: visit.helped || helpsLeft < 1 ? 'primary' : '', 'data-banner-next-visit': 'true'}) : null,
      button('Về vườn', onHome, {'data-banner-stop-tour': 'true'}),
    ]),
  ];
}
