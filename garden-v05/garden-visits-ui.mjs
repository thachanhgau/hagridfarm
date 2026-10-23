// «Thăm vườn» of real members (owner decision 19/10/2026, server callable visitHagridGarden):
// from level 10 the Thăm vườn panel lists recent member gardens; «Ghé thăm» draws one in the
// tour mode (read only) and «Chăm giúp» takes 15 minutes off its growing crops, 3 gardens a day.
import {el, button} from './ui-utils.mjs?v=24.9.70';

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

/** Panel section: locked below the visit level, else the server's list with «Ghé thăm». */
export function renderMemberVisits({level, visitLevel = 10, load, onVisit}) {
  const root = el('section', {class: 'member-visits'}, [el('p', {class: 'sheet-label', text: 'Vườn thành viên'})]);
  if (level < visitLevel) {
    root.append(el('p', {class: 'meta', text: `Từ cấp ${visitLevel} con sang thăm và chăm giúp vườn của thành viên khác được.`}));
    return root;
  }
  const list = el('div', {class: 'cards tour-cards-grid'}, [el('p', {class: 'meta', text: 'Đang tìm vườn…'})]);
  root.append(list);
  load().then(res => {
    const rows = res?.visits || [];
    list.replaceChildren(el('p', {class: 'meta', text: `Hôm nay còn ${res.helpsLeft} lượt chăm giúp.`}));
    if (!rows.length) list.append(el('p', {class: 'meta', text: 'Chưa có vườn nào khác.'}));
    for (const v of rows) {
      list.append(el('article', {class: 'card tour-garden-card', 'data-visit-uid': v.uid}, [
        el('div', {class: 'tour-card-top'}, [el('span', {class: 'journey-stage-badge', text: `Cấp ${v.level}`}), v.helped ? el('span', {class: 'almanac-status-pill is-ready', text: 'Đã giúp'}) : null]),
        el('strong', {class: 'tour-card-title', text: v.username || 'Thành viên'}),
        el('div', {class: 'actions'}, [button('Ghé thăm', () => onVisit(v.uid), {class: 'primary', 'data-visit': v.uid})]),
      ]));
    }
  }).catch(e => list.replaceChildren(el('p', {class: 'meta', text: e.message || 'Chưa tải được danh sách vườn.'})));
  return root;
}
