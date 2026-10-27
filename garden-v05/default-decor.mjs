import {DB} from './balance-data.mjs?v=24.9.86';
export const DEFAULT_DECOR_IDS = Object.freeze(['scene:pond', ...DB.decorations.map(d => d.id), ...DB.animals.map(a => 'keepsake:' + a.id)]);
export const isDefaultDecorHidden = (decorations, id) => Array.isArray(decorations?.hiddenDefaults) && decorations.hiddenDefaults.includes(id);
export function defaultDecorChoices(state) {
  return [
    {id: 'scene:pond', label: 'Ao trang trí'},
    ...DB.decorations.filter(d => state?.decorations?.includes(d.id)).map(d => ({id: d.id, label: d.label})),
    ...DB.animals.filter(a => Number(state?.keepsakes?.[a.id]) > 0).map(a => ({id: 'keepsake:' + a.id, label: 'Đài kỷ vật ' + a.label})),
  ];
}

// In-memory preview uses the same cosmetic transition as the account server.
export function applyDefaultDecorationVisibility(garden, {itemId, visible}) {
  const fail = (reason, message) => {throw Object.assign(new Error(message), {reason});};
  if (!DEFAULT_DECOR_IDS.includes(itemId) || typeof visible !== 'boolean') fail('invalid-action-input', 'Trang trí hoặc trạng thái không hợp lệ.');
  if (!defaultDecorChoices(garden.progression).some(entry => entry.id === itemId)) fail('decoration-not-owned', 'Bạn chưa có món trang trí này.');
  const hidden = garden.decorations.hiddenDefaults ?? [];
  if (hidden.includes(itemId) === !visible) fail('action-noop', 'Trang trí đã ở trạng thái này.');
  if (!Number.isSafeInteger(garden.progression.revision) || garden.progression.revision >= Number.MAX_SAFE_INTEGER) fail('invalid-garden-state', 'revision không hợp lệ.');
  const next = structuredClone(garden);
  const nextHidden = visible ? hidden.filter(id => id !== itemId) : [...hidden, itemId];
  if (nextHidden.length) next.decorations.hiddenDefaults = nextHidden;
  else delete next.decorations.hiddenDefaults;
  next.progression.revision++;
  return next;
}
