// Level-160 challenges (docs/level-160-challenges.md §2E, §2F), from the server's snapshot only (HPVNN
// garden-soil-core): snapshot.soil = [{tired, seeds: {species: mult}}] by plot from level 160, snapshot.weather =
// {type, start, end, announced} from level 200 while the week is announced or running.
import {duration} from './ui-utils.mjs?v=25.1.7';

export const WEATHER = Object.freeze({
 frost: {label: 'Sương giá Rừng Cấm', icon: 'frost', effects: 'Cây 8 giờ chậm ×1,5 · Củ u, Cỏ chút chít, Rong nước xiết ×2'},
 rain: {label: 'Mưa dầm', icon: 'rain', effects: 'Gieo không tốn nước · Ma lùm ×2'},
 drought: {label: 'Nắng hạn', icon: 'sun', effects: 'Cây 3 giờ tốn 2 nước · Hoa nhật quang, Ớt lửa ×2'},
});

const pct = mult => `${Math.round(mult * 100)}%`;
const dayMonth = ms => new Date(ms + 7 * 3600000).toISOString().slice(5, 10).split('-').reverse().join('/');

/** The HUD chip: icon, countdown (to the start, then to the end) and data-only labels; null when nothing to show. */
export function weatherChip(weather, now) {
 const info = WEATHER[weather?.type];
 if (!info || now >= weather.end || now < weather.announced) return null;
 const soon = now < weather.start, left = duration((soon ? weather.start : weather.end) - now);
 return {icon: info.icon, soon, text: left, aria: `${info.label} · ${soon ? 'bắt đầu sau' : 'còn'} ${left}`, title: `${info.label} · ${dayMonth(weather.start)}–${dayMonth(weather.end - 1)} · ${info.effects}`};
}

/** The owl note once a week: name, dates, effects. */
export function weatherOwlText(weather) {
 const info = WEATHER[weather.type];
 return `Thư cú: ${info.label} · ${dayMonth(weather.start)}–${dayMonth(weather.end - 1)} · ${info.effects}`;
}

/** Plots whose next harvest is cut (scene marker). */
export function tiredPlots(soil) {
 return new Set((soil || []).flatMap((plot, index) => (plot && plot.tired < 1 ? [index] : [])));
}

/** «−25%» on a seed that would harvest tired on this plot, '' otherwise. */
export function seedTiredTag(soil, plot, species) {
 const mult = soil?.[plot]?.seeds?.[species];
 return mult < 1 ? `−${Math.round((1 - mult) * 100)}%` : '';
}

/** Data-only label for a tired plot or seed: «Đất mệt · 75%». */
export const tiredLabel = mult => `Đất mệt · ${pct(mult)}`;
