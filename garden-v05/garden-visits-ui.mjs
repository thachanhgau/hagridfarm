// «Thăm vườn» of real members (owner decision 19/10/2026, server callable visitHagridGarden):
// from level 10 the Thăm vườn panel lists recent member gardens; «Ghé thăm» draws one in the
// tour mode (read only) and «Chăm giúp» takes 15 minutes off its growing crops, 3 gardens a day.
// Owner 01/11/2026: one grid of bare rows, gardens that can be helped first, «Thăm liên tục» walks
// them one after another from the banner (‹ ›), the host is told who helped, and a burning garden shows it.
import {el, button} from './ui-utils.mjs?v=24.9.92';
import {fireTimeLeft} from './garden-fire.mjs?v=24.9.92';

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

function status(v) {
  if (v.fire) return el('span', {class: 'visit-status is-fire', text: 'Đang cháy'});
  if (v.helped) return el('span', {class: 'visit-status is-done', text: 'Đã giúp'});
  if (v.growing > 0) return el('span', {class: 'visit-status is-open', text: `${v.growing} cây đang lớn`});
  return el('span', {class: 'visit-status', text: 'Chưa có cây'});
}

/** Panel section: locked below the visit level, else today's helpers and the gardens, one row each. */
export function renderMemberVisits({level, visitLevel = 10, load, onVisit, helpers = []}) {
  const root = el('section', {class: 'member-visits'}, [el('p', {class: 'sheet-label', text: 'Vườn thành viên'})]);
  if (level < visitLevel) {
    root.append(el('p', {class: 'meta', text: `Từ cấp ${visitLevel} con sang thăm và chăm giúp vườn của thành viên khác được.`}));
    return root;
  }
  if (helpers.length) {
    root.append(el('div', {class: 'visit-row visit-helpers'}, [
      el('span', {class: 'visit-avatar is-icon', 'aria-hidden': 'true', text: '🤝'}),
      el('span', {class: 'visit-name'}, [el('strong', {text: helperNames(helpers)}), el('small', {text: 'Chăm giúp vườn con hôm nay'})]),
      el('span', {class: 'visit-status is-done', text: `+${helpers.length * 15} phút`}),
    ]));
  }
  const list = el('div', {class: 'visit-list', role: 'list'}, [el('p', {class: 'meta', text: 'Đang tìm vườn…'})]);
  root.append(list);
  load().then(res => {
    const rows = visitOrder(res?.visits || []);
    const first = rows.find(canHelp);
    root.querySelector('.visit-head')?.remove();
    root.insertBefore(el('div', {class: 'visit-head'}, [
      el('span', {class: 'visit-left'}, [el('b', {text: String(res.helpsLeft)}), ' lượt chăm giúp']),
      first && res.helpsLeft > 0 ? button('Thăm liên tục ›', () => onVisit(first.uid, rows), {class: 'primary', 'data-visit-run': 'true'}) : null,
    ]), list);
    list.replaceChildren();
    if (!rows.length) list.append(el('p', {class: 'meta', text: 'Chưa có vườn nào khác.'}));
    for (const v of rows) {
      list.append(el('div', {class: 'visit-row' + (canHelp(v) ? ' can-help' : ''), role: 'listitem', 'data-visit-uid': v.uid}, [
        avatar(v.username, v.avatarUrl),
        el('span', {class: 'visit-name'}, [el('strong', {text: v.username || 'Thành viên'}), el('small', {text: `Cấp ${v.level}`})]),
        status(v),
        button('Ghé', () => onVisit(v.uid, rows), {class: canHelp(v) ? 'primary' : '', 'data-visit': v.uid}),
      ]));
    }
  }).catch(e => list.replaceChildren(el('p', {class: 'meta', text: e.message || 'Chưa tải được danh sách vườn.'})));
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
      'aria-label': v.username || 'Thành viên', 'aria-current': v.uid === current ? 'true' : 'false', 'data-visit-dot': v.uid}, [avatar(v.username, v.avatarUrl)]);
  }));
  queueMicrotask(() => strip.querySelector('.is-current')?.scrollIntoView?.({inline: 'center', block: 'nearest'}));
  return strip;
}

/** The banner while visiting a member: who, where in the run, the avatar strip, and ‹ Chăm giúp › Về vườn. */
export function visitBannerParts({tour, visit, helpsLeft = 0, queue = [], onHelp, onMove, onJump, onHome, now = Date.now()}) {
  const at = queue.findIndex(v => v.uid === tour.uid);
  const fire = visit.fire && visit.fire.until > now ? visit.fire : null;
  const sub = [`Cấp ${tour.level}`, `còn ${helpsLeft} lượt`, at >= 0 && queue.length > 1 ? `${at + 1}/${queue.length}` : null, fire ? `🔥 cháy ${fireTimeLeft(fire.until, now)}` : null].filter(Boolean).join(' · ');
  const many = queue.length > 1;
  return [
    avatar(tour.ownerName, visit.avatarUrl),
    el('div', {class: 'tour-banner-copy'}, [el('strong', {text: tour.ownerName}), el('small', {class: 'visit-sub', text: sub})]),
    many && onJump ? visitStrip(queue, tour.uid, onJump) : null,
    el('div', {class: 'tour-banner-actions'}, [
      many ? button('‹', () => onMove(-1), {class: 'visit-step', 'aria-label': 'Vườn trước', 'data-banner-prev-visit': 'true'}) : null,
      button(visit.helped ? 'Đã giúp' : 'Chăm giúp', onHelp, {class: visit.helped ? '' : 'primary', disabled: visit.helped || helpsLeft < 1 || visit.hostHelpsLeft < 1, 'data-banner-help-visit': tour.uid}),
      many ? button('Vườn tiếp ›', () => onMove(1), {class: visit.helped || helpsLeft < 1 ? 'primary' : '', 'data-banner-next-visit': 'true'}) : null,
      button('Về vườn', onHome, {'data-banner-stop-tour': 'true'}),
    ]),
  ];
}
