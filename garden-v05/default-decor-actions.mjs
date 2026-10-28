import {decorSpot, decorFacingFor} from './decor-runtime.mjs?v=24.9.89';
import {decorSpotProblem} from './decor-placement-ui.mjs?v=24.9.89';

export async function changeDefaultDecorationVisibility(ctx, itemId, visible) {
  const decorations = ctx.getDecorations?.() ?? {};
  if (visible) {
    const next = {...decorations, hiddenDefaults: (decorations.hiddenDefaults ?? []).filter(id => id !== itemId)};
    // A bought piece can replace the hidden default. Require clearing that
    // spot before putting the old piece back; preview/cancel never saves.
    for (const raw of decorations.placements ?? []) {
      const id = typeof raw === 'object' && raw ? raw.itemId ?? raw.id : raw;
      const at = id && decorSpot(decorations, id);
      if (!at) continue;
      const options = {map: ctx.map, stage: ctx.getStage?.(), state: ctx.getState?.(), itemId: id, facing: decorFacingFor(decorations, id), asset: ctx.assetOf?.(id), iso: ctx.iso, assetOf: ctx.assetOf};
      if (!decorSpotProblem(...at, {...options, decorations}) && decorSpotProblem(...at, {...options, decorations: next})) {
        ctx.notify?.('Vị trí cũ đang có món đã mua hoặc trang trí đang bày. Hãy dời món đó trước khi đặt lại.');
        return {ok: false};
      }
    }
  }
  return ctx.run(null, visible ? 'Đã đặt lại trang trí của vườn.' : 'Đã cất trang trí · bạn có thể đặt món đã mua vào chỗ trống.', {action: 'setDefaultDecorationVisibility', itemId, visible});
}
